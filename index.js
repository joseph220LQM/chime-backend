import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { joinMeeting } from "./meetingController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/join", joinMeeting);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en http://localhost:${PORT}`));

