import WebSocket from "ws";
import { PassThrough } from "stream";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export function startEchoBot(meetingId, attendeeId, joinToken) {
  console.log("🎧 EchoBot escuchando y repitiendo...");

  // Conexión directa al Realtime API de ElevenLabs
  const ws = new WebSocket(
    `wss://api.elevenlabs.io/v1/realtime/ws?model_id=eleven_turbo_v2_5&voice_id=${ELEVENLABS_VOICE_ID}`,
    {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    }
  );

  const audioStream = new PassThrough();

  ws.on("open", () => {
    console.log("🔗 Conectado a ElevenLabs Realtime API ✅");

    // Simulamos texto entrante para generar voz
    setTimeout(() => {
      const text = "Hola, estoy conectado correctamente con ElevenLabs.";
      ws.send(JSON.stringify({ type: "input_text", text }));
    }, 2000);
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
      console.log("🔊 Audio binario recibido (fragmento de voz).");
    }
  });

  ws.on("close", () => console.log("🔒 EchoBot desconectado."));
  ws.on("error", (err) => console.error("❌ Error EchoBot:", err.message));
}

