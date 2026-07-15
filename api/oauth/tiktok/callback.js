import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect("https://www.thestorykeeper.co/app#tiktok_error=denied");
  }

  const parts = (state || "").split("__");
  const user_id = parts[1];

  if (!code || !user_id) {
    return res.redirect("https://www.thestorykeeper.co/app#tiktok_error=invalid");
  }

  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = "https://www.thestorykeeper.co/api/oauth/tiktok/callback/";

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("TikTok token error:", JSON.stringify(tokenData));
    return res.redirect("https://www.thestorykeeper.co/app#tiktok_error=token");
  }

  const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  console.log("TikTok user data:", JSON.stringify(userData));
  const username = userData?.data?.user?.display_name || userData?.data?.user?.open_id;
  console.log("TikTok resolved username:", username);

  if (!username) {
    console.error("TikTok user error:", JSON.stringify(userData));
    return res.redirect("https://www.thestorykeeper.co/app#tiktok_error=user");
  }

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Look up the stored username so we can include it in the upsert (required column)
  const { data: usernameRow } = await adminClient.from("usernames").select("username").eq("user_id", user_id).maybeSingle();
  const storedUsername = usernameRow?.username || "";

  // Check if row exists
  const { data: existingRow } = await adminClient.from("user_social_links").select("user_id").eq("user_id", user_id).maybeSingle();

  if (existingRow) {
    const { error: updateError } = await adminClient.from("user_social_links")
      .update({ tiktok: username, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);
    if (updateError) console.error("TikTok update error:", JSON.stringify(updateError));
  } else {
    const { error: insertError } = await adminClient.from("user_social_links").insert({
      user_id,
      username: storedUsername,
      tiktok: username,
      updated_at: new Date().toISOString(),
    });
    if (insertError) console.error("TikTok insert error:", JSON.stringify(insertError));
  }

  res.redirect(`https://www.thestorykeeper.co/app#tiktok_connected=${encodeURIComponent(username)}`);
}
