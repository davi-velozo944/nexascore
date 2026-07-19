import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Usuário não autenticado");

    const { fileContent, fileName, fileType } = await req.json();
    if (!fileContent || !fileName) throw new Error("Arquivo não fornecido");

    // Parse transactions from file content
    const lines = fileContent.split("\n").filter((l: string) => l.trim());
    let rawTransactions: { date: string; description: string; amount: number }[] = [];

    if (fileType === "ofx") {
      // Simple OFX parser
      const stmtTrans = fileContent.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) || [];
      for (const block of stmtTrans) {
        const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
        const amountMatch = block.match(/<TRNAMT>([-\d.,]+)/);
        const memoMatch = block.match(/<MEMO>(.*?)(?:\n|<)/);
        const nameMatch = block.match(/<NAME>(.*?)(?:\n|<)/);
        if (dateMatch && amountMatch) {
          const d = dateMatch[1];
          rawTransactions.push({
            date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
            description: (memoMatch?.[1] || nameMatch?.[1] || "Sem descrição").trim(),
            amount: parseFloat(amountMatch[1].replace(",", ".")),
          });
        }
      }
    } else {
      // CSV parser - skip header, try common formats
      const dataLines = lines.slice(1);
      for (const line of dataLines) {
        const cols = line.split(/[;,]/).map((c: string) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length < 3) continue;
        // Try to find date, description, amount
        let date = "", description = "", amount = 0;
        for (const col of cols) {
          if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(col)) {
            const parts = col.split(/[\/-]/);
            date = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(col)) {
            date = col;
          } else if (/^-?[\d.,]+$/.test(col.replace(/\s/g, ""))) {
            const parsed = parseFloat(col.replace(/\./g, "").replace(",", "."));
            if (!isNaN(parsed) && parsed !== 0) amount = parsed;
          } else if (col.length > 3 && !date) {
            // skip
          } else if (col.length > 3) {
            description = col;
          }
        }
        // Fallback: first text col is description
        if (!description) {
          description = cols.find((c: string) => c.length > 3 && !/^[\d.,\/-]+$/.test(c)) || "Transação";
        }
        if (date && amount !== 0) {
          rawTransactions.push({ date, description, amount });
        }
      }
    }

    if (rawTransactions.length === 0) {
      throw new Error("Nenhuma transação encontrada no arquivo. Verifique o formato.");
    }

    // Use Gemini to categorize transactions
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");

    const transactionsText = rawTransactions
      .map((t, i) => `${i + 1}. ${t.date} | ${t.description} | R$ ${t.amount.toFixed(2)}`)
      .join("\n");

    const totalIncome = rawTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpense = rawTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    const systemPrompt = `Você é um analista financeiro brasileiro. Categorize cada transação em uma das categorias: Salários, Impostos, Aluguel, Combustível/Logística, Alimentação, Vendas/Pix, Serviços, Utilidades, Saúde, Educação, Marketing, Tecnologia, Outros. Classifique como "income" (positivo) ou "expense" (negativo). Retorne APENAS JSON puro neste formato:
{
  "categories": [{"index": 1, "category": "Salários", "type": "expense"}, ...],
  "summary": "resumo executivo"
}`;

    const userPrompt = `Analise estas ${rawTransactions.length} transações:\n\n${transactionsText}\n\nTotal entradas: R$ ${totalIncome.toFixed(2)}\nTotal saídas: R$ ${totalExpense.toFixed(2)}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const aiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) throw new Error("Limite de requisições do Gemini excedido.");
      throw new Error("Erro ao processar com IA Gemini");
    }

    const aiData = await aiResponse.json();
    const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let categorized: { categories: { index: number; category: string; type: string }[]; summary: string } = {
      categories: [],
      summary: "Análise não disponível.",
    };
    try {
      categorized = JSON.parse(aiText);
    } catch {
      // fallback
    }

    // Create import record
    const { data: importData, error: importError } = await supabase
      .from("bank_imports")
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileType || "csv",
        total_transactions: rawTransactions.length,
        total_income: totalIncome,
        total_expense: totalExpense,
        ai_summary: categorized.summary,
      })
      .select("id")
      .single();

    if (importError) throw new Error("Erro ao salvar importação: " + importError.message);

    // Insert transactions with AI categories
    const transactionsToInsert = rawTransactions.map((t, i) => {
      const aiCat = categorized.categories.find((c) => c.index === i + 1);
      return {
        user_id: user.id,
        import_id: importData.id,
        transaction_date: t.date,
        description: t.description,
        amount: Math.abs(t.amount),
        type: aiCat?.type || (t.amount >= 0 ? "income" : "expense"),
        category: aiCat?.category || "Outros",
        confirmed: false,
      };
    });

    const { error: txError } = await supabase.from("bank_transactions").insert(transactionsToInsert);
    if (txError) throw new Error("Erro ao salvar transações: " + txError.message);

    return new Response(
      JSON.stringify({
        import_id: importData.id,
        total_transactions: rawTransactions.length,
        total_income: totalIncome,
        total_expense: totalExpense,
        summary: categorized.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("process-bank-statement error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erro interno" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
