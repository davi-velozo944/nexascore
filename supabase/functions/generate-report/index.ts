import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash"];

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
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.6 },
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
    throw new Error("Cota da API Gemini excedida ou sem billing ativo. Aguarde alguns minutos ou habilite faturamento/aumente a cota no Google AI Studio.");
  }

  throw new Error(lastError);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = "all" } = await req.json().catch(() => ({ type: "all" }));
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada no backend." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from auth header
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

    // Fetch relevant data based on report type
    let contextData = "";
    
    if (type === "contracts" || type === "all") {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .limit(100);
      
      if (contracts && contracts.length > 0) {
        contextData += `\n\nCONTRATOS (${contracts.length} total):\n`;
        contextData += contracts.map(c => 
          `- ${c.client_name || c.title || "Cliente não informado"}: ${money(c.contract_value)}, ${c.duration_months || "N/A"} meses, Status: ${c.status || "N/A"}, Risco: ${c.risk_level || 'N/A'}`
        ).join('\n');
        
        const totalValue = contracts.reduce((sum, c) => sum + Number(c.contract_value || 0), 0);
        const activeContracts = contracts.filter(c => c.status === 'active').length;
        const highRisk = contracts.filter(c => c.risk_level === 'high').length;
        
        contextData += `\n\nResumo: Valor total: ${money(totalValue)}, Ativos: ${activeContracts}, Alto risco: ${highRisk}`;
      } else {
        contextData += "\n\nNenhum contrato encontrado.";
      }
    }
    
    if (type === "financial" || type === "all") {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      
      if (contracts && contracts.length > 0) {
        const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.contract_value || 0), 0);
        const avgValue = totalRevenue / contracts.length;
        
        contextData += `\n\nFINANCEIRO:\n`;
        contextData += `- Receita total prevista: ${money(totalRevenue)}\n`;
        contextData += `- Contratos ativos: ${contracts.length}\n`;
        contextData += `- Ticket médio: ${money(avgValue)}\n`;
      } else {
        contextData += "\n\nNenhum dado financeiro disponível.";
      }
    }
    
    if (type === "clients" || type === "all") {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("client_name, contract_value, status")
        .eq("user_id", user.id);
      
      if (contracts && contracts.length > 0) {
        const clientMap = new Map();
        contracts.forEach(c => {
          const clientName = c.client_name || "Cliente não informado";
          const existing = clientMap.get(clientName) || { total: 0, count: 0, active: 0 };
          existing.total += Number(c.contract_value || 0);
          existing.count += 1;
          if (c.status === 'active') existing.active += 1;
          clientMap.set(clientName, existing);
        });
        
        contextData += `\n\nCLIENTES (${clientMap.size} únicos):\n`;
        clientMap.forEach((data, name) => {
          contextData += `- ${name}: ${money(data.total)} em ${data.count} contrato(s), ${data.active} ativo(s)\n`;
        });
      } else {
        contextData += "\n\nNenhum cliente encontrado.";
      }
    }

    const nowBr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "long", timeStyle: "short" });

    const systemPrompt = `Você é um assistente de análise de negócios especializado em gestão empresarial brasileira.
Analise os dados fornecidos e gere um relatório detalhado em português do Brasil.
Seja objetivo, use bullet points e destaque insights importantes.
Inclua recomendações práticas baseadas nos dados.
Formate valores monetários em Reais (R$).
REGRAS OBRIGATÓRIAS:
- Quando incluir data no relatório, use EXATAMENTE "${nowBr}" (horário de Brasília). Nunca invente datas.
- NUNCA inclua o campo "Analista", "Responsável", "Autor", "Elaborado por" ou qualquer assinatura/identificação de quem fez o relatório. O relatório não tem autor.`;

    const userPrompt = `Gere um relatório ${type === 'all' ? 'completo' : `de ${type}`} baseado nos seguintes dados:${contextData}\n\nData/hora atual de referência: ${nowBr}`;

    console.log("Generating report for type:", type);

    const { reportText, model } = await callGemini(GEMINI_API_KEY, systemPrompt, userPrompt);

    return new Response(JSON.stringify({ report: reportText, model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
