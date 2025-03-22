# Serverless Sentiment Analysis API Deployment on Google Cloud

====================================================================================

This guide outlines the steps to deploy a serverless sentiment analysis API using Google Cloud Functions. The API utilizes the Gemini API for sentiment analysis and can be accessed via a public endpoint.

Author : Hernando Ivan Teddy

## Steps for Deployment

### 1. **Create a New Project in Google Cloud Console**
   - Go to the Google Cloud Console and create a new project.

### 2. **Generate an API Key in Google Cloud Console**
   - Navigate to the "API & Services" section in the Google Cloud Console and generate an API key for your project.
   - Save the generated API key securely (e.g., `api_key: <<api_key>>`).

### 3. **Activate Google Cloud Shell**
   - Open the Google Cloud Shell within the Google Cloud Console to interact with your project.

### 4. **Retrieve Your Project ID**
   - In the Google Cloud Console, find your project ID and note it down (e.g., `project_id: <<project_id>>`).

### 5. **Set the Active Project in Cloud Shell**
   - Run the following command to set the active project:
     ```bash
     gcloud config set project <<project_id>>
     ```

### 6. **Enable Required APIs**
   - Enable the necessary APIs for Cloud Functions and Cloud Build by executing the following command:
     ```bash
     gcloud services enable cloudfunctions.googleapis.com cloudbuild.googleapis.com run.googleapis.com
     ```

### 7. **Test the API via Postman**
   - Use Postman (or any API testing tool) to test the generated API key and ensure everything is working as expected.

---

### 8. **Deploy the Serverless Function**

   - Open the Google Cloud Shell and follow these steps to set up your serverless function:

### 9. **Create a Directory for Your Project**
   - In Cloud Shell, create a new directory for your project:
     ```bash
     mkdir gemini-sentiment-api
     cd gemini-sentiment-api
     ```

### 10. **Open the Editor**
   - Open the "Editor" tab within Google Cloud Shell to edit your files.

### 11. **Initialize the Node.js Project and Install Dependencies**
   - In the Cloud Shell editor, run the following commands to initialize the Node.js project and install Axios:
     ```bash
     npm init -y
     npm install axios
     ```

### 12. **Create the `index.js` File**
   - Download the `index.js` file from the provided GitHub repository or create it manually in your Cloud Shell editor.

### 13. **Replace API Key in the `index.js` File**
   - In the `index.js` file, replace the placeholder API key with the actual Gemini API key.

### 14. **Deploy the Function to Google Cloud**
   - Deploy the function to Google Cloud using the following command:
     ```bash
     gcloud functions deploy analyzeSentiment \
       --runtime nodejs20 \
       --trigger-http \
       --allow-unauthenticated \
       --set-env-vars GEMINI_API_URL="<<GEMINI_API_URL>>",GEMINI_API_KEY="<<GEMINI_API_KEY>>",SERVERLESS_API_KEY="<<your_serverless_api_key_custom_name>>"
     ```

### 15. **Obtain the Deployment URL**
   - After deployment, Google Cloud will provide the URL for the deployed function along with other deployment details, such as:
     - URL: `https://us-central1-<<project_id>>.cloudfunctions.net/analyzeSentiment`
     - The state should be `ACTIVE` after successful deployment.

### 16. **Verify API Availability in Google Cloud Console**
   - Go to the Google Cloud Console and verify that the API is active and operational.

### 17. **Test the API**
   - Now, use Postman or any HTTP client to test the deployed API endpoint to ensure everything is working properly.



