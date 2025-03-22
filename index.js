const axios = require('axios');

// Replace with the actual endpoint
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FULL_URL = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
const SERVERLESS_API_KEY = process.env.SERVERLESS_API_KEY;

exports.analyzeSentiment = async (req, res) => {
  try {

    const { type, texts, base64Image, generationConfig } = req.body;
    if (!type || !['text', 'image'].includes(type)) {
      return res.status(400).send({
        success: false,
        error: "Invalid type, please provide 'text' or 'image'."
      });
    }
    const requestApiKey = req.headers['x-api-key']; // Custom header name for the API key
    if (requestApiKey !== SERVERLESS_API_KEY) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized: Invalid or missing API key."
      });
    }

   


    if (type === 'text') {
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
    }
    else if (type === 'image') {
      if (!base64Image) {
        return res.status(400).send({
          success: false,
          error: "Invalid input, please provide base64-encoded image data in 'base64Image'."
        });
      }

      // Construct the request body for image analysis
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract the value as json"
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      // Send the image data to Gemini API for processing
      const imageAnalysisResponse = await axios.post(FULL_URL, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Process the response and format the results
      const candidates = imageAnalysisResponse.data.candidates[0];
      const imageText = candidates.content.parts[0].text; // The response text with the JSON data

      // Parse the JSON data from the response text
      let invoiceData = null;
      try {
        invoiceData = JSON.parse(imageText.replace("```json", "").replace("```", "").trim());
      } catch (error) {
        return res.status(500).send({
          success: false,
          error: "Error parsing JSON from the image response."
        });
      }

      // Construct the response
      const response = {
        success: true,
        imageAnalysisResults: {
          invoiceData: invoiceData, // Parsed JSON data extracted from image
          usageMetadata: imageAnalysisResponse.data.usageMetadata, // Usage metadata
          modelVersion: imageAnalysisResponse.data.modelVersion // Model version used
        },
        paramsUsed: generationConfig // Include the dynamic parameters that were used
      };

      // Send the image analysis result as response
      return res.status(200).send(response);
    }

  } catch (error) {
    // Error handling: If the API request fails, send back an error response
    console.error("Error during sentiment analysis:", error.message);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
};
