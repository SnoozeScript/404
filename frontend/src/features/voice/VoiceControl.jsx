import React, { useState } from "react";

const API_BASE = "http://localhost:8000";

const VoiceControl = () => {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Voice command failed.");
      setResponse(data.response_text);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Voice Command</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Enter transcript (speech)"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-2"
          required
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border px-3 py-2 rounded mb-2"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? "Processing..." : "Send Command"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {response && (
        <div className="bg-purple-50 p-4 rounded">
          <h3 className="font-semibold mb-2">AI Response</h3>
          <div className="text-gray-700 whitespace-pre-line">{response}</div>
        </div>
      )}
    </div>
  );
};

export default VoiceControl;
