import {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
} from "@aws-sdk/client-chime-sdk-meetings";

const client = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });

export async function joinMeeting(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Falta el nombre" });

  try {
    // Crear reunión o reutilizar (si quieres persistir en memoria temporal)
    const meetingResponse = await client.send(new CreateMeetingCommand({
      ClientRequestToken: `${name}-${Date.now()}`,
      MediaRegion: process.env.AWS_REGION,
    }));

    const attendeeResponse = await client.send(new CreateAttendeeCommand({
      MeetingId: meetingResponse.Meeting.MeetingId,
      ExternalUserId: name,
    }));

    res.json({
      Meeting: meetingResponse.Meeting,
      Attendee: attendeeResponse.Attendee,
    });
  } catch (err) {
    console.error("❌ Error en joinMeeting:", err);
    res.status(500).json({ error: err.message });
  }
}

