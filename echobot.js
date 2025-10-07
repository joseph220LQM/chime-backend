import "dotenv/config";
import WebSocket from "ws";
import fetch from "node-fetch";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export async function startEchoBot(meetingId, attendeeId, joinToken) {
  console.log("🎧 Iniciando EchoBot...");

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error("Faltan ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID en el archivo .env");
  }

  try {
    // 1️⃣ Crear sesión temporal
    const sessionRes = await fetch("https://api.elevenlabs.io/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice: ELEVENLABS_VOICE_ID,
        model_id: "eleven_turbo_v2_5",
      }),
    });

    if (!sessionRes.ok) {
      throw new Error(`No se pudo crear sesión ElevenLabs (${sessionRes.status})`);
    }

    const { session_id } = await sessionRes.json();

    if (!session_id) throw new Error("No se recibió session_id de ElevenLabs");

    // 2️⃣ Conectarse al WebSocket con el session_id
    const wsUrl = `wss://api.elevenlabs.io/v1/realtime/ws?session_id=${session_id}`;
    const ws = new WebSocket(wsUrl);

    ws.on("open", () => {
      console.log("🔗 EchoBot conectado al Realtime API ✅");
      ws.send(JSON.stringify({ type: "input_text", text: "Hola, la conexión con ElevenLabs está funcionando correctamente." }));
    });

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "audio") {
          console.log("🎤 Audio recibido desde ElevenLabs (TTS).");
        } else if (data.type === "error") {
          console.error("⚠️ Error desde ElevenLabs:", data.error);
        }
      } catch {
        console.log("🔊 Fragmento de audio binario recibido.");
      }
    });

    ws.on("close", () => console.log("🔒 EchoBot desconectado."));
    ws.on("error", (err) => console.error("❌ Error EchoBot:", err.message));
  } catch (err) {
    console.error("❌ Error en EchoBot:", err.message);
    throw err;
  }
}
