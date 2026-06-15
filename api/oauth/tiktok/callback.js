import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?tiktok_error=denied");
  }

  const parts = (state || "").split("__");
  const user_id = parts[1];

  if (!code || !user_id) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?tiktok_error=invalid");
  }

  const cookies = Object.fromEntries(
    (req.headers.cookie || "").split("; ").filter(Boolean).map(c => c.split("="))
  );
  const codeVerifier = cookies["tt_cv"];

  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = "https://storykeeper-library.vercel.app/api/oauth/tiktok/callback/";

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?tiktok_error=token");
  }

  const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const username = userData?.data?.user?.username || userData?.data?.user?.display_name;

  if (!username) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?tiktok_error=user");
  }

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  await adminClient.from("user_social_links").upsert({
    user_id,
    tiktok: username,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  res.redirect(`https://storykeeper-library.vercel.app/#community?tiktok_connected=${encodeURIComponent(username)}`);
}
