// Simple Express backend to accept audio and return a mocked Saathi response.
// Run: npm install && node index.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

app.post('/api/voice/query', upload.single('audio'), (req, res) => {
  // In production: pass audio to STT, then NLU, then business logic / LLM.
  console.log('Received audio file:', req.file && req.file.path);
  const driverId = req.body.driverId || 'UNKNOWN';
  const language = req.body.language || 'hi-IN';
  // Mocked logic: return a simple earnings explanation
  const response = {
    speechText: language.startsWith('hi') ? 'Aaj aapne kul ₹1500 kamaye. Net ₹1050 bacha. Penalty ₹100 lagi.' : 'Today you earned ₹1500. Net ₹1050 after expenses.',
    visual: 'Net ₹1050 • Penalty ₹100 (late delivery)',
    followupAction: 'view_penalty',
    ttsAudioUrl: null
  };
  res.json(response);
});

app.post('/api/voice/followup', (req, res) => {
  const action = req.body.action || 'unknown';
  if (action === 'view_penalty') {
    return res.json({
      speechText: 'Penalty details: Delivery late by 30 minutes. Aap contest karna chahte hain?',
      visual: 'Penalty: ₹100 • Reason: Late by 30 min',
      followupAction: 'contest_penalty'
    });
  }
  res.json({ speechText: 'Action completed.', visual: action });
});

app.get('/', (req, res) => res.send('Porter Saathi backend running'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server listening on', port));
