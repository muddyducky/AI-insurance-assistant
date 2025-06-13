
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { assistantPrompt } = require("./src/prompt.js");
const { app, PORT } = require("./src/server.js");

app.use(cors({ origin: "http://localhost:5173" }));

//___ INITIALIZE AI MODEL ___
//--This part initializes the Google Generative AI model using the provided API key.
let aiModel;
try {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
  console.log("Google Generative AI model initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Google Generative AI model:", error);
  process.exit(1);
}

const generationConfig = {
  maxOutputTokens: 2000,
  temperature: 0.4,
  topP: 1,
};

//___ TEST ENDPOINT ___
//--This endpoint is a simple test to check if the server is running correctly.
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

//___ CHAT ENDPOINT ___
//--This endpoint handles incoming chat messages from the frontend, 
//...processes them with the AI model, and returns the AI's response.
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const conversationHistory = req.body.history || []; 

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  console.log(`Received message from frontend: "${userMessage}"`);
  console.log("Current conversation history from frontend:", conversationHistory);

  try {
    const chat = aiModel.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: assistantPrompt.text }],
      },
      history: conversationHistory, 
      generationConfig,
    });

//___ USER RESPONSE ___
//--This part sends the user's message to the AI model and waits for a response.
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    console.log(`AI response: "${responseText}"`);
    res.json({ reply: responseText });
  } catch (error) {
    console.error("Error generating content from AI:", error);
    res.status(500).json({ error: "Failed to get response from AI assistant" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});