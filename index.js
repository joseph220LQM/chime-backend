import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";
import { ChimeSDKMediaPipelinesClient, CreateMediaCapturePipelineCommand } from "@aws-sdk/client-chime-sdk-media-pipelines";
import { startEchoBot } from "./echoBot.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const meetingsClient = new ChimeSDKMeetingsClient({ region: process.env.AWS_REGION });
const mediaPipelinesClient = new ChimeSDKMediaPipelinesClient({ region: process.env.AWS_REGION });

app.post("/join", async (req, res) => {
  try {
    // Crear reunión
    const meetingResponse = await meetingsClient.send(
      new CreateMeetingCommand({
        ClientRequestId: Date.now().toString(),
        MediaRegion: process.env.AWS_REGION,
      })
    );

    const meeting = meetingResponse.Meeting;
    console.log("✅ Nueva reunión creada:", meeting.MeetingId);

    // Crear participante
    const attendeeResponse = await meetingsClient.send(
      new CreateAttendeeCommand({
        MeetingId: meeting.MeetingId,
        ExternalUserId: `user-${Date.now()}`,
      })
    );

    const attendee = attendeeResponse.Attendee;

    // Crear media pipeline
    const mediaPipelineResponse = await mediaPipelinesClient.send(
      new CreateMediaCapturePipelineCommand({
        SourceType: "ChimeSdkMeeting",
        SourceArn: meeting.MediaPlacement.AudioHostUrl,
        SinkType: "S3Bucket",
        SinkArn: process.env.S3_ARN, // debe estar configurado
      })
    );

    console.log("✅ Media pipeline creada:", mediaPipelineResponse.MediaCapturePipeline.MediaPipelineId);

    // Iniciar el bot en segundo plano (no bloquea la respuesta)
    startEchoBot(meeting.MeetingId, attendee.AttendeeId, attendee.JoinToken)
      .catch((err) => console.error("❌ Error EchoBot:", err.message));

    // Enviar respuesta una sola vez
    res.json({
      meeting,
      attendee,
      pipeline: mediaPipelineResponse.MediaCapturePipeline,
    });
  } catch (error) {
    console.error("❌ Error al crear pipeline o bot:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
