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

/**
 * Yield Prediction API
 * @param {object} yieldData { crop, area, season, state, annual_rainfall, fertilizer, pesticide, ph, n, p, k, organic_carbon }
 * @returns {Promise<object>} Backend response
 */
export const predictYieldApi = async (yieldData) => {
  try {
    const response = await apiClient.post('/yield/predict', yieldData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

/**
 * Get Market Prices
 * @returns {Promise<object>} Backend response
 */
export const getMarketPricesApi = async () => {
  try {
    const response = await apiClient.get('/market/prices');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

/**
 * Get Market Summary
 * @returns {Promise<object>} Backend response
 */
export const getMarketSummaryApi = async () => {
  try {
    const response = await apiClient.get('/market/summary');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

/**
 * Get Market Trends for a Crop
 * @param {string} crop Crop name
 * @returns {Promise<object>} Backend response
 */
export const getMarketTrendsApi = async (crop) => {
  try {
    const response = await apiClient.get(`/market/trends/${encodeURIComponent(crop)}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

/**
 * Voice Command API
 * @param {object} commandData { transcript, language }
 * @returns {Promise<object>} Backend response
 */
export const processVoiceCommandApi = async (commandData) => {
  try {
    const response = await apiClient.post('/voice/command', commandData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

/**
 * Chat Assistant API (non-streaming)
 * @param {object} chatData { message, history }
 * @returns {Promise<object>} Backend response
 */
export const chatAssistantApi = async ({ message, history, agent }) => {
  try {
    const response = await apiClient.post('/chat/message', {
      message,
      history,
      agent,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

/**
 * Multilingual Gemini Chat API
 * @param {object} chatData { message, session_id, language }
 * @returns {Promise<object>} Backend response
 */
export const multilingualChatApi = async ({ message, session_id, language }) => {
  try {
    const response = await apiClient.post('/multilingual_chat/message', {
      message,
      session_id,
      language,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please check your network connection or if the backend is running.');
    } else {
      throw new Error(`Error sending request: ${error.message}`);
    }
  }
};

// For streaming chat, use fetch directly in the component for fine-grained control.