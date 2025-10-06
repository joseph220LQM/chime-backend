import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

const ELEVENLABS_URL = "wss://api.elevenlabs.io/v1/realtime/ws";
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;

export function startEchoBot(meetingUrl, meetingId, attendeeId, joinToken) {
  console.log("🎧 EchoBot escuchando y repitiendo...");

  // Conexión al WebSocket de ElevenLabs
  const ws = new WebSocket(
    `${ELEVENLABS_URL}?model_id=eleven_monolingual_v1&voice_id=${VOICE_ID}`,
    {
      headers: { "xi-api-key": ELEVEN_API_KEY },
    }
  );

  ws.on("open", () => {
    console.log("🔗 Conectado a ElevenLabs Realtime API");
  });

  ws.on("message", (msg) => {
    console.log("🎤 Audio recibido de ElevenLabs (repetición simulada)");
    // Aquí se debería enviar el audio de vuelta a Chime
    // (lo implementaremos en el paso 2)
  });

  ws.on("error", (err) => console.error("❌ Error EchoBot:", err.message));

  // 🧩 Próximamente:
  // - Capturar el audio del micrófono del usuario desde Chime (RTP)
  // - Enviar ese audio al socket de ElevenLabs
  // - Reproducir la respuesta dentro de la misma reunión
}
