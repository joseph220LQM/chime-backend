import "dotenv/config";
import WebSocket from "ws";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export async function startEchoBot(meetingId, attendeeId, joinToken) {
  console.log("🎧 Iniciando EchoBot...");

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error("Faltan ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID en el archivo .env");
  }

  try {
    const ws = new WebSocket(
      `wss://api.elevenlabs.io/v1/realtime/ws?model_id=eleven_turbo_v2_5&voice_id=${ELEVENLABS_VOICE_ID}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    ws.on("open", () => {
      console.log("🔗 EchoBot conectado al Realtime API ✅");
      ws.send(JSON.stringify({
        type: "input_text",
        text: "Hola, la conexión con ElevenLabs está funcionando correctamente."
      }));
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
