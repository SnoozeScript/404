import React, { useState } from "react";

const API_BASE = "http://localhost:8000/api/v1";

const DiseaseDetector = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setResult("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please select an image.");
      return;
    }
    setLoading(true);
    setResult("");
    setError("");
    const formData = new FormData();
    formData.append("file", image);

    try {
      const res = await fetch(`${API_BASE}/disease/detect`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Detection failed.");
      const data = await res.json();
      setResult(data.result || "No result from AI.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-blue-100">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">Disease Detector</h2>
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-4"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-300"
            disabled={loading}
          >
            {loading ? "Detecting..." : "Detect Disease"}
          </button>
        </form>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <strong>Result:</strong> {result}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetector;
