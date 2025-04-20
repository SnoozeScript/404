import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home";
import { ThemeProvider } from "./theme/ThemeContext";
import MarketView from "./features/market/MarketView";
import DiseaseDetector from "./features/Disease/DiseaseDetector";
import VoiceControl from "./features/voice/VoiceControl";
import YieldPredictor from "./features/yield/YieldPredictor";
import ChatAssistant from "./features/chat/ChatAssistant";
import Navbar from "./components/Navbar";
import Microfarm from "./features/microfarm/Microfarm";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<MarketView />} />
          <Route path="/disease" element={<DiseaseDetector />} />
          <Route path="/voice" element={<VoiceControl />} />
          <Route path="/yield" element={<YieldPredictor />} />
          <Route path="/chat" element={<ChatAssistant />} />
          <Route path="/microfarm" element={<Microfarm />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;