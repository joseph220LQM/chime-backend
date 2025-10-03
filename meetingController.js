// meetingController.js
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";
import { v4 as uuidv4 } from "uuid";

const client = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });

let currentMeeting = null; // memoria temporal

export async function joinMeeting(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "El nombre es requerido" });

  try {
    // Crear reunión solo si no existe
    if (!currentMeeting) {
      const meetingResponse = await client.send(
        new CreateMeetingCommand({
          ClientRequestToken: `${Date.now()}-${Math.random()}`,
          MediaRegion: process.env.AWS_REGION,
          ExternalMeetingId: `meeting-${Date.now()}`,
        })
      );
      currentMeeting = meetingResponse.Meeting;
      console.log("✅ Meeting creado:", currentMeeting);
    }

    // Crear attendee para la reunión existente
    const attendeeResponse = await client.send(
      new CreateAttendeeCommand({
        MeetingId: currentMeeting.MeetingId,
        ExternalUserId: name.replace(/\s/g, "_"),
      })
    );
    console.log("✅ Attendee creado:", attendeeResponse.Attendee);

    res.json({
      Meeting: currentMeeting,
      Attendee: attendeeResponse.Attendee,
    });

  } catch (err) {
    console.error("❌ Error en joinMeeting:", err);
    res.status(500).json({ error: err.message, details: err });
  }
}


