import React, { useState } from "react";
import { processVoiceCommandApi } from '../../services/api';
import { FaMicrophone, FaSpinner, FaPaperPlane } from "react-icons/fa";
import { MdVoiceChat, MdTranslate } from "react-icons/md";

const API_BASE = "http://localhost:8000/api/v1";

const VoiceControl = () => {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const data = await processVoiceCommandApi({ transcript, language });
      setResponse(data.response_text || "No response from AI.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto p-6 bg-white rounded-xl shadow-lg border border-green-100">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-green-100 rounded-full text-green-800 mb-4">
            <MdVoiceChat className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-green-900">
            Voice Command
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMicrophone className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Enter transcript (speech)"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 pl-10 pr-3 py-2 rounded-lg w-full transition-all duration-300"
              required
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg border border-green-100">
              <MdTranslate className="text-green-700 mr-2" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent focus:outline-none text-green-800"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-300 flex items-center font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" />
                  Send Command
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {response && (
          <div className="bg-green-50 p-5 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-2 text-green-800">AI Response</h3>
            <div className="text-gray-700 whitespace-pre-line">{response}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceControl;
