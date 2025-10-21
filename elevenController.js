//elevencontroller.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function createElevenToken(req, res) {
  try {
    const agent_id = req.query.agent_id || process.env.ELEVEN_AGENT_ID;
    const url = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agent_id}`;
    const resp = await fetch(url, { headers: { "xi-api-key": process.env.ELEVEN_API_KEY } });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text });
    }

    const body = await resp.json();
    return res.json({ token: body.token });
  } catch (err) {
    console.error("Error creando token:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
