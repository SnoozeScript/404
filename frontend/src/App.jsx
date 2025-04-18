import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home";
import MarketView from "./features/market/MarketView";
import DiseaseDetector from "./features/Disease/DiseaseDetector";
import VoiceControl from "./features/voice/VoiceControl";
import YieldPredictor from "./features/yield/YieldPredictor";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<MarketView />} />
        <Route path="/disease" element={<DiseaseDetector />} />
        <Route path="/voice" element={<VoiceControl />} />
        <Route path="/yield" element={<YieldPredictor />} />
      </Routes>
    </Router>
  );
}

export default App;
