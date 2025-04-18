import React, { useState } from "react";
import { predictYieldApi } from '../../services/api';

const API_BASE = "http://localhost:8000";

const YieldPredictor = () => {
  const [form, setForm] = useState({
    crop_type: "",
    area: "",
    region: "",
    soil: "",
    weather: "",
  });
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction("");
    setError("");
    try {
      const data = await predictYieldApi({
        crop_type: form.crop_type,
        area: form.area,
        region: form.region,
        soil: form.soil || undefined,
        weather: form.weather || undefined,
      });
      setPrediction(data.prediction_text);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };


  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Yield Predictor</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <input
          type="text"
          name="crop_type"
          placeholder="Crop Type (e.g., Wheat)"
          value={form.crop_type}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="area"
          placeholder="Area (e.g., 2 acres)"
          value={form.area}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="region"
          placeholder="Region (e.g., Baramati MIDC)"
          value={form.region}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
          required
        />
        <input
          type="text"
          name="soil"
          placeholder="Soil Type (optional)"
          value={form.soil}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          name="weather"
          placeholder="Weather Info (optional)"
          value={form.weather}
          onChange={handleChange}
          className="border px-3 py-2 rounded w-full"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict Yield"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {prediction && (
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold mb-2">AI Yield Prediction</h3>
          <div className="text-gray-700 whitespace-pre-line">{prediction}</div>
        </div>
      )}
    </div>
  );
};

export default YieldPredictor;
