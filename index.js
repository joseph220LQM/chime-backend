//chime-backend index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";
import pkg from "@aws-sdk/client-chime-sdk-media-pipelines";
const { ChimeSDKMediaPipelinesClient, CreateMediaCapturePipelineCommand } = pkg;

import fetch from "node-fetch"; // 👈 nuevo

dotenv.config();

const app = express();
app.use(cors({ origin: "https://chime-frontend-gamma.vercel.app" }));
app.use(express.json());

app.post("/join", async (req, res) => {
  try {
    // 🧩 Crear la reunión y el participante
    const meetingData = await joinMeeting(req, res);

    // 🪣 Crear el cliente del pipeline
    const client = new ChimeSDKMediaPipelinesClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // 🎧 Grabar la reunión en tu bucket S3
    const pipelineParams = {
      SourceType: "ChimeSdkMeeting",
      SourceArn: `arn:aws:chime::${process.env.AWS_ACCOUNT_ID}:meeting/${meetingData.Meeting.MeetingId}`,
      SinkType: "S3Bucket",
      SinkArn: `arn:aws:s3:::${process.env.AWS_S3_BUCKET_NAME}`,
    };

    const pipeline = await client.send(
      new CreateMediaCapturePipelineCommand(pipelineParams)
    );

    console.log(`✅ Media pipeline creada: ${pipeline.MediaCapturePipeline?.MediaPipelineId}`);

    // 🚀 NUEVO: Notificar al backend del bot
    try {
      await fetch(`${process.env.BOT_BACKEND_URL}/bot/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingData }),
      });
      console.log("🤖 Bot notificado y unido automáticamente a la reunión");
    } catch (botErr) {
      console.error("⚠️ No se pudo conectar el bot automáticamente:", botErr.message);
    }

    // Enviar respuesta al frontend
    res.json({
      message: "Reunión creada correctamente",
      meetingData,
      pipelineId: pipeline.MediaCapturePipeline?.MediaPipelineId,
    });

  } catch (error) {
    console.error("❌ Error al crear la reunión o pipeline:", error);

    if (!res.headersSent) {
      res.status(500).json({ error: "Error al unirse a la reunión o crear el pipeline" });
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));


