import WebSocket from "ws";
import { PassThrough } from "stream";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export function startEchoBot(meetingId, attendeeId, joinToken) {
  console.log("🎧 EchoBot escuchando y repitiendo...");

  const ws = new WebSocket(
    `wss://api.elevenlabs.io/v1/convai/stream?model_id=eleven_turbo_v2_5&voice_id=${ELEVENLABS_VOICE_ID}`,
    {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    }
  );

  const audioStream = new PassThrough();

  ws.on("open", () => {
    console.log("🔗 Conectado a ElevenLabs Realtime API");

    setTimeout(() => {
      const exampleText = "Hola, estoy repitiendo lo que escucho en la reunión.";
      ws.send(JSON.stringify({ type: "input_text", text: exampleText }));
    }, 2000);
  });

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === "audio") {
      console.log("🎤 Recibido audio sintetizado de ElevenLabs.");
    }
  });

  ws.on("error", (err) => console.error("❌ Error EchoBot:", err.message));
  ws.on("close", () => console.log("🔒 EchoBot desconectado."));
}


