const axios = require('axios');

// Replace with the actual endpoint
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FULL_URL = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
const SERVERLESS_API_KEY = process.env.SERVERLESS_API_KEY;

exports.analyzeSentiment = async (req, res) => {
    try {
      // Extract dummy records and generationConfig from the request body
    const { texts, generationConfig } = req.body; // Expecting 'texts' array and 'generationConfig' object

    const requestApiKey = req.headers['x-api-key']; // Custom header name for the API key
    if (requestApiKey !== SERVERLESS_API_KEY) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized: Invalid or missing API key."
      });
    }

    // Validate the inputs
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).send({
        success: false,
        error: "Invalid input, please provide an array of texts in the 'texts' field."
      });
    }

    if (!generationConfig || typeof generationConfig !== 'object') {
      return res.status(400).send({
        success: false,
        error: "Invalid generationConfig, please provide an object with the correct fields."
      });
    }
      // Send all sentiment analysis requests concurrently using Promise.all
      const sentimentResults = await Promise.all(texts.map((text) => {
        return axios.post(FULL_URL, {
          contents: [{
            parts: [{ text }]
          }],
          generationConfig: generationConfig // Use dynamic generationConfig from the request body
        }, {
          headers: {     
            'Content-Type': 'application/json'
          }
        });
      }));
  
      // Process the responses and format the results
      const results = sentimentResults.map((response, index) => {
        const candidate = response.data.candidates[0]; // We are using the first candidate
        
      // Simple sentiment classification logic based on the generated text response
      let sentiment = "neutral"; // Default to neutral if no clear sentiment is found

      if (candidate.content && candidate.content.parts && candidate.content.parts[0].text) {
        const textContent = candidate.content.parts[0].text.toLowerCase();

        // Sentiment detection based on specific keywords in the response
        if (textContent.includes('good') || textContent.includes('love') || textContent.includes('fantastic') || textContent.includes('great')) {
          sentiment = "positive";
        } else if (textContent.includes('bad') || textContent.includes('worst') || textContent.includes('hate') || textContent.includes('upset')) {
          sentiment = "negative";
        }
      }


        return {
          text: texts[index], // The text from the dummy record
          sentiment: sentiment,  // Sentiment output (you can adjust based on Gemini response)
          finishReason: candidate.finishReason,
          tokenUsage: response.data.usageMetadata,
          modelVersion: response.data.modelVersion
        };
      });
  
      // Send the response back with the sentiment analysis results
      res.status(200).send({
        success: true,
        sentimentResults: results,
        paramsUsed: generationConfig // Include the dynamic parameters that were used in the request
      });
  
    } catch (error) {
      // Error handling: If the API request fails, send back an error response
      console.error("Error during sentiment analysis:", error.message);
      res.status(500).send({
        success: false,
        error: error.message
      });
    }
  };
