import React, { useState, useRef, useEffect } from "react";
import { chatAssistantApi } from '../../services/api';
import { 
  FaPaperPlane, 
  FaSpinner, 
  FaLeaf, 
  FaSeedling, 
  FaCloudSun, 
  FaRegCheckCircle,
  FaShareAlt,
  FaMapMarkerAlt,
  FaInfoCircle
} from "react-icons/fa";
import { GiWheat, GiFarmTractor } from "react-icons/gi";
import { MdOutlineScience, MdOutlineWaterDrop } from "react-icons/md";
import { WiHumidity } from "react-icons/wi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Custom icon component for consistency with theme
const FaChartLine = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    fill="currentColor"
  >
    <path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/>
  </svg>
);

// Custom agent icons that match theme
const AGENT_AVATARS = {
  general_assistant: <GiFarmTractor className="text-amber-600" />,
  market_expert: <FaChartLine className="text-blue-600" />,
  weather_advisor: <FaCloudSun className="text-sky-600" />,
  crop_doctor: <FaSeedling className="text-green-600" />
};

// Reusing FadeInSection component from YieldPredictor for consistency
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible(true);
        if (domRef.current) {
          observer.unobserve(domRef.current);
        }
      }
    });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (observer && currentRef) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Tooltip component reused from YieldPredictor
const Tooltip = ({ content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Information"
      >
        <FaInfoCircle className="text-sm" />
      </button>
      {showTooltip && (
        <div className="absolute z-10 w-48 p-2 mt-2 text-xs text-white bg-gray-800 rounded-md shadow-lg left-1/2 transform -translate-x-1/2">
          {content}
        </div>
      )}
    </div>
  );
};

function ChatAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to FarmGenius AI! I'm here to assist with all your agricultural needs - from crop management and weather insights to market trends and farming advice. How can I help your farm thrive today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("general_assistant");
  const chatEndRef = useRef(null);

  const agentOptions = [
    { value: "general_assistant", label: "Farm Assistant", icon: <GiFarmTractor /> },
    { value: "market_expert", label: "Market Expert", icon: <FaChartLine /> },
    { value: "weather_advisor", label: "Weather Advisor", icon: <FaCloudSun /> },
    { value: "crop_doctor", label: "Crop Doctor", icon: <FaSeedling /> },
  ];

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setError("");
    setLoading(true);
    
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    
    try {
      const data = await chatAssistantApi({
        message: input,
        history: newMessages.filter(m => m.role !== 'error').map(m => ({ role: m.role, content: m.content })),
        agent: selectedAgent
      });
      
      setMessages([...newMessages, { role: "assistant", content: data.response || "(No response)" }]);
    } catch (err) {
      let errorMsg = err.message;
      if (errorMsg && errorMsg.includes('429')) {
        errorMsg = `🚫 <b>API quota exceeded.</b>\nYou've hit the usage limit for your AI plan.\n\n<b>What you can do:</b>\n- Wait a few minutes and try again.\n- Check your API billing and quota settings.\n- Contact your admin if the issue persists.\n\n<small>(Error code: 429)</small>`;
      }
      
      setMessages([
        ...newMessages,
        {
          role: "error",
          content: errorMsg,
          retry: errorMsg.includes('429')
        }
      ]);
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const text = messages.map(m => {
      const prefix = m.role === 'user' ? '👤' : m.role === 'assistant' ? '🤖' : '⚠️';
      return `${prefix} ${m.content}`;
    }).join('\n\n');
    
    if (navigator.share) {
      navigator.share({ title: 'FarmGenius Chat', text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Conversation copied to clipboard!");
    }
  };

  // Handle agent change
  const handleAgentChange = (e) => {
    const newAgent = e.target.value;
    setSelectedAgent(newAgent);
    
    // Add system message indicating agent change
    const selectedAgentInfo = agentOptions.find(a => a.value === newAgent);
    setMessages([
      ...messages,
      { 
        role: "system", 
        content: `Switching to ${selectedAgentInfo?.label || 'Assistant'} mode. How can I help you?` 
      }
    ]);
  };

  // Handle quick question selection
  const handleQuickQuestion = (question) => {
    setInput(question);
    // Focus the input field
    document.querySelector('input[type="text"]').focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50 pt-24 pb-12 flex flex-col items-center justify-center px-4">
      {/* Subtle background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Subtle wheat accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              right: "10%",
              top: "15%",
              opacity: 0.15,
              transform: "rotate(45deg) scale(2.5)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              left: "8%",
              bottom: "20%",
              opacity: 0.12,
              transform: "rotate(-65deg) scale(2)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              right: "15%",
              top: "50%",
              opacity: 0.1,
              transform: "rotate(120deg) scale(3)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              left: "20%",
              top: "10%",
              opacity: 0.08,
              transform: "rotate(20deg) scale(1.5)",
            }}
          />
          <GiWheat
            className="absolute text-amber-400 text-4xl"
            style={{
              right: "25%",
              bottom: "12%",
              opacity: 0.07,
              transform: "rotate(-20deg) scale(1.7)",
            }}
          />
        </div>

        {/* Subtle leaf accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              left: "5%",
              top: "8%",
              opacity: 0.1,
              transform: "rotate(-30deg) scale(2.0)",
            }}
          />
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              left: "15%",
              bottom: "45%",
              opacity: 0.09,
              transform: "rotate(75deg) scale(1.8)",
            }}
          />
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              right: "35%",
              bottom: "5%",
              opacity: 0.08,
              transform: "rotate(-15deg) scale(2.2)",
            }}
          />
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              right: "20%",
              top: "8%",
              opacity: 0.07,
              transform: "rotate(55deg) scale(1.6)",
            }}
          />
          <FaLeaf
            className="absolute text-green-400 text-4xl"
            style={{
              right: "5%",
              bottom: "8%",
              opacity: 0.11,
              transform: "rotate(25deg) scale(2.1)",
            }}
          />
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center mb-8 w-full relative z-10">
        <FadeInSection>
          <div className="inline-flex p-4 bg-gradient-to-r from-amber-100 to-green-100 rounded-full text-amber-800 mb-5 shadow-md">
            <GiFarmTractor className="text-4xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-amber-900 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-green-700">
            FarmGenius AI Chat
          </h1>
          <p className="text-gray-600 max-w-xl md:max-w-2xl mx-auto text-sm md:text-base">
            Get personalized agricultural advice, weather insights, and farming recommendations from our expert AI.
          </p>
        </FadeInSection>
      </div>

      {/* Main Chat Container */}
      <div className="w-full max-w-4xl relative z-10">
        <FadeInSection delay={150}>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-100 transform transition-all duration-300 hover:shadow-xl relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern
                  id="pattern-chat"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1" fill="#fcd34d" />
                </pattern>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#pattern-chat)"
                />
              </svg>
            </div>

            {/* Chat Header */}
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-100 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  {agentOptions.find(a => a.value === selectedAgent)?.icon || <GiFarmTractor className="text-amber-600 text-xl" />}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {agentOptions.find(a => a.value === selectedAgent)?.label || 'Farm Assistant'}
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={selectedAgent}
                    onChange={handleAgentChange}
                    className="pl-3 pr-8 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white text-gray-700 text-sm appearance-none cursor-pointer transition-colors hover:border-amber-400"
                    aria-label="Choose Expert Agent"
                  >
                    {agentOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-amber-600">
                    <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                  aria-label="Share conversation"
                  title="Share conversation"
                >
                  <FaShareAlt className="mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 md:h-[28rem] overflow-y-auto mb-4 px-2 relative z-10 space-y-4">
              {messages.map((msg, idx) => (
                <FadeInSection key={idx} delay={idx * 50}>
                  <div
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } ${msg.role === "system" ? "opacity-70" : ""}`}
                  >
                    {msg.role !== "user" && msg.role !== "system" && (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-2">
                        {AGENT_AVATARS[selectedAgent] || <GiFarmTractor className="text-amber-600" />}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
                        msg.role === "user"
                          ? "bg-green-600 text-white rounded-br-none"
                          : msg.role === "assistant"
                          ? "bg-white border border-amber-100 rounded-bl-none"
                          : msg.role === "system"
                          ? "bg-gray-100 text-gray-600 text-sm italic"
                          : "bg-red-50 border-l-4 border-red-500 text-red-700"
                      }`}
                    >
                      <ReactMarkdown
                        children={msg.content}
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({node, ...props}) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline" />
                          ),
                          code: ({node, ...props}) => (
                            <code {...props} className="bg-amber-50 text-amber-800 rounded px-1 py-0.5 text-sm" />
                          ),
                          pre: ({node, ...props}) => (
                            <pre {...props} className="bg-gray-50 rounded-md p-3 text-sm overflow-x-auto my-2" />
                          ),
                          ul: ({node, ...props}) => (
                            <ul {...props} className="list-disc pl-5 space-y-1 my-2" />
                          ),
                          ol: ({node, ...props}) => (
                            <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />
                          ),
                          li: ({node, ...props}) => (
                            <li {...props} className="ml-2" />
                          ),
                          p: ({node, ...props}) => (
                            <p {...props} className="mb-2 last:mb-0" />
                          ),
                          h1: ({node, ...props}) => (
                            <h1 {...props} className="text-lg font-bold mb-2" />
                          ),
                          h2: ({node, ...props}) => (
                            <h2 {...props} className="text-md font-bold mb-2" />
                          ),
                          h3: ({node, ...props}) => (
                            <h3 {...props} className="text-base font-bold mb-1" />
                          ),
                        }}
                      />
                      {msg.retry && (
                        <button
                          className="mt-3 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md flex items-center transition-colors"
                          onClick={() => window.location.reload()}
                        >
                          <FaRegCheckCircle className="mr-1.5" /> Retry
                        </button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center ml-2 flex-shrink-0 self-end mb-2">
                        <FaMapMarkerAlt className="text-green-600" />
                      </div>
                    )}
                  </div>
                </FadeInSection>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10">
              <form onSubmit={handleSend} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about crops, weather, markets or farming techniques..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 hover:border-amber-300 text-sm"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-3 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" /> Send
                    </>
                  )}
                </button>
              </form>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4 rounded-r-lg shadow-sm flex items-start">
                  <div className="text-red-500 mr-3 text-lg">⚠️</div>
                  <div className="text-sm text-red-700" dangerouslySetInnerHTML={{ __html: error }} />
                </div>
              )}
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Footer with quick buttons */}
      <div className="w-full max-w-4xl mt-6 relative z-10">
        <FadeInSection delay={250}>
          <div className="text-center">
            <h4 className="text-sm font-medium mb-3 text-gray-600">Quick Questions</h4>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => handleQuickQuestion("What crops grow best in this season?")}
                className="px-4 py-2 bg-white hover:bg-green-50 border border-green-200 rounded-full text-xs md:text-sm text-gray-700 transition-colors hover:border-green-300 shadow-sm"
              >
                <FaSeedling className="inline mr-1.5 text-green-600" />
                Best seasonal crops
              </button>
              <button 
                onClick={() => handleQuickQuestion("How to improve soil fertility naturally?")}
                className="px-4 py-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-full text-xs md:text-sm text-gray-700 transition-colors hover:border-amber-300 shadow-sm"
              >
                <MdOutlineScience className="inline mr-1.5 text-amber-600" />
                Soil improvement
              </button>
              <button 
                onClick={() => handleQuickQuestion("What's the current market price for wheat?")}
                className="px-4 py-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-full text-xs md:text-sm text-gray-700 transition-colors hover:border-blue-300 shadow-sm"
              >
                <FaChartLine className="inline mr-1.5 text-blue-600" />
                Crop prices
              </button>
              <button 
                onClick={() => handleQuickQuestion("How will the weather affect my tomato crop?")}
                className="px-4 py-2 bg-white hover:bg-sky-50 border border-sky-200 rounded-full text-xs md:text-sm text-gray-700 transition-colors hover:border-sky-300 shadow-sm"
              >
                <FaCloudSun className="inline mr-1.5 text-sky-600" />
                Weather impact
              </button>
              <button 
                onClick={() => handleQuickQuestion("What's the best way to control pests organically?")}
                className="px-4 py-2 bg-white hover:bg-green-50 border border-green-200 rounded-full text-xs md:text-sm text-gray-700 transition-colors hover:border-green-300 shadow-sm"
              >
                <FaSeedling className="inline mr-1.5 text-green-600" />
                Organic pest control
              </button>
            </div>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}

export default ChatAssistant;