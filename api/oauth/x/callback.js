import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?x_error=denied");
  }

  // Extract user_id from state
  const parts = (state || "").split("__");
  const user_id = parts[1];

  if (!code || !user_id) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?x_error=invalid");
  }

  // Get code_verifier from cookie
  const cookies = Object.fromEntries(
    (req.headers.cookie || "").split("; ").map(c => c.split("="))
  );
  const codeVerifier = cookies["x_cv"];

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = "https://storykeeper-library.vercel.app/api/oauth/x/callback";

  // Exchange code for access token
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
    return res.redirect("https://storykeeper-library.vercel.app/#community?x_error=token");
  }

  // Get the user's X username
  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const xUsername = userData?.data?.username;

  if (!xUsername) {
    return res.redirect("https://storykeeper-library.vercel.app/#community?x_error=user");
  }

  // Save to Supabase
  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  await adminClient.from("user_social_links").upsert({
    user_id,
    x_twitter: xUsername,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Redirect back to community page with success
  res.redirect(`https://storykeeper-library.vercel.app/#community?x_connected=${encodeURIComponent(xUsername)}`);
}
