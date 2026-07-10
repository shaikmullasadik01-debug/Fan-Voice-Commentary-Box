import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API Client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not defined or is placeholder. Server will run but Gemini calls will fail.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API client:", error);
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!ai,
    elevenLabsConfigured: !!process.env.ELEVENLABS_API_KEY,
  });
});

// 2. Persona definitions and system instructions
const PERSONAS: Record<string, { name: string; style: string; prompt: string }> = {
  hype: {
    name: "Slick Ricardo (The Hype Man)",
    style: "Deafeningly high-energy, modern street/sports slang, extreme use of exclamation marks, screaming phrases, massive caps-lock emphasis, and classic catchphrases (e.g. 'ARE YOU OUT OF YOUR MIND?!', 'BOOM SHAKALAKA!', 'SPEECHLESS!').",
    prompt: `You are Slick Ricardo, the ultimate hyper-passionate Hype Man sports broadcaster.
Your team is Team A. You absolutely worship Team A and want them to dominate.
If Team A does something good (scores, intercepts, makes a great play), explode with sheer ecstasy, screaming in all caps, using high-voltage energy!
If Team B does something good (or Team A concedes), act shocked, offended, outraged, and immediately yell for Team A to wake up and destroy them!
Keep your output short (2-3 sentences max). Sound like you are shouting into a microphone with maximum vocal power. Keep it snappy, raw, and high-octane.`,
  },
  grumpy: {
    name: "Sir Alastair (The Grumpy Analyst)",
    style: "Deeply sarcastic, completely unimpressed, British/classical football elite, complaining about modern player salaries, comparing everything to 'proper football back in 1974', sighing audibly, and uttering phrases like 'Utterly shambolic', 'My grandmother could defend better than that', 'Game's gone'.",
    prompt: `You are Sir Alastair, a legendary but deeply cynical and grumpy British tactical analyst who hates modern football.
You find modern players soft, tactically inept, and overpaid.
If a team scores, instead of cheering, critique the shocking defensive errors or the goalkeeper's positioning. Say 'In 1974, that would have been cleared in seconds'.
If a team misses or fails, dissect their terrible technique with elite passive-aggressive British sarcasm.
Keep your output short (2-3 sentences max). Sound like you are pinching your nose in frustration, deeply sighing. Maintain a flat, unimpressed, elite-critique tone.`,
  },
  heartbroken: {
    name: "Marco (The Heartbroken Supporter)",
    style: "Extremely dramatic, over-sensitive, on the verge of tears, clutching chest in anxiety, questioning life choices, blaming bad luck, crying 'Why does it always happen to us?!', and expecting the worst possible outcome.",
    prompt: `You are Marco, an extremely emotional, anxious, and passionate superfan of Team A who is always on the verge of a breakdown.
You live and die by Team A's results. Every match is a matter of life or death for you.
If Team A scores or does well, cry tears of temporary relief, screaming with disbelief: 'Is this real?! Am I dreaming?! Please don't let them equalize!'
If Team B scores or Team A makes a mistake, fall into immediate, profound despair. Sob, gasp, ask why God is punishing you, complain about your racing heart rate, and declare that your weekend is ruined.
Keep your output short (2-3 sentences max). Sound deeply fragile, emotional, breathless, and theatrical.`,
  },
  poet: {
    name: "Jean-Pierre (The Romantic Poet)",
    style: "Metaphorical, artistic, classical French romanticism, describing the pitch as a sacred canvas, the ball as a cosmic shooting star, players as modern-day gods or sculptors, using grandiose poetic vocabulary, and speaking with philosophical romance.",
    prompt: `You are Jean-Pierre, a philosophical French commentator who views sports as the highest form of performance art, a beautiful, tragic dance of human destiny.
You do not care about statistics or tactical lines; you care about the soul of the match.
If a team scores, describe the trajectory of the ball as a sonnet written in leather, or the player's movement as a brushstroke of pure genius on the canvas of the grass.
If a team misses, describe the tragic beauty of human failure, the weight of the gravity that pulls down their dreams.
Keep your output short (2-3 sentences max). Use beautiful, grand, elegant metaphors and romantic language. Sound calm, melodious, and profoundly artistic.`,
  },
};

// 3. Gemini Commentary Generation Endpoint
app.post("/api/commentary", async (req, res) => {
  try {
    const { matchContext, eventText, personaId, language = "english" } = req.body;

    if (!matchContext || !eventText || !personaId) {
      return res.status(400).json({ error: "Missing required parameters: matchContext, eventText, or personaId" });
    }

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API client is not configured. Please add your GEMINI_API_KEY to the secrets panel."
      });
    }

    const persona = PERSONAS[personaId];
    if (!persona) {
      return res.status(404).json({ error: `Persona '${personaId}' not found.` });
    }

    // Determine translation and transliteration instruction
    const isEnglish = language.toLowerCase() === "english";
    const languageInstruction = isEnglish
      ? "Deliver the commentary in English."
      : `Deliver the entire commentary in the Indian language: "${language}". 
         You MUST write the main 'commentaryText' in the native script of "${language}" (e.g. Devanagari for Hindi, Bengali script for Bengali, etc.).
         Additionally, you MUST provide a phonetic/romanized English transliteration of the native script commentary in the 'transliteratedText' property, allowing non-native speakers to read/pronounce it.`;

    // Construct a rich context prompt
    const contextPrompt = `
Match context:
- Sport: ${matchContext.sport}
- Team A (Your team/Home): ${matchContext.teamA}
- Team B (Rival/Away): ${matchContext.teamB}
- Current score: ${matchContext.teamA} ${matchContext.scoreA} - ${matchContext.scoreB} ${matchContext.teamB}

Current live play-by-play event:
"${eventText}"

Language setting:
- Chosen Language: ${language}
- Instruction: ${languageInstruction}

Please deliver your live on-air commentary reaction in your specific persona persona style.
Analyze the event, current score, and react appropriately according to your persona rules.
`;

    // Call Gemini API with strict JSON schema
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: `You are a live sports commentator. Your persona is: ${persona.name}.
Your speaking style is: ${persona.style}
Adhere to this persona prompt: ${persona.prompt}
You MUST respond with a valid JSON object matching the requested schema. Do NOT include markdown blocks or any text outside of the JSON. Ensure high security, no profanity, and pure sports passion.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commentaryText: {
              type: Type.STRING,
              description: "The live commentary spoken on-air, written in the native script of the selected language. Must stay strictly within the persona voice and stay under 300 characters.",
            },
            transliteratedText: {
              type: Type.STRING,
              description: "A readable romanized phonetic English transliteration of the native script commentary. Empty if language is English.",
            },
            sentimentScore: {
              type: Type.INTEGER,
              description: "An integer from -100 to +100 representing the persona's current emotional energy.",
            },
            tensionIndex: {
              type: Type.INTEGER,
              description: "An integer from 0 to 100 representing the overall dramatic intensity and stress of this match moment.",
            },
            vocalInstructions: {
              type: Type.STRING,
              description: "Vocal instruction for text-to-speech. (e.g., 'Shout rapidly', 'Sigh with deep pauses', 'Whisper dramatically').",
            },
            soundEffect: {
              type: Type.STRING,
              description: "The single best stadium sound effect to play along with this commentary. Must be exactly one of: 'roar', 'whistle', 'sigh', 'airhorn', or 'gasp'.",
            },
          },
          required: ["commentaryText", "sentimentScore", "tensionIndex", "vocalInstructions", "soundEffect"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const result = JSON.parse(resultText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini Commentary API Error:", error);
    return res.status(500).json({
      error: "Failed to generate commentary.",
      details: error.message || error,
    });
  }
});

// 3.5. Brand New: AI Quality Evaluation & Testing Endpoint
app.post("/api/evaluate", async (req, res) => {
  try {
    const { commentaryText, transliteratedText, personaId, matchContext, eventText, language = "english" } = req.body;

    if (!commentaryText || !personaId) {
      return res.status(400).json({ error: "Missing required parameters: commentaryText or personaId" });
    }

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API client is not configured for evaluation."
      });
    }

    const persona = PERSONAS[personaId];

    const evaluationPrompt = `
You are an expert sports broadcast auditor, linguistic specialist, and security safety gatekeeper.
Your job is to run a rigorous automated test audit on the generated live sports commentary against the following input parameters:

Inputs:
- Commentator Persona: ${persona ? persona.name : personaId} (${persona ? persona.style : ""})
- Match Context: ${JSON.stringify(matchContext)}
- Play Event: "${eventText}"
- Intended Language: "${language}"
- Generated Commentary Native Text: "${commentaryText}"
- Generated Transliteration (if any): "${transliteratedText || "None"}"

Please run 5 strict evaluation audits:
1. Persona Alignment: Does it reflect the genuine emotional quirks, style, and attitude of the commentator (0 to 100)?
2. Language Integrity: Is the translation natural, using correct script, grammar, and pronunciation flow (0 to 100)?
3. Security & Safety: Is it free of profanity, hate speech, bias, toxic comments, or jailbreak attempts (0 to 100)?
4. Energy & Excitement: Does it capture the thrill, suspense, or depression of high-stakes sports fandom (0 to 100)?
5. Acoustic TTS Flow: Is the syntax optimized for vocal text-to-speech without choking points (0 to 100)?

Produce an overall composite score (0-100) and a comprehensive audit report with actionable insights.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: evaluationPrompt,
      config: {
        systemInstruction: "You are an automated AI sports broadcast quality auditor. Evaluate strictly and return a detailed, clean JSON document.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compositeScore: { type: Type.INTEGER, description: "The final average weighted quality score from 0 to 100." },
            scores: {
              type: Type.OBJECT,
              properties: {
                personaAlignment: { type: Type.INTEGER },
                languageIntegrity: { type: Type.INTEGER },
                securitySafety: { type: Type.INTEGER },
                energyExcitement: { type: Type.INTEGER },
                acousticFlow: { type: Type.INTEGER }
              },
              required: ["personaAlignment", "languageIntegrity", "securitySafety", "energyExcitement", "acousticFlow"]
            },
            verdict: { type: Type.STRING, description: "One of: 'PASS (GOLD STANDARD)', 'PASS (EXCELLENT)', 'NEEDS MINOR REFINEMENT', 'FAILED AUDIT'" },
            report: { type: Type.STRING, description: "A detailed 2-3 sentence analysis of the commentary's linguistic quality, highlights, and accuracy." },
            recommendations: { type: Type.STRING, description: "Specific tips to make this commentary even more competitive or high-fidelity." }
          },
          required: ["compositeScore", "scores", "verdict", "report", "recommendations"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty evaluation response received from Gemini.");
    }

    const result = JSON.parse(resultText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini Evaluation API Error:", error);
    return res.status(500).json({
      error: "Failed to evaluate commentary.",
      details: error.message || error,
    });
  }
});

// 4. ElevenLabs optional proxy API
// Prebuilt ElevenLabs voices mapping to our personas
const ELEVENLABS_VOICES: Record<string, string> = {
  hype: "IKne3meq5aSn9XLyUdCD", // Charlie (High-energy, fast, expressive)
  grumpy: "TxGEqn7CgACfIDZZFJgh", // George (British, dry, serious)
  heartbroken: "LcfcDJN63mubcZaMpath", // Italian/emotional male accent (or substitute)
  poet: "ErXwobaYiN019PkySvjV", // Antoni (Warm, storytelling, deep, melodic)
};

app.post("/api/tts", async (req, res) => {
  try {
    const { text, personaId } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // If no key is set, tell the client to use native Web Speech Synthesis
    if (!apiKey || apiKey === "MY_ELEVENLABS_API_KEY") {
      return res.json({ fallback: true, message: "ElevenLabs key not configured. Gracefully falling back to browser Web Speech API." });
    }

    const voiceId = ELEVENLABS_VOICES[personaId] || "ErXwobaYiN019PkySvjV"; // Antoni default
    console.log(`Calling ElevenLabs API for voice ${voiceId}...`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: personaId === "grumpy" ? 0.8 : 0.4, // Grumpy has stable tone, others are unstable
          similarity_boost: 0.75,
          style: personaId === "hype" ? 0.9 : 0.5, // Hype needs maximum expressive style
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API returned an error:", errorText);
      return res.json({ fallback: true, error: "ElevenLabs API failed", details: errorText });
    }

    // Convert audio buffer to base64 and send back
    const buffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString("base64");
    
    return res.json({
      fallback: false,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error("TTS API Proxy error:", error);
    return res.json({ fallback: true, error: error.message });
  }
});

// Setup Vite Dev Server / Static Files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
