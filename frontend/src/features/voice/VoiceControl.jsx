import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000/api/v1";

const VoiceControl = () => {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [location, setLocation] = useState("Baramati");

  // Maintain session for conversation context
  useEffect(() => {
    // Generate a session ID if we don't have one
    if (!sessionId) {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    
    setLoading(true);
    
    // Add user query to conversation history
    const userMessage = {
      type: "user",
      text: transcript,
      language,
      timestamp: new Date().toISOString()
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      const res = await fetch(`${API_BASE}/voice/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transcript, 
          language,
          session_id: sessionId,
          location,
          context_data: {
            prev_intent: detectedIntent
          }
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Voice command failed.");
      }
      
      const data = await res.json();
      // Process the response (now managed through conversation history)
      
      // Save session ID from response
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      
      // Track detected intent for conversation context
      if (data.detected_intent) {
        setDetectedIntent(data.detected_intent);
      }
      
      // Add AI response to conversation history
      const aiMessage = {
        type: "ai",
        text: data.response_text,
        intent: data.detected_intent || "unknown",
        requires_followup: data.requires_followup,
        timestamp: new Date().toISOString()
      };
      
      setConversationHistory(prev => [...prev, aiMessage]);
      
      // Clear transcript for next input
      setTranscript("");
      
    } catch (err) {
      console.error("Voice command error:", err);
      
      // Add error to conversation history
      const errorMessage = {
        type: "error",
        text: err.message,
        timestamp: new Date().toISOString()
      };
      
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-purple-700">Voice Assistant</h2>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Session ID: {sessionId.slice(0, 6)}
        </div>
      </div>
      
      {/* Conversation History */}
      <div className="mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
        {conversationHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p>Your conversation will appear here</p>
            <p className="text-sm mt-2">Try saying "What's the price of wheat?" or "Help me identify a crop disease"</p>
          </div>
        ) : (
          conversationHistory.map((message, index) => (
            <div 
              key={index} 
              className={`mb-3 p-3 rounded-lg ${message.type === 'user' 
                ? 'bg-purple-100 ml-auto max-w-[80%]' 
                : message.type === 'error'
                ? 'bg-red-100 text-red-700 w-full'
                : 'bg-white border border-purple-100 mr-auto max-w-[80%]'}`}
            >
              <div className="text-xs text-gray-500 mb-1 flex justify-between">
                <span>{message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : 'FarmGenius'}</span>
                {message.language && <span className="px-1 bg-purple-50 rounded text-purple-600">{message.language.toUpperCase()}</span>}
              </div>
              <div className="text-gray-800">{message.text}</div>
              {message.intent && message.type === 'ai' && (
                <div className="text-xs text-gray-500 mt-1">Intent: {message.intent}</div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Command Input Form */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border px-3 py-2 rounded text-sm bg-white"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
          </select>
          
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border px-3 py-2 rounded text-sm bg-white"
          >
            <option value="Baramati">Baramati</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
          </select>
        </div>
        
        <div className="flex">
          <input
            type="text"
            placeholder="Type your command here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="border px-4 py-3 rounded-l-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            type="submit"
            className="px-4 py-3 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </form>
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Try asking about:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>"What's the current price of onions?"</li>
          <li>"What are the market trends for wheat?"</li>
          <li>"How much yield can I expect from 2 acres of soybean?"</li>
          <li>"Help me identify a disease on my tomato plants"</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceControl;
