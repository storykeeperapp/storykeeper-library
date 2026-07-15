import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect("https://www.thestorykeeper.co/app#x_error=denied");
  }

  // state = csrf__user_id__codeVerifier
  const parts = (state || "").split("__");
  const user_id = parts[1];
  const codeVerifier = parts[2];

  if (!code || !user_id || !codeVerifier) {
    return res.redirect("https://www.thestorykeeper.co/app#x_error=invalid");
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = "https://www.thestorykeeper.co/api/oauth/x/callback";

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("X token error:", JSON.stringify(tokenData));
    return res.redirect("https://www.thestorykeeper.co/app#x_error=token");
  }

  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const xUsername = userData?.data?.username;

  if (!xUsername) {
    console.error("X user error:", JSON.stringify(userData));
    return res.redirect("https://www.thestorykeeper.co/app#x_error=user");
  }

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: usernameRow } = await adminClient
    .from("usernames")
    .select("username")
    .eq("user_id", user_id)
    .maybeSingle();
  const storedUsername = usernameRow?.username || "";

  const { data: existingRow } = await adminClient
    .from("user_social_links")
    .select("user_id")
    .eq("user_id", user_id)
    .maybeSingle();

  if (existingRow) {
    const { error: updateError } = await adminClient
      .from("user_social_links")
      .update({ x_twitter: xUsername, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);
    if (updateError) console.error("X update error:", JSON.stringify(updateError));
  } else {
    const { error: insertError } = await adminClient.from("user_social_links").insert({
      user_id,
      username: storedUsername,
      x_twitter: xUsername,
      updated_at: new Date().toISOString(),
    });
    if (insertError) console.error("X insert error:", JSON.stringify(insertError));
  }

  res.redirect(
    `https://www.thestorykeeper.co/app#x_connected=${encodeURIComponent(xUsername)}`
  );
}
