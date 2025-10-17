// chime-backend/index.js (fragmento)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";
import pkg from "@aws-sdk/client-chime-sdk-media-pipelines";
const {
  ChimeSDKMediaPipelinesClient,
  CreateMediaLiveConnectorPipelineCommand,
  CreateMediaCapturePipelineCommand,
} = pkg;
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new ChimeSDKMediaPipelinesClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post("/join", async (req, res) => {
  try {
    const meetingData = await joinMeeting(req, res);
    const meetingArn = `arn:aws:chime::${process.env.AWS_ACCOUNT_ID}:meeting/${meetingData.Meeting.MeetingId}`;

    // 1) Optional: capture to S3 (si quieres)
    try {
      const s3Params = {
        SourceType: "ChimeSdkMeeting",
        SourceArn: meetingArn,
        SinkType: "S3Bucket",
        SinkArn: `arn:aws:s3:::${process.env.AWS_S3_BUCKET_NAME}`,
      };
      await client.send(new CreateMediaCapturePipelineCommand(s3Params));
    } catch (e) {
      console.warn("No se pudo crear capture pipeline S3:", e.message || e);
    }

    // 2) Meeting -> WebRTC Sink (Chime envia audio a tu WS de señalización)
    const sinkParams = {
      Sources: [
        {
          SourceType: "ChimeSdkMeeting",
          ChimeSdkMeetingLiveConnectorConfiguration: {
            Arn: meetingArn,
            MuxType: "AudioOnly",
          },
        },
      ],
      Sinks: [
        {
          SinkType: "WebRTC",
          WebRTCConfiguration: {
            // AWS abrirá/negociará WebRTC con esta URL (tu bot backend)
            Url: `${process.env.BOT_BACKEND_WS_URL}/webrtc/signal`,
            // Opciones adicionales según la doc de AWS
          },
        },
      ],
    };

    const sinkResp = await client.send(
      new CreateMediaLiveConnectorPipelineCommand(sinkParams)
    );
    console.log("✅ Meeting -> WebRTC sink creado:", sinkResp.MediaLiveConnectorPipeline?.MediaPipelineId);

    // 3) WebRTC Source -> Meeting (tu bot se conecta como source a Chime)
    const sourceParams = {
      Sources: [
        {
          SourceType: "WebRTC",
          WebRTCConfiguration: {
            Url: `${process.env.BOT_BACKEND_WS_URL}/webrtc/signal`, // mismo WS; tu servidor sabrá si es source o sink por la señalización
          },
        },
      ],
      Sinks: [
        {
          SinkType: "ChimeSdkMeeting",
          ChimeSdkMeetingSinkConfiguration: {
            Arn: meetingArn,
          },
        },
      ],
    };

    const sourceResp = await client.send(
      new CreateMediaLiveConnectorPipelineCommand(sourceParams)
    );
    console.log("✅ WebRTC source -> Meeting creado:", sourceResp.MediaLiveConnectorPipeline?.MediaPipelineId);

    // 4) Notificar al bot para que espere la señalización
    try {
      await fetch(`${process.env.BOT_BACKEND_URL}/bot/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingData }),
      });
    } catch (botErr) {
      console.warn("No se pudo notificar al bot:", botErr.message || botErr);
    }

    res.json({
      message: "Reunión y pipelines WebRTC creados",
      meetingData,
      pipelineIds: {
        sinkId: sinkResp.MediaLiveConnectorPipeline?.MediaPipelineId,
        sourceId: sourceResp.MediaLiveConnectorPipeline?.MediaPipelineId,
      },
    });
  } catch (err) {
    console.error("Error /join:", err);
    res.status(500).json({ error: "Error al crear meeting/pipelines" });
  }
});

app.listen(process.env.PORT || 4000, () => console.log("chime-backend listo"));

