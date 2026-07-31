import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

const money = (value: unknown) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string) {
  let lastError = "Modelo Gemini indisponível";

  for (const model of GEMINI_MODELS) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.6, responseMimeType: "application/json" },
      }),
    });

    if (response.ok) {
      const aiData = await response.json();
      const reportText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reportText) return { reportText, model };
      lastError = `Resposta vazia do modelo ${model}`;
      continue;
    }

    const errorText = await response.text();
    lastError = `Gemini ${model} retornou ${response.status}: ${errorText}`;
    console.error("Gemini error:", { model, status: response.status, errorText });

    if (![404, 429].includes(response.status)) break;
  }

  if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED") || lastError.includes("Quota")) {
    throw new Error("Cota da API Gemini excedida ou sem billing ativo. Aguarde alguns minutos ou utilize uma nova chave no AI Studio.");
  }

  throw new Error(lastError);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada no backend." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Variáveis do banco não configuradas no backend." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all data
    const [contractsRes, clientsRes, employeesRes] = await Promise.all([
      supabase.from("contracts").select("*").eq("user_id", user.id),
      supabase.from("clients").select("*").eq("user_id", user.id),
      supabase.from("employees").select("*").eq("user_id", user.id),
    ]);

    const contracts = contractsRes.data || [];
    const clients = clientsRes.data || [];
    const employees = employeesRes.data || [];

    const activeContracts = contracts.filter((c: any) => c.status === "ativo" || c.status === "active");
    const totalRevenue = activeContracts.reduce((s: number, c: any) => s + Number(c.contract_value || 0), 0);
    const totalSalaries = employees.filter((e: any) => e.status === "ativo" || e.status === "active").reduce((s: number, e: any) => s + (e.salary || 0), 0);
    const profit = totalRevenue - totalSalaries;

    const contextData = `
DADOS FINANCEIROS DO NEGÓCIO:

CONTRATOS (${contracts.length} total):
- Ativos: ${activeContracts.length} | Receita ativa: ${money(totalRevenue)}
- Pendentes: ${contracts.filter((c: any) => c.status === "pendente").length}
- Cancelados: ${contracts.filter((c: any) => c.status === "cancelado").length}
${contracts.slice(0, 20).map((c: any) => `  • ${c.client_name || c.title || 'Cliente'}: ${money(c.contract_value)} (${c.status}, risco: ${c.risk_level || 'N/A'})`).join('\n')}

CLIENTES (${clients.length} total):
- Cadastrados: ${clients.length}

FUNCIONÁRIOS (${employees.length} total):
- Ativos: ${employees.filter((e: any) => e.status === "ativo" || e.status === "active").length}
- Folha salarial mensal: ${money(totalSalaries)}

RESUMO:
- Receita mensal (contratos ativos): ${money(totalRevenue)}
- Despesa mensal (salários): ${money(totalSalaries)}
- Lucro estimado: ${money(profit)}
- Margem: ${totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0}%
`;

    const systemPrompt = `Você é um consultor financeiro especializado em PMEs brasileiras. Analise os dados e retorne APENAS um JSON puro (sem markdown, sem comentários) com esta estrutura exata:
{
  "resumo": "frase curta sobre saúde financeira",
  "score": número de 0-100,
  "insights": ["insight 1", "insight 2", "insight 3"],
  "alertas": ["alerta 1"],
  "recomendacoes": ["rec 1", "rec 2", "rec 3"],
  "metricas": {
    "receita_mensal": número,
    "despesa_mensal": número,
    "lucro_mensal": número,
    "margem_percentual": número
  }
}`;

    const { reportText } = await callGemini(GEMINI_API_KEY, systemPrompt, contextData);

    let analysis;
    try {
      const cleanText = reportText.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleanText);
    } catch {
      analysis = {
        resumo: "Análise baseada nos dados disponíveis",
        score: totalRevenue > 0 ? Math.min(Math.round((profit / totalRevenue) * 100), 100) : 0,
        insights: ["Dados processados com sucesso"],
        alertas: [],
        recomendacoes: ["Monitore os contratos ativos e despesas fixas regularmente"],
        metricas: { 
          receita_mensal: totalRevenue, 
          despesa_mensal: totalSalaries, 
          lucro_mensal: profit, 
          margem_percentual: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0 
        },
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
