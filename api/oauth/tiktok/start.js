import { randomBytes } from "crypto";

export default function handler(req, res) {
  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = "https://www.thestorykeeper.co/api/oauth/tiktok/callback/";
  const { user_id } = req.query;

  if (!clientKey) {
    return res.status(500).send("TikTok client key not configured.");
  }

  const state = randomBytes(16).toString("hex") + "__" + user_id;

  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user.info.basic",
    state,
  });

  res.setHeader("Set-Cookie", `tt_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`);
}
