const { GoogleGenAI } = require("@google/genai");
const {
  questionAnswerPrompt,
  conceptExplainPrompt,
} = require("../utils/prompts");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @desc Generate interview questions and answers using Gemini
// @route POST /api/ai/generate-questions
// @access Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;

    // Clean it: Remove ```json and ``` from beginning and end
    const cleanedText = rawText
      .replace(/^```json\s*/, "") // Remove starting ```json
      .replace(/```$/, "") // Remove ending ```
      .trim();

    // Now safe to parse
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

// @desc Generate explanation for a concept or interview question
// @route POST /api/ai/generate-explanation
// @access Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body; // Expecting 'question' from the request body

    if (!question) {
      // If the 'question' field is missing, send a 400 Bad Request response
      return res
        .status(400)
        .json({ message: "Missing required field: 'question'." });
    }

    // Generate the prompt using the imported prompt template
    const prompt = conceptExplainPrompt(question);

    // Get the generative model (using 'genAI' as consistent with previous full example)
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text; // Get the raw text content from the AI's response

    // Clean the raw text: Remove Markdown code block delimiters (```json)
    // The prompt expects a pure JSON object, but sometimes models might wrap it.
    const cleanedText = rawText
      .replace(/^```json\s*/, "") // Remove starting ```json and any whitespace
      .replace(/```$/, "") // Remove ending ```
      .trim(); // Remove any extra leading/trailing whitespace

    // Now it's safe to parse the cleaned text into a JavaScript object
    const data = JSON.parse(cleanedText);

    // Send a 200 OK response with the parsed data
    res.status(200).json(data);
  } catch (error) {
    // Log the error for debugging purposes on the server
    console.error("Error generating concept explanation:", error);

    // Send a 500 Internal Server Error response to the client
    res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message, // Include the specific error message from the caught error
    });
  }
};

module.exports = {
  generateInterviewQuestions,
  generateConceptExplanation,
};
