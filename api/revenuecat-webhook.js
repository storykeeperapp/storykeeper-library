import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const authHeader = req.headers["authorization"];
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: "Server not configured" });
  }
  if (authHeader !== webhookSecret) {
    return res.status(401).json({ error: "Invalid authorization" });
  }

  const event = req.body?.event;
  if (!event) return res.status(400).json({ error: "Missing event" });

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // appUserID is set to the Supabase user id at Purchases.configure() time, so it
  // correlates directly — no email lookup needed like the Stripe webhook has to do.
  const userId = event.app_user_id;
  // Our entitlement identifiers (storyteller/librarian/storykeeper) match our tier ids
  // exactly, and each product only grants one entitlement, so this is unambiguous.
  const tier = event.entitlement_ids?.[0];

  if (["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"].includes(event.type)) {
    if (!userId || !tier) return res.status(200).json({ received: true });
    const { error } = await adminClient.from("user_subscriptions").upsert({
      user_id: userId,
      tier,
      status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      console.error("Supabase upsert failed", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // CANCELLATION means the customer turned off auto-renew but keeps access until the
  // current period ends — not handled here on purpose, so we don't revoke access early.
  // EXPIRATION is the actual end of access.
  if (event.type === "EXPIRATION") {
    if (!userId) return res.status(200).json({ received: true });
    const { error } = await adminClient.from("user_subscriptions")
      .update({ tier: "reluctant", status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      console.error("Supabase update failed", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(200).json({ received: true });
}
