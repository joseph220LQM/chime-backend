import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";
import { v4 as uuidv4 } from "uuid";

const client = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });

// Guardamos la reunión actual en memoria
let currentMeeting = null;

// Función para crear una nueva reunión
async function createNewMeeting() {
  const meetingResponse = await client.send(
    new CreateMeetingCommand({
      ClientRequestToken: uuidv4(),
      MediaRegion: process.env.AWS_REGION,
      ExternalMeetingId: `meeting-${Date.now()}`, // identificador único
    })
  );
  console.log("✅ Nueva reunión creada:", meetingResponse.Meeting.MeetingId);
  return meetingResponse.Meeting;
}

export async function joinMeeting(req, res) {
  try {
    const { name } = req.body;

    // Si no hay reunión, creamos una
    if (!currentMeeting) {
      currentMeeting = await createNewMeeting();
    }

    let attendeeResponse;
    try {
      // Intentamos crear el attendee
      attendeeResponse = await client.send(
        new CreateAttendeeCommand({
          MeetingId: currentMeeting.MeetingId,
          ExternalUserId: `${name}-${uuidv4().substring(0, 8)}`,
        })
      );
    } catch (err) {
      // Si la reunión expiró o no existe → creamos una nueva
      if (err.name === "NotFoundException") {
        console.log("⚠️ La reunión ya no existe. Creando una nueva...");
        currentMeeting = await createNewMeeting();
        attendeeResponse = await client.send(
          new CreateAttendeeCommand({
            MeetingId: currentMeeting.MeetingId,
            ExternalUserId: `${name}-${uuidv4().substring(0, 8)}`,
          })
        );
      } else {
        throw err;
      }
    }

    res.json({
      Meeting: currentMeeting,
      Attendee: attendeeResponse.Attendee,
    });
  } catch (error) {
    console.error("❌ Error en joinMeeting:", error);
    res.status(500).json({ error: "Error al unirse a la reunión" });
  }
}




