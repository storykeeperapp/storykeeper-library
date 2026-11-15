import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Monthly and yearly list prices in cents (the same numbers in USD and GBP) for each tier.
const TIER_AMOUNTS = {
  storyteller: [499, 4999],
  librarian: [999, 9999],
  storykeeper: [1499, 14999],
};

// An unrecognized amount gets The StoryKeeper rather than less than the reader paid for.
function tierFromAmount(amount) {
  return Object.keys(TIER_AMOUNTS).find(t => TIER_AMOUNTS[t].includes(amount)) || "storykeeper";
}

// A subscription in its free trial reports "trialing"; it has full access just like "active".
const HAS_ACCESS = ["active", "trialing"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeSecret) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const stripe = new Stripe(stripeSecret);

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: "Webhook signature invalid: " + err.message });
  }

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const customerEmail = session.customer_details?.email;

    if (!subscriptionId) return res.status(200).json({ received: true });

    // Get subscription to find price amount
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const amount = subscription.items.data[0]?.price?.unit_amount || 0;
    const tier = tierFromAmount(amount);

    // Find the Supabase user by email
    const { data: users } = await adminClient.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === customerEmail);
    if (!user) return res.status(200).json({ received: true });

    await adminClient.from("user_subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier,
      status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const amount = subscription.items.data[0]?.price?.unit_amount || 0;
    const tier = tierFromAmount(amount);
    const status = HAS_ACCESS.includes(subscription.status) ? "active" : "inactive";

    await adminClient.from("user_subscriptions")
      .update({ tier, status, updated_at: new Date().toISOString() })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    await adminClient.from("user_subscriptions")
      .update({ tier: "reluctant", status: "cancelled", updated_at: new Date().toISOString() })
      .eq("stripe_customer_id", customerId);
  }

  return res.status(200).json({ received: true });
}

// Vercel needs raw body for Stripe signature verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
