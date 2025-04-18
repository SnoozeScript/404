


import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import MarketView from "./features/market/MarketView";
import DiseaseDetector from "./features/Disease/DiseaseDetector";
import VoiceControl from "./features/voice/VoiceControl";
import YieldPredictor from "./features/yield/YieldPredictor";

function App() {
  return (
    <Router>
      <nav className="bg-gray-900 text-white px-4 py-3 flex gap-4 items-center shadow">
        <span className="font-bold text-lg text-green-400"> Dashboard</span>
        <Link to="/market" className="hover:text-green-300">Market</Link>
        <Link to="/disease" className="hover:text-blue-300">Disease Detector</Link>
        <Link to="/voice" className="hover:text-purple-300">Voice Control</Link>
        <Link to="/yield" className="hover:text-green-200">Yield Predictor</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/market" replace />} />
        <Route path="/market" element={<MarketView />} />
        <Route path="/disease" element={<DiseaseDetector />} />
        <Route path="/voice" element={<VoiceControl />} />
        <Route path="/yield" element={<YieldPredictor />} />
      </Routes>
    </Router>
  );
}

export default App;

