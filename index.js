//index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { joinMeeting } from "./meetingController.js";
import { createElevenToken } from "./elevenController.js";
import { botJoin } from "./botController.js";
import { getCurrentMeeting } from "./meetingController.js";
import pkg from "@aws-sdk/client-chime-sdk-media-pipelines";

const { ChimeSDKMediaPipelinesClient, CreateMediaCapturePipelineCommand } = pkg;

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// 🧠 Endpoint para crear o unirse a una reunión
app.post("/join", async (req, res) => {
  try {
    const meetingData = await joinMeeting(req, res);

    // 🎧 Crear pipeline S3 opcional
    const client = new ChimeSDKMediaPipelinesClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    let pipelineId = null;
    try {
      const pipeline = await client.send(
        new CreateMediaCapturePipelineCommand({
          SourceType: "ChimeSdkMeeting",
          SourceArn: `arn:aws:chime::${process.env.AWS_ACCOUNT_ID}:meeting/${meetingData.Meeting.MeetingId}`,
          SinkType: "S3Bucket",
          SinkArn: `arn:aws:s3:::${process.env.AWS_S3_BUCKET_NAME}`,
        })
      );
      pipelineId = pipeline.MediaCapturePipelineId;
      console.log("✅ Media pipeline creada:", pipelineId);
    } catch (err) {
      console.warn("⚠️ No se pudo crear la media pipeline:", err.message);
    }

    // 🧠 Respondemos al cliente SOLO UNA VEZ
    res.json({ meetingData, pipelineId });

    // 🤖 Invitar al bot después, sin afectar la respuesta
    fetch(`${process.env.BACKEND_URL}/bot/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingData }),
    })
      .then(() => console.log("🤖 Mozart invitado a la reunión"))
      .catch((e) => console.warn("⚠️ No se pudo invitar al bot:", e.message));
  } catch (err) {
    console.error("❌ Error general al crear la reunión:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "No se pudo crear la reunión" });
  }
});


// 🎧 Token para ElevenLabs
app.get("/api/get-conversation-token", createElevenToken);
// Endpoint para invitar automáticamente a Mozart
app.post("/bot/join", botJoin);
// 🧠 Devuelve la reunión actual (para la Lambda de SIP Media App)
app.get("/currentMeeting", getCurrentMeeting);



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));



