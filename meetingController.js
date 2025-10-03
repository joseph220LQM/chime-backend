// meetingController.js
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";
import { v4 as uuidv4 } from "uuid";

const client = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });

export async function joinMeeting(req, res) {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "El nombre es requerido" });

  try {
    // Crear reunión
    const meetingResponse = await client.send(
      new CreateMeetingCommand({
        ClientRequestToken: `${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // único por request
        MediaRegion: process.env.AWS_REGION,
        ExternalMeetingId: `meeting-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // obligatorio y único
      })
    );
    console.log("✅ Meeting creado:", meetingResponse);

    // Crear asistente
    const attendeeResponse = await client.send(
      new CreateAttendeeCommand({
        MeetingId: meetingResponse.Meeting.MeetingId,
        ExternalUserId: name.replace(/\s/g, "_"), // seguro para AWS
      })
    );
    console.log("✅ Attendee creado:", attendeeResponse);

    res.json({
      Meeting: meetingResponse.Meeting,
      Attendee: attendeeResponse.Attendee,
    });

  } catch (err) {
    console.error("❌ Error en joinMeeting:", err);
    res.status(500).json({ error: err.message, details: err });
  }
}


