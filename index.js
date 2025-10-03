// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";

dotenv.config();

const app = express();

// Configuración CORS
app.use(cors({
  origin: "https://chime-frontend-gamma.vercel.app", // URL de tu frontend en Vercel
  methods: ["GET", "POST"],
}));

app.use(express.json());

// Ruta para unirse a la reunión
app.post("/join", joinMeeting);

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
