// bbotController.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Mozart se une automáticamente a la reunión de Amazon Chime
 */
export async function botJoin(req, res) {
  try {
    const { meetingData } = req.body;
    if (!meetingData?.Meeting?.MeetingId) {
      return res.status(400).json({ error: "Faltan datos de la reunión" });
    }

    console.log("🎧 Mozart uniéndose a la reunión:", meetingData.Meeting.MeetingId);

    // Pedimos token de conversación para el agente ElevenLabs
    const tokenResp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${process.env.ELEVEN_AGENT_ID}`,
      {
        headers: { "xi-api-key": process.env.ELEVEN_API_KEY },
      }
    );

    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      throw new Error("Error obteniendo token ElevenLabs: " + txt);
    }

    const { token } = await tokenResp.json();

    // Llamamos al endpoint de ElevenLabs que inicia la conexión WebRTC
    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/conversation/start",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: process.env.ELEVEN_AGENT_ID,
          conversation_token: token,
          connection: {
            type: "webrtc",
            chimeMeeting: {
              meetingId: meetingData.Meeting.MeetingId,
              attendeeId: meetingData.Attendee.AttendeeId,
              joinToken: meetingData.Attendee.JoinToken,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      throw new Error("Error conectando bot a reunión: " + txt);
    }

    console.log("✅ Mozart conectado automáticamente a la reunión.");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al unir bot:", err.message);
    res.status(500).json({ error: err.message });
  }
}
