import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Menu, X, Sun, Moon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import "./App.css"

const generateId = () => Math.random().toString(36).substring(2, 9);
console.log(window.location.origin);
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage = {
      id: generateId(),
      text: input,
      sender: 'user',
    };
    
    // Add user's message immediately for a better user experience
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Clear the input field
    setInput('');
    setIsLoading(true);

    // --- Start of API Call Integration ---
    try {
      // Make an API call to your FastAPI backend
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the user's message text in the request body
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      // Create and add the bot's response to the chat
      const botResponse = {
        id: generateId(),
        text: data.answer || data.summary || data.response,
        sender: 'bot',
      };
      
      setMessages((prevMessages) => [...prevMessages, botResponse]);

    } catch (error) {
      console.error("Failed to fetch bot response:", error);
      // Optional: Add a message to the user if the API call fails
      const errorMessage = {
        id: generateId(),
        text: "Sorry, I couldn't get a response. Please try again later.",
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    // --- End of API Call Integration ---
  };

  const Message = ({ text, sender }) => (
    <div className={`message-bubble message-${sender}`}>
      <span className="message-icon">
        {sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
      </span>
      <div className="message-text">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );

  return (
    <>
      <div className={`chat-app-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button className="sidebar-close-button" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
              <X size={24} />
            </button>
          </div>
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <span className="sidebar-item-text">Chats</span>
            </li>
            <li className="sidebar-item">
              <span className="sidebar-item-text">Settings</span>
            </li>
          </ul>
        </div>
        <div className={`menu-overlay ${isMenuOpen ? 'visible' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className="chat-app-card">
          <div className="chat-header">
              <button className="menu-button" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
                  <Menu size={24} />
              </button>
            <h1 className="chat-title">AIES CHATBOT</h1>
            <div className="online-indicator"></div>
          </div>
          <button className="dark-mode-button" onClick={() => setIsDarkMode(!isDarkMode)} aria-label="Toggle dark mode">
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <div className="chat-messages-container">
            {messages.length === 0 ? (
              <div className="empty-chat-message">
                <Bot size={48} className="empty-chat-icon" />
                <p className="empty-chat-text">Hello! I am the AIES Chatbot!</p>
                <p className="empty-chat-subtext">Type a message below to begin.</p>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((msg) => (
                  <Message key={msg.id} text={msg.text} sender={msg.sender} />
                ))}
                {isLoading && (
                  <div className="message-bubble message-bot loading-bubble">
                    <span className="message-icon">
                      <Bot size={20} />
                    </span>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            {messages.length === 0 && isLoading && (
              <div className="chat-messages">
                <div className="message-bubble message-bot loading-bubble">
                  <span className="message-icon">
                    <Bot size={20} />
                  </span>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="chat-input"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="send-button"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="send-icon"
              >
                <path d="m22 2-7 19-3-8-8-3 19-7Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}