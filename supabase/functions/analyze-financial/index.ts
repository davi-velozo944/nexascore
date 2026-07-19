import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const activeContracts = contracts.filter((c: any) => c.status === "ativo");
    const totalRevenue = activeContracts.reduce((s: number, c: any) => s + c.contract_value, 0);
    const totalSalaries = employees.filter((e: any) => e.status === "ativo").reduce((s: number, e: any) => s + (e.salary || 0), 0);
    const profit = totalRevenue - totalSalaries;

    const contextData = `
DADOS FINANCEIROS DO NEGÓCIO:

CONTRATOS (${contracts.length} total):
- Ativos: ${activeContracts.length} | Receita ativa: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Pendentes: ${contracts.filter((c: any) => c.status === "pendente").length}
- Cancelados: ${contracts.filter((c: any) => c.status === "cancelado").length}
${contracts.slice(0, 20).map((c: any) => `  • ${c.client_name}: R$ ${c.contract_value.toLocaleString('pt-BR')} (${c.status}, risco: ${c.risk_level || 'N/A'})`).join('\n')}

CLIENTES (${clients.length} total):
- Ativos: ${clients.filter((c: any) => c.status === "ativo").length}

FUNCIONÁRIOS (${employees.length} total):
- Ativos: ${employees.filter((e: any) => e.status === "ativo").length}
- Folha salarial mensal: R$ ${totalSalaries.toLocaleString('pt-BR')}

RESUMO:
- Receita mensal (contratos ativos): R$ ${totalRevenue.toLocaleString('pt-BR')}
- Despesa mensal (salários): R$ ${totalSalaries.toLocaleString('pt-BR')}
- Lucro estimado: R$ ${profit.toLocaleString('pt-BR')}
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: contextData }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições do Gemini excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro na análise de IA");
    }

    const aiData = await response.json();
    const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Fallback
      analysis = {
        resumo: "Análise baseada nos dados disponíveis",
        score: totalRevenue > 0 ? Math.min(Math.round((profit / totalRevenue) * 100), 100) : 0,
        insights: ["Dados insuficientes para análise completa"],
        alertas: [],
        recomendacoes: ["Cadastre mais contratos para uma análise mais precisa"],
        metricas: { receita_mensal: totalRevenue, despesa_mensal: totalSalaries, lucro_mensal: profit, margem_percentual: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0 },
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
