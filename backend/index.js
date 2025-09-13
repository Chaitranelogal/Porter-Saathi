import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use("/public", express.static("public"));

const whisperClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/voice/query", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  const tempFilePath = req.file.path;

  try {
    console.log("🎧 Transcribing with Whisper...");
    const transcription = await whisperClient.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      response_format: "text",
      language: req.body.language || "en",
    });

    const userText = transcription;
    console.log("👤 Transcribed:", userText);

    const payload = {
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for Porter drivers. Answer simply in Hinglish.",
        },
        {
          role: "user",
          content: userText,
        },
      ],
    };

    console.log("🤖 Sending to OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ GPT Error:", error);
      return res.status(500).json({ error: "GPT processing failed", details: error });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "No response";

    console.log("✅ Assistant:", responseText);

    res.json({
      speechText: responseText,
      visual: "📊 Sample visualization",
      ttsAudioUrl: null,
    });
  } catch (err) {
    console.error("❌ Error:", err.toString());
    res.status(500).json({ error: "Processing failed" });
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }
});

app.listen(3000, () => {
  console.log("✅ Backend running at http://localhost:3000");
});
