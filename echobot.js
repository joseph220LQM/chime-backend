import WebSocket from "ws";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export function startEchoBot(meetingUrl, meetingId, attendeeId, joinToken) {
  console.log("🎧 EchoBot escuchando y repitiendo...");

  // Nueva conexión a ElevenLabs Realtime API
  const ws = new WebSocket(
    `wss://api.elevenlabs.io/v1/convai/stream?model_id=eleven_turbo_v2_5&voice_id=${ELEVENLABS_VOICE_ID}&api_key=${ELEVENLABS_API_KEY}`
  );

  ws.on("open", () => {
    console.log("🔗 Conectado correctamente a ElevenLabs Realtime API");
  });

  ws.on("message", (msg) => {
    console.log("🎤 Mensaje recibido de ElevenLabs:", msg.toString());
    // Aquí después conectaremos este audio con Chime
  });

  ws.on("error", (err) => {
    console.error("❌ Error EchoBot:", err.message);
  });

  ws.on("close", () => {
    console.log("🔒 Conexión cerrada con ElevenLabs.");
  });
}
