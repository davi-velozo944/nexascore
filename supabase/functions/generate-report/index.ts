import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptData, prompt } = await req.json();
    const userPrompt = promptData || prompt;

    const grokApiKey = Deno.env.get("GROK_API_KEY");
    if (!grokApiKey) {
      throw new Error("GROK_API_KEY não configurada no Supabase.");
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: "Você é o assistente de IA financeiro do NexaScore, especializado em gerar análises e relatórios detalhados.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: resultText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
