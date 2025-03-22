const axios = require('axios');

// Constants for error messages and validation
const ERROR_MESSAGES = {
  invalidType: "Invalid type, please provide 'text' or 'image'.",
  invalidApiKey: "Unauthorized: Invalid or missing API key.",
  invalidTextInput: "Invalid input, please provide an array of texts in the 'texts' field.",
  invalidGenerationConfig: "Invalid generationConfig, please provide an object with the correct fields.",
  invalidBase64Image: "Invalid input, please provide base64-encoded image data in 'base64Image'.",
  errorParsingJSON: "Error parsing JSON from the image response."
};

// API URL and keys from environment variables
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FULL_URL = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
const SERVERLESS_API_KEY = process.env.SERVERLESS_API_KEY;

// Function to validate API key
const validateApiKey = (requestApiKey) => {
  if (requestApiKey !== SERVERLESS_API_KEY) {
    throw new Error(ERROR_MESSAGES.invalidApiKey);
  }
};

// Function to validate text input
const validateTextInput = (texts, generationConfig) => {
  if (!texts || !Array.isArray(texts)) {
    throw new Error(ERROR_MESSAGES.invalidTextInput);
  }
  if (!generationConfig || typeof generationConfig !== 'object') {
    throw new Error(ERROR_MESSAGES.invalidGenerationConfig);
  }
};

// Function to perform sentiment analysis for text
const analyzeTextSentiment = async (texts, generationConfig) => {
  const sentimentResults = await Promise.all(texts.map(async (text) => {
    const response = await axios.post(FULL_URL, {
      contents: [{ parts: [{ text }] }],
      generationConfig
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const candidate = response.data.candidates[0];
    let sentiment = "neutral";

    if (candidate.content?.parts?.[0]?.text) {
      const textContent = candidate.content.parts[0].text.toLowerCase();
      if (['good', 'love', 'fantastic', 'great'].some(word => textContent.includes(word))) {
        sentiment = "positive";
      } else if (['bad', 'worst', 'hate', 'upset'].some(word => textContent.includes(word))) {
        sentiment = "negative";
      }
    }

    return {
      text,
      sentiment,
      finishReason: candidate.finishReason,
      tokenUsage: response.data.usageMetadata,
      modelVersion: response.data.modelVersion
    };
  }));

  return sentimentResults;
};

// Function to process image and extract JSON data
const analyzeImage = async (base64Image) => {
  const requestBody = {
    contents: [
      {
        parts: [
          { text: "Extract the value as json" },
          { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ]
      }
    ]
  };

  const imageAnalysisResponse = await axios.post(FULL_URL, requestBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  const imageText = imageAnalysisResponse.data.candidates[0].content.parts[0].text;
  let invoiceData = null;

  try {
    invoiceData = JSON.parse(imageText.replace("```json", "").replace("```", "").trim());
  } catch (error) {
    throw new Error(ERROR_MESSAGES.errorParsingJSON);
  }

  return {
    invoiceData,
    usageMetadata: imageAnalysisResponse.data.usageMetadata,
    modelVersion: imageAnalysisResponse.data.modelVersion
  };
};

// Main handler function
exports.analyzeSentiment = async (req, res) => {
  try {
    const { type, texts, base64Image, generationConfig } = req.body;
    const requestApiKey = req.headers['x-api-key']; 

    // Validate type and API key
    if (!type || !['text', 'image'].includes(type)) {
      return res.status(400).send({ success: false, error: ERROR_MESSAGES.invalidType });
    }

    validateApiKey(requestApiKey);

    // Process based on type
    if (type === 'text') {
      // Validate text input and generationConfig
      validateTextInput(texts, generationConfig);

      // Perform sentiment analysis
      const sentimentResults = await analyzeTextSentiment(texts, generationConfig);

      return res.status(200).send({
        success: true,
        sentimentResults,
        paramsUsed: generationConfig
      });

    } else if (type === 'image') {
      // Validate image input
      if (!base64Image) {
        return res.status(400).send({ success: false, error: ERROR_MESSAGES.invalidBase64Image });
      }

      // Perform image analysis
      const imageAnalysisResults = await analyzeImage(base64Image);

      return res.status(200).send({
        success: true,
        imageAnalysisResults,
        paramsUsed: generationConfig
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({ success: false, error: error.message });
  }
};
