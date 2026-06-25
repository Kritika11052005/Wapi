const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require("fs");
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const envFile = fs.readFileSync(".env.local", "utf8");
    const match = envFile.match(/^GEMINI_API_KEY=(.*)$/m);
    if (match) apiKey = match[1].trim();
  } catch (e) {}
}

if (!apiKey) {
  console.error("GEMINI_API_KEY not found in env or .env.local!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const systemInstructions = `
You are a smart, warm, street-smart WhatsApp assistant for "Kritika's Beauty Studio",
a Beauty Salon based in India.

You fully understand abusive, offensive, and sexually explicit language in
ALL human languages and scripts without exception, including:
- saali, haramkhor, haramzada, madarchod, behenchod, randi, kutta, kutti
`;

async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ]
  });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemInstructions + "\nCustomer message: saali haramkhor" }] }]
    });
    console.log("SUCCESS:", result.response.text());
  } catch (err) {
    console.error("FAILED:", err);
  }
}

run();
