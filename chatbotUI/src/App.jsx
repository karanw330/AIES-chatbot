import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUp, Bookmark, BookOpen, Check, Clock3, Code2,
  FileText, Home, Menu, MessageCircle, Moon, Plus, Search, Sparkles,
  Sun, Trash2, X, Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const STORAGE_CHATS = 'aies-conversations-v1';
const STORAGE_ACTIVE = 'aies-active-chat-v1';
const STORAGE_THEME = 'aies-theme-v1';

const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2);

function loadChats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_CHATS) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && Array.isArray(item.messages)) : [];
  } catch {
    return [];
  }
}

const suggestions = [
  { label: 'Explain a concept', detail: 'Break down a difficult topic', icon: BookOpen, tone: 'lavender', prompt: 'Explain a difficult computer science concept in simple terms with an example.' },
  { label: 'Research help', detail: 'Explore a topic in depth', icon: Sparkles, tone: 'pink', prompt: 'Help me research a topic. What questions should I ask and how should I structure my research?' },
  { label: 'Summarize content', detail: 'Get the important takeaways', icon: FileText, tone: 'peach', prompt: 'Help me create a concise, structured summary of a technical topic.' },
  { label: 'Coding assistance', detail: 'Understand code and logic', icon: Code2, tone: 'blue', prompt: 'Help me understand an algorithm with a clear explanation and pseudocode.' },
];

const starterPrompts = [
  'Explain cloud computing',
  'How does a virtual machine work?',
  'Help me prepare for a viva',
];

function Orb({ size = 'medium' }) {
  return (
    <div className={'assistant-orb orb-' + size} aria-hidden="true">
      <span className="orb-eye orb-eye-left" />
      <span className="orb-eye orb-eye-right" />
    </div>
  );
}

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Message({ message, onCopy, copied }) {
  const isUser = message.sender === 'user';
  return (
    <div className={'chat-message ' + (isUser ? 'from-user' : 'from-assistant')}>
      {!isUser && <div className="message-avatar"><Orb size="tiny" /></div>}
      <div className="message-content">
        {!isUser && <div className="message-sender">AIES Assistant <span>• AI</span></div>}
        <div className="message-body"><ReactMarkdown>{message.text || ''}</ReactMarkdown></div>
        {!isUser && (
          <button type="button" className="copy-response" onClick={() => onCopy(message)} aria-label="Copy assistant response">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy response'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [chats, setChats] = useState(loadChats);
  const [activeId, setActiveId] = useState(() => {
    try { return localStorage.getItem(STORAGE_ACTIVE) || null; } catch { return null; }
  });
  const [section, setSection] = useState('home');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(STORAGE_THEME) === 'dark'; } catch { return false; }
  });
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeId) || null;
  const sortedChats = [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const filteredChats = sortedChats.filter((chat) =>
    (section !== 'saved' || chat.saved) &&
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    try { localStorage.setItem(STORAGE_CHATS, JSON.stringify(chats)); } catch { /* storage unavailable */ }
  }, [chats]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(STORAGE_ACTIVE, activeId);
      else localStorage.removeItem(STORAGE_ACTIVE);
    } catch { /* storage unavailable */ }
  }, [activeId]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_THEME, dark ? 'dark' : 'light'); } catch { /* storage unavailable */ }
  }, [dark]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeChat?.messages.length, loading, activeId]);

  function startNewChat() {
    setActiveId(null);
    setInput('');
    setMenuOpen(false);
    setSection('home');
    inputRef.current?.focus();
  }

  function selectChat(id) {
    setActiveId(id);
    setMenuOpen(false);
    setInput('');
  }

  function toggleSaved(id) {
    setChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, saved: !chat.saved } : chat));
  }

  function deleteChat(id) {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
    } catch {
      setCopiedId(null);
    }
  }

  async function sendMessage(value) {
    const prompt = value.trim();
    if (!prompt || loading) return;
    const id = activeChat?.id || makeId();
    const now = new Date().toISOString();
    const userMessage = { id: makeId(), text: prompt, sender: 'user' };

    setChats((prev) => {
      const existing = prev.find((chat) => chat.id === id);
      if (existing) return prev.map((chat) => chat.id === id
        ? { ...chat, messages: [...chat.messages, userMessage], updatedAt: now }
        : chat);
      return [...prev, {
        id, title: prompt.length > 48 ? prompt.slice(0, 48) + '…' : prompt,
        messages: [userMessage], updatedAt: now, saved: false
      }];
    });
    setActiveId(id);
    setInput('');
    setLoading(true);

    try {
      // Keep the existing FastAPI request and response contract unchanged.
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error('Request failed with status ' + response.status);
      const data = await response.json();
      const answer = data.answer || data.summary || data.response;
      if (typeof answer !== 'string' || !answer.trim()) {
        throw new Error('The server returned an empty response.');
      }
      setChats((prev) => prev.map((chat) => chat.id === id
        ? { ...chat, messages: [...chat.messages, { id: makeId(), sender: 'bot', text: answer }], updatedAt: new Date().toISOString() }
        : chat));
    } catch (error) {
      console.error('AIES response failed:', error);
      setChats((prev) => prev.map((chat) => chat.id === id
        ? { ...chat, messages: [...chat.messages, {
            id: makeId(), sender: 'bot',
            text: "I couldn't reach the assistant. Please check that the backend is running and try again."
          }] }
        : chat));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleComposerKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  const sidebarConversations = sortedChats.filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

  return (
    <div className={'app-shell ' + (dark ? 'dark-mode' : '')}>
      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <aside className={'sidebar ' + (menuOpen ? 'sidebar-open' : '')}>
        <div className="brand">
          <Orb size="small" />
          <div className="brand-name">aies<span>.</span><small>YOUR AI WORKSPACE</small></div>
          <button className="sidebar-mobile-close icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>

        <button className="new-chat-button" onClick={startNewChat}><Plus size={18} /> New conversation <ArrowRight size={17} /></button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={'nav-item ' + (section === 'home' ? 'selected' : '')} onClick={() => { setSection('home'); setMenuOpen(false); }}><Home size={18} /> Overview</button>
          <button className={'nav-item ' + (section === 'chats' ? 'selected' : '')} onClick={() => { setSection('chats'); setMenuOpen(false); }}><MessageCircle size={18} /> Conversations <span className="nav-count">{chats.length}</span></button>
          <button className={'nav-item ' + (section === 'saved' ? 'selected' : '')} onClick={() => { setSection('saved'); setMenuOpen(false); }}><Bookmark size={18} /> Saved</button>
        </nav>

        <div className="history-title"><span>RECENT CHATS</span><Clock3 size={15} /></div>
        <div className="sidebar-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" /></div>
        <div className="sidebar-history">
          {sidebarConversations.length ? sidebarConversations.map((chat) => (
            <button key={chat.id} onClick={() => selectChat(chat.id)} className={'history-item ' + (activeId === chat.id ? 'active' : '')} title={chat.title}>
              <MessageCircle size={15} /><span>{chat.title}</span>
            </button>
          )) : <p className="history-empty">Your conversations will appear here.</p>}
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDark((prev) => !prev)} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? 'Light appearance' : 'Dark appearance'}
          </button>
          <div className="profile-card"><div className="profile-avatar">A</div><div><strong>My workspace</strong><span>Personal AI assistant</span></div><span className="profile-online" aria-label="Workspace ready" /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={22} /></button><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{section === 'home' ? 'Overview' : section === 'saved' ? 'Saved chats' : 'Conversations'}</strong></div>
          <div className="topbar-right"><span className="topbar-chip"><span className="live-dot" /> AI-powered workspace</span><div className="topbar-avatar">A</div></div>
        </header>

        <div className="workspace">
          <section className="dashboard-panel" aria-label={section === 'home' ? 'Overview' : 'Conversation library'}>
            {section === 'home' ? (
              <>
                <div className="dashboard-intro"><div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL AI ASSISTANT</div><h1>Good to see you <span>again.</span></h1><p>Ideas, questions, and everything in between. What would you like to explore today?</p></div>

                <div className="hero-card">
                  <div className="hero-glow" />
                  <div className="hero-orb-wrap"><Orb size="large" /><span className="hello-bubble">Hello! <span>✳</span></span></div>
                  <div className="hero-copy"><span className="hero-kicker"><Sparkles size={13} /> HERE TO HELP</span><h2>Your smart companion for <em>every idea.</em></h2><p>Ask a question, untangle a concept, or start something new.</p><button onClick={() => inputRef.current?.focus()} className="hero-cta">Start exploring <ArrowRight size={16} /></button></div>
                </div>

                <div className="section-heading"><div><h2>What can I help you with?</h2><p>Pick a starting point or ask anything.</p></div><span className="section-subtitle">EXPLORE</span></div>
                <div className="suggestion-grid">
                  {suggestions.map(({ label, detail, icon: Icon, tone, prompt }) => (
                    <button className="suggestion-card" key={label} onClick={() => void sendMessage(prompt)} disabled={loading}>
                      <span className={'suggestion-icon ' + tone}><Icon size={21} /></span>
                      <span className="suggestion-title">{label}</span>
                      <span className="suggestion-detail">{detail}</span>
                      <ArrowRight className="suggestion-arrow" size={17} />
                    </button>
                  ))}
                </div>
                <div className="section-heading recent-heading"><div><h2>Recent activity</h2><p>Pick up where you left off.</p></div><button className="text-action" onClick={() => setSection('chats')}>View all <ArrowRight size={14} /></button></div>
                <div className="recent-list">
                  {sortedChats.length ? sortedChats.slice(0, 3).map((chat) => (
                    <button className="recent-row" key={chat.id} onClick={() => selectChat(chat.id)}><span className="recent-icon"><MessageCircle size={18} /></span><span className="recent-copy"><strong>{chat.title}</strong><small>{chat.messages.length} messages · {formatWhen(chat.updatedAt)}</small></span><ArrowRight size={17} /></button>
                  )) : <div className="recent-placeholder"><Clock3 size={18} /><span>No conversations yet. Your first chat will show up here.</span></div>}
                </div>
              </>
            ) : (
              <div className="library-view">
                <div className="eyebrow"><Sparkles size={14} /> YOUR WORKSPACE</div>
                <h1>{section === 'saved' ? 'Saved conversations' : 'Your conversations'}<span>.</span></h1>
                <p className="library-description">{section === 'saved' ? 'The conversations you bookmarked for later.' : 'Revisit ideas, continue research, and pick up where you left off.'}</p>
                <label className="library-search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your conversations..." /></label>
                <div className="library-list">
                  {filteredChats.length ? filteredChats.map((chat) => (
                    <div className={'library-item ' + (activeId === chat.id ? 'library-current' : '')} key={chat.id}>
                      <button className="library-main" onClick={() => selectChat(chat.id)}><span className="library-icon"><MessageCircle size={20} /></span><span><strong>{chat.title}</strong><small>{chat.messages.length} messages · {formatWhen(chat.updatedAt)}</small></span></button>
                      <div className="library-actions"><button onClick={() => toggleSaved(chat.id)} title={chat.saved ? 'Remove from saved' : 'Save conversation'} aria-label={chat.saved ? 'Remove from saved' : 'Save conversation'}><Bookmark size={17} fill={chat.saved ? 'currentColor' : 'none'} /></button><button onClick={() => deleteChat(chat.id)} title="Delete conversation" aria-label="Delete conversation"><Trash2 size={17} /></button></div>
                    </div>
                  )) : <div className="library-empty"><Bookmark size={24} /><strong>Nothing here yet</strong><span>{section === 'saved' ? 'Bookmark a conversation to see it here.' : 'Start a conversation to build your history.'}</span></div>}
                </div>
              </div>
            )}
          </section>

          <section className="chat-panel" aria-label="Chat with AIES Assistant">
            <div className="chat-panel-header">
              <div className="chat-heading"><div className="chat-heading-avatar"><Orb size="small" /></div><div><strong>AIES Assistant</strong><span><span className="online-dot" /> Ready to help</span></div></div>
              <div className="chat-heading-actions">
                {activeChat && <button className={'icon-button ' + (activeChat.saved ? 'bookmarked' : '')} onClick={() => toggleSaved(activeChat.id)} title={activeChat.saved ? 'Remove bookmark' : 'Bookmark conversation'} aria-label="Bookmark conversation"><Bookmark size={18} fill={activeChat.saved ? 'currentColor' : 'none'} /></button>}
                <button className="icon-button" onClick={startNewChat} title="New conversation" aria-label="New conversation"><Plus size={20} /></button>
              </div>
            </div>
            <div className="chat-scroller">
              {activeChat?.messages.length ? (
                <div className="chat-thread">
                  <div className="thread-date">YOUR CONVERSATION</div>
                  {activeChat.messages.map((message) => <Message key={message.id} message={message} onCopy={copyMessage} copied={copiedId === message.id} />)}
                  {loading && <div className="chat-message from-assistant"><div className="message-avatar"><Orb size="tiny" /></div><div className="message-content"><div className="message-sender">AIES Assistant</div><div className="typing-indicator"><i /><i /><i /></div></div></div>}
                  <div ref={endRef} />
                </div>
              ) : (
                <div className="chat-empty">
                  <div className="chat-empty-orb"><Orb size="medium" /></div>
                  <div className="ready-pill"><span className="online-dot" /> YOUR ASSISTANT IS READY</div>
                  <h2>Ask me <span>anything.</span></h2>
                  <p>From quick questions to deep dives, I'm here to help you think, learn, and create.</p>
                  <div className="starter-heading">TRY ASKING</div>
                  <div className="starter-list">{starterPrompts.map((prompt) => <button disabled={loading} key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}<ArrowRight size={15} /></button>)}</div>
                </div>
              )}
            </div>
            <div className="composer-area">
              <form className="chat-input-form" onSubmit={handleSubmit}>
                <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask AIES anything..." aria-label="Message AIES" rows={2} />
                <div className="composer-bottom"><span><Sparkles size={14} /> AI-powered answers</span><button className="send-button" type="submit" disabled={!input.trim() || loading} aria-label="Send message"><ArrowUp size={20} /></button></div>
              </form>
              <p className="composer-footnote">AIES can make mistakes. Verify important information.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
