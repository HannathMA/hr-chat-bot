import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function TypingIndicator() {
  return (
    <div className="chat-bubble bot typing-bubble">
      <span className="dot" /><span className="dot" /><span className="dot" />
    </div>
  );
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`chat-row ${isBot ? 'bot-row' : 'user-row'}`}>
      {isBot && (
        <div className="avatar bot-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <path d="M9 14v2M15 14v2M12 21v-4"/>
          </svg>
        </div>
      )}
      <div className={`chat-bubble ${isBot ? 'bot' : 'user'}`}>
        {isBot
          ? msg.text.split('\n').map((line, i) => (
              line ? <p key={i} style={{ margin: '2px 0' }}>{line}</p> : <br key={i} />
            ))
          : msg.text
        }
        <span className="msg-time">{msg.time}</span>
      </div>
      {!isBot && <div className="avatar user-avatar">HR</div>}
    </div>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: "Hello! I'm your HR assistant. Ask me anything about employees, projects, attendance, or skills.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: data.response || data.answer || data.message || 'No response from server.',
        time: now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: `⚠️ Could not reach the server. (${err.message})`,
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'What projects has Anu worked on?',
    'Show attendance summary for today',
    'List employees with Python skills',
    'Who are the active project leads?',
  ];

  return (
    <div className="chatbot-container card">
      {/* Header */}
      <div className="chatbot-header">
        <div className="bot-status-dot" />
        <div>
          <h3 className="chatbot-title">HR Assistant</h3>
          <p className="chatbot-subtitle">Powered by Gemini · LangGraph</p>
        </div>
        <div className="chatbot-actions">
          <button className="btn btn-ghost icon-btn" title="Clear chat"
            onClick={() => setMessages([{
              id: Date.now(), role: 'bot',
              text: "Chat cleared. How can I help you?",
              time: now(),
            }])}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="suggestions">
          {suggestions.map(s => (
            <button key={s} className="suggestion-chip"
              onClick={() => { setInput(s); inputRef.current?.focus(); }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chatbot-input-row">
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          placeholder="Ask anything about HR data…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="btn btn-primary send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
          {loading
            ? <span className="spinner" />
            : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )
          }
        </button>
      </div>
    </div>
  );
}
