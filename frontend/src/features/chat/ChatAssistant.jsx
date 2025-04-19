import React, { useState, useRef, useEffect } from "react";
import { chatAssistantApi } from '../../services/api';
import { FaPaperPlane, FaSpinner } from "react-icons/fa";
import styles from "./ChatAssistant.module.css";

const ChatAssistant = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am your FarmGenius AI assistant. How can I help you with crops, markets, or farming advice today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("general_assistant");
  const chatEndRef = useRef(null);

  const agentOptions = [
    { value: "general_assistant", label: "General Assistant" },
    { value: "market_expert", label: "Market Expert" },
    { value: "weather_advisor", label: "Weather Advisor" },
    { value: "crop_doctor", label: "Crop Doctor" },
  ];

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
      setMessages([...newMessages, { role: "error", content: err.message }]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["chat-container"]}>
      <div className={styles["chat-card"]}>
        <div className={styles["chat-header"]}>
          <h2 style={{display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1.6rem'}}>
            <span style={{marginRight: 8}}>💬</span> FarmGenius Chat
          </h2>
          <div>
            <label htmlFor="agent-select" style={{color: '#fff', marginRight: 8, fontWeight: 500}}>Expert:</label>
            <select
              id="agent-select"
              className={styles["agent-selector"]}
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              aria-label="Choose Expert Agent"
            >
              {agentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles["chat-messages"]}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                styles["message-row"] + " " +
                (msg.role === "user"
                  ? styles["message-user"]
                  : styles["message-assistant"])
              }
            >
              <div
                className={
                  styles["message-bubble"] + " " +
                  (msg.role === "assistant"
                    ? styles["bubble-assistant"]
                    : msg.role === "user"
                    ? styles["bubble-user"]
                    : styles["bubble-error"])
                }
                aria-live={msg.role === 'assistant' ? 'polite' : undefined}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className={styles["chat-footer"]}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className={styles["input-box"]}
            disabled={loading}
            autoFocus
            aria-label="Type your message"
          />
          <button
            type="submit"
            className={styles["send-btn"]}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <FaSpinner className={styles["loading-spinner"]} aria-label="Loading" />
            ) : (
              <FaPaperPlane style={{marginRight: 4}} />
            )}
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
        {error && (
          <div className={styles["error-message"]}>{error}</div>
        )}
      </div>
    </div>
  );
};

export default ChatAssistant;

