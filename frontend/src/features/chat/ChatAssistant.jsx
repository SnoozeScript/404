import React, { useState, useRef, useEffect } from "react";
import { chatAssistantApi } from '../../services/api';
import { FaPaperPlane, FaSpinner } from "react-icons/fa";

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
  const chatEndRef = useRef(null);

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
        history: newMessages.filter(m => m.role !== 'error').map(m => ({ role: m.role, content: m.content }))
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-16 px-2">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-blue-100 flex flex-col h-[70vh]">
        <div className="flex-shrink-0 px-6 py-4 bg-blue-800 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-2">💬</span> FarmGenius Chat
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-blue-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-lg shadow-sm whitespace-pre-line text-base ${
                  msg.role === "assistant"
                    ? "bg-white text-blue-900 border border-blue-200"
                    : msg.role === "user"
                    ? "bg-blue-600 text-white border border-blue-600"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex items-center border-t border-blue-100 p-4 bg-white rounded-b-xl">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mr-3"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </form>
        {error && (
          <div className="text-red-600 bg-red-50 p-2 text-center border-t border-red-100">{error}</div>
        )}
      </div>
    </div>
  );
};

export default ChatAssistant;
