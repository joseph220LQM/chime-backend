import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";
import { startEchoBot } from "./echobot.js";
import pkg from "@aws-sdk/client-chime-sdk-media-pipelines";
const { ChimeSDKMediaPipelinesClient, CreateMediaCapturePipelineCommand } = pkg;

dotenv.config();

const app = express();
app.use(cors({ origin: "https://chime-frontend-gamma.vercel.app" }));
app.use(express.json());

app.post("/join", async (req, res) => {
  try {
    const meetingData = await joinMeeting(req, res);

    const client = new ChimeSDKMediaPipelinesClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // 🧩 Pipeline para capturar audio de la reunión
    const pipelineParams = {
      SourceType: "ChimeSdkMeeting",
      SourceArn: `arn:aws:chime::${process.env.AWS_ACCOUNT_ID}:meeting/${meetingData.Meeting.MeetingId}`,
      SinkType: "S3Bucket",
      SinkArn: `arn:aws:s3:::${process.env.AWS_S3_BUCKET_NAME}`,
    };

    const pipeline = await client.send(new CreateMediaCapturePipelineCommand(pipelineParams));

    console.log(`✅ Media pipeline creada: ${pipeline.MediaCapturePipeline?.MediaPipelineId}`);

    // 🤖 Iniciar EchoBot (repetidor)
    startEchoBot(
      meetingData.Meeting.MeetingId,
      meetingData.Attendee.AttendeeId,
      meetingData.Attendee.JoinToken
    );

    res.json(meetingData);

  } catch (error) {
    console.error("❌ Error al crear pipeline o bot:", error);
    if (!res.headersSent)
      res.status(500).json({ error: "Error al unirse a la reunión" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
