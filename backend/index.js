import express from "express";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const app = express();
const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());

// 🎙️ 1. Handle voice queries
app.post("/api/voice/query", upload.single("file"), async (req, res) => {
  try {
    // 1️⃣ Speech-to-Text (Whisper)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });

    const userText = transcription.text;

    // 2️⃣ Process with GPT (business logic)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant for drivers." },
        { role: "user", content: userText },
      ],
    });

    const responseText = completion.choices[0].message.content;

    // 3️⃣ Text-to-Speech (TTS)
    const ttsFile = `tts-${uuidv4()}.mp3`;
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: responseText,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    fs.writeFileSync(`public/${ttsFile}`, buffer);

    // 4️⃣ Send response back
    res.json({
      speechText: responseText,
      visual: responseText,
      audioUrl: `/public/${ttsFile}`,
      followupAction: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

// Static files for audio playback
app.use("/public", express.static("public"));

app.listen(3000, () => console.log("✅ Backend running on http://localhost:3000"));
