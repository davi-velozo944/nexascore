import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const plans = [
      { name: "NexaScore Inicial", description: "Até 50 clientes, 10 contratos, relatórios básicos", price: 9700 },
      { name: "NexaScore Profissional", description: "Até 200 clientes, contratos ilimitados, IA avançada", price: 19700 },
      { name: "NexaScore Premium", description: "Clientes ilimitados, suporte prioritário, API completa", price: 39700 },
    ];

    const results = [];

    for (const plan of plans) {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: "brl",
        recurring: { interval: "month" },
      });

      results.push({
        name: plan.name,
        product_id: product.id,
        price_id: price.id,
        amount: plan.price,
      });
    }

    return new Response(JSON.stringify({ products: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
