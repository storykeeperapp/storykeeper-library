export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  // Verify the request is from Supabase using a shared secret
  const secret = req.headers["x-webhook-secret"];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = req.body;
  const user = payload?.record;
  if (!user) return res.status(400).json({ error: "No user record" });

  const email = user.email || "unknown";
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })
    : "unknown";
  const provider = user.raw_app_meta_data?.provider || "email";

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StoryKeeper <noreply@thestorykeeper.co>",
        to: "msbratt23@gmail.com",
        subject: "New StoryKeeper Signup",
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FDF6EC;border-radius:12px">
            <h2 style="font-family:'Palatino Linotype',Palatino,serif;color:#3A2A1A;margin:0 0 16px">New User Signed Up</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3A2A1A">
              <tr style="border-bottom:1px solid #D8C3A5">
                <td style="padding:10px 0;color:#5A3E28">Email</td>
                <td style="padding:10px 0;text-align:right"><strong>${email}</strong></td>
              </tr>
              <tr style="border-bottom:1px solid #D8C3A5">
                <td style="padding:10px 0;color:#5A3E28">Signed up via</td>
                <td style="padding:10px 0;text-align:right"><strong>${provider}</strong></td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#5A3E28">Time</td>
                <td style="padding:10px 0;text-align:right"><strong>${createdAt}</strong></td>
              </tr>
            </table>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend error:", err);
      return res.status(500).json({ error: "Email failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Notify error:", e);
    return res.status(500).json({ error: e.message });
  }
}
