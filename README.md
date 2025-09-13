# Porter Saathi Prototype

This repo contains a minimal prototype for **Porter Saathi** — a voice-first assistant prototype.

Structure:
- frontend/  — Expo React Native app (App.js + PorterSaathiVoiceComponent.tsx)
- backend/   — Simple Express server that accepts audio and returns mocked responses

## Quickstart

### Backend
1. `cd backend`
2. `npm install`
3. `node index.js`
   - Server runs on port 3000 by default.

### Frontend (Expo)
1. Install Expo CLI if you don't have it: `npm install -g expo-cli`
2. `cd frontend`
3. `npm install`
4. `expo start`
5. Run on a simulator or physical device.
   - Note: For Android emulator, the backend URL in the frontend is set to `http://10.0.2.2:3000`. For iOS simulator use `http://localhost:3000` or your machine IP for a physical device.

## How it works
- The frontend records audio using `expo-av` and uploads it as multipart/form-data to `/api/voice/query`.
- The backend currently mocks STT/LLM logic and returns a sample JSON:
  `{ speechText, visual, followupAction, ttsAudioUrl }`
- The frontend plays the text using `expo-speech`.

## Next steps to make it production-ready
- Integrate real STT (e.g., Google, Amazon, Whisper) in the backend or on-device.
- Replace mocked responses with NLU + LLM (RAG) for explanations.
- Add authentication, secure audio handling, consent flows, and telemetry.

