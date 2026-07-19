import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PLAN_BY_PRODUCT: Record<string, string> = {
  prod_UlrEULDz0Z9AWT: "inicial",
  prod_UlrEBo03U04T0m: "profissional",
  prod_UlrE099XkylIo4: "premium",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-08-27.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const log = (step: string, data?: unknown) =>
  console.log(`[stripe-webhook] ${step}`, data ? JSON.stringify(data) : "");

async function setPlanByCustomer(customerId: string, plan: string, status: string) {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;
  const email = (customer as Stripe.Customer).email;
  if (!email) return;
  const { data: prof } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();
  if (!prof) {
    log("profile_not_found", { email });
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .update({ plan, status })
    .eq("user_id", prof.user_id);
  if (error) log("update_error", error);
  else log("plan_updated", { email, plan, status });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !secret) return new Response("Missing signature/secret", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    log("signature_failed", String(err));
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  log("event_received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription && session.customer) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = sub.items.data[0]?.price.product as string;
          const plan = PLAN_BY_PRODUCT[productId] ?? "free";
          await setPlanByCustomer(session.customer as string, plan, "active");
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const productId = sub.items.data[0]?.price.product as string;
        const plan = sub.status === "active" || sub.status === "trialing"
          ? (PLAN_BY_PRODUCT[productId] ?? "free")
          : "free";
        const status = sub.status === "active" || sub.status === "trialing" ? "active" : "inactive";
        await setPlanByCustomer(sub.customer as string, plan, status);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setPlanByCustomer(sub.customer as string, "free", "inactive");
        break;
      }
      default:
        log("unhandled_event", event.type);
    }
  } catch (err) {
    log("handler_error", String(err));
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});