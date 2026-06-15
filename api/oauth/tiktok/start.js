export default async function handler(req, res) {
  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = "https://storykeeper-library.vercel.app/api/oauth/tiktok/callback/";
  const { user_id } = req.query;

  const state = Math.random().toString(36).substring(2, 18) + "__" + user_id;
  const codeVerifier = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user.info.basic",
    state,
    code_challenge: codeVerifier,
    code_challenge_method: "S256",
  });

  res.setHeader("Set-Cookie", `tt_cv=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`);
}
