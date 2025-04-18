import axios from 'axios';

// Get the backend URL from environment variables (good practice for deployment)
// Fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Sends the image file to the backend for disease detection.
 * @param {File} imageFile The image file to analyze.
 * @returns {Promise<object>} The analysis result from the backend.
 */
export const detectDiseaseApi = async (imageFile) => {
  // Create FormData to send the file
  const formData = new FormData();
  formData.append('file', imageFile); // The key 'file' must match the backend expectation

  try {
    const response = await apiClient.post('/disease/detect', formData, {
      headers: {
        // Axios usually sets 'multipart/form-data' correctly with boundary when sending FormData
        // 'Content-Type': 'multipart/form-data', // You might not need to set this manually
      },
      // Optional: Add timeout
      // timeout: 30000, // 30 seconds
    });
    // Assuming backend returns { analysis: "..." } on success
    return response.data;
  } catch (error) {
    // Enhance error handling: provide more specific messages
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", error.response.data);
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API No Response:", error.request);
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

// Add other API functions here later...
// export const predictYieldApi = async (yieldData) => { ... };
// export const getMarketPricesApi = async () => { ... };
// export const processVoiceCommandApi = async (commandData) => { ... };