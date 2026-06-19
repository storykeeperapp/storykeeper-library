export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = "https://www.thestorykeeper.co/api/oauth/x/callback";

  const { user_id } = req.query;

  const csrf = Math.random().toString(36).substring(2, 18);
  const codeVerifier =
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);

  // Encode everything into state so we don't rely on cookies surviving app-switches on iOS
  const state = `${csrf}__${user_id}__${codeVerifier}`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "users.read tweet.read offline.access",
    state,
    code_challenge: codeVerifier,
    code_challenge_method: "plain",
  });

  res.redirect(`https://x.com/i/oauth2/authorize?${params.toString()}`);
}
