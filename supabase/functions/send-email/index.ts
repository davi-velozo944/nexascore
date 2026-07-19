import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, subject, html, type } = await req.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "Campos 'to' e 'subject' são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailHtml = html;

    if (type === "welcome") {
      emailHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; font-size: 28px;">Bem-vindo ao NexaScore! 🎉</h1>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Olá! Sua conta foi criada com sucesso. Estamos felizes em tê-lo conosco.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Com o NexaScore, você pode gerenciar contratos, clientes, funcionários e muito mais — tudo em um só lugar.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nexascore.lovable.app/dashboard" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Acessar Dashboard
            </a>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 40px;">
            NexaScore — Gestão Inteligente
          </p>
        </div>
      `;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NexaScore <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data.message || "Erro ao enviar e-mail" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
