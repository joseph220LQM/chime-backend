import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";
import { startEchoBot } from "./echobot.js";

dotenv.config();

const app = express();

// CORS (asegúrate de poner tu dominio de Vercel)
app.use(cors({
  origin: "https://chime-frontend-gamma.vercel.app",
  methods: ["GET", "POST"],
}));

app.use(express.json());

// Ruta para unirse a la reunión
app.post("/join", async (req, res) => {
  const result = await joinMeeting(req, res);

  // Si se unió correctamente, iniciamos el EchoBot (solo una vez por reunión)
  if (result?.Meeting && result?.Attendee) {
    console.log("🤖 Iniciando EchoBot...");
    startEchoBot(
      result.Meeting.MediaPlacement.AudioHostUrl,
      result.Meeting.MeetingId,
      result.Attendee.AttendeeId,
      result.Attendee.JoinToken
    );
  }
});

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
