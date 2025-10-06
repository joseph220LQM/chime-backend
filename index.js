import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";
import { startEchoBot } from "./echobot.js";
import { ChimeSDKMediaPipelinesClient, CreateMediaPipelineCommand } from "@aws-sdk/client-chime-sdk-media-pipelines";

dotenv.config();

const app = express();
app.use(cors({ origin: "https://chime-frontend-gamma.vercel.app" }));
app.use(express.json());

app.post("/join", async (req, res) => {
  try {
    const meetingData = await joinMeeting(req, res);

    // 🚀 Crear pipeline de audio en tiempo real
    const client = new ChimeSDKMediaPipelinesClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const pipelineParams = {
      MediaPipelineType: "AudioConcatenation",
      AudioConcatenationConfiguration: {
        State: "Enabled",
      },
    };

    await client.send(new CreateMediaPipelineCommand(pipelineParams));

    // 🤖 Iniciar bot de repetición
    startEchoBot(
      meetingData.Meeting.MeetingId,
      meetingData.Attendee.AttendeeId,
      meetingData.Attendee.JoinToken
    );

  } catch (error) {
    console.error("❌ Error al crear pipeline o bot:", error);
    res.status(500).json({ error: "Error al unirse a la reunión" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
