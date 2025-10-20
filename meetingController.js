import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";
import { v4 as uuidv4 } from "uuid";

const client = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });
let currentMeeting = null;

async function createNewMeeting() {
  const meetingResponse = await client.send(
    new CreateMeetingCommand({
      ClientRequestToken: uuidv4(),
      MediaRegion: process.env.AWS_REGION,
      ExternalMeetingId: `meeting-${Date.now()}`,
    })
  );
  console.log("✅ Nueva reunión creada:", meetingResponse.Meeting.MeetingId);
  return meetingResponse.Meeting;
}

export async function joinMeeting(req, res) {
  try {
    const { name } = req.body;
    if (!currentMeeting) currentMeeting = await createNewMeeting();

    let attendeeResponse;
    try {
      attendeeResponse = await client.send(
        new CreateAttendeeCommand({
          MeetingId: currentMeeting.MeetingId,
          ExternalUserId: `${name}-${uuidv4().substring(0, 8)}`,
        })
      );
    } catch (err) {
      if (err.name === "NotFoundException") {
        console.log("⚠️ Reunión expirada. Creando nueva...");
        currentMeeting = await createNewMeeting();
        attendeeResponse = await client.send(
          new CreateAttendeeCommand({
            MeetingId: currentMeeting.MeetingId,
            ExternalUserId: `${name}-${uuidv4().substring(0, 8)}`,
          })
        );
      } else throw err;
    }

    const data = { Meeting: currentMeeting, Attendee: attendeeResponse.Attendee };
    res.json(data);
    return data;
  } catch (error) {
    console.error("❌ Error en joinMeeting:", error);
    res.status(500).json({ error: "Error al unirse a la reunión" });
  }
}










