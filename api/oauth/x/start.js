export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = "https://storykeeper-library.vercel.app/api/oauth/x/callback";

  // Generate a random state value to prevent CSRF
  const state = Math.random().toString(36).substring(2, 18);
  const codeVerifier = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  // Store state + verifier + user_id in query so callback can use them
  const { user_id } = req.query;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "users.read tweet.read offline.access",
    state: `${state}__${user_id}`,
    code_challenge: codeVerifier,
    code_challenge_method: "plain",
  });

  // Store code_verifier in a cookie so callback can retrieve it
  res.setHeader("Set-Cookie", `x_cv=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  res.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
}
