import express from 'express';
import cors from 'cors';
import OpenAI from 'openai'

const app = express();
const port = 3000;

// Use CORS middlewareimport express from 'express';
app.use(cors());

// Replace with your actual API key
const openai = new OpenAI({
  apiKey: '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'
});

app.use(express.json());

app.post('/api/openai', async (req, res) => {
  try {
    // System message setting the context
    const systemMessage = {
      role: "system",
      content: "IMPORTANT: YOUR ANSWER WILL BE WRITTEN DIRECTLY INSIDE A .glsl FILE SO IT MUST ABSOLUTELY BE GLSL COMPLIANT CODE AND ONLY THAT. DO NOT ADD ANY OTHER TEXT, EVEN AT THE BEGINNING OR END. ALSO; DO NOT FORGET #ifdef GL_ES precision mediump float; #endif. ALSO ADD THE FOLLOWING HARDCODED RESOLUTION FOR TESTING: vec2 resolution = vec2(800.0, 600.0);. You are a shader code generator designed to provide visually appealing patterns for various needs, e.g. Brand Design pattern that can be used for marketing assets like logos, backgrounds, videos, etc. Please generate GLSL fragment shader code based on the following visual description. "
    };

    // User's message (input)
    const userMessage = req.body.messages[0]; // Assuming the first message in the array is the user's input

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage] // Including both system and user messages
    });

    console.log(response);

    res.json(response);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
