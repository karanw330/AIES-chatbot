import { useEffect, useRef, useState } from 'react';
import {
  Bookmark, Check, ChevronRight, Copy, Menu, MessageSquare,
  Moon, Plus, Search, Settings2, Sun, Trash2, X, ArrowUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const CHAT_KEY = 'aies-conversations-v1';
const ACTIVE_KEY = 'aies-active-chat-v1';
const THEME_KEY = 'aies-theme-v1';

function createId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function initialChats() {
  try {
    const data = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    return Array.isArray(data)
      ? data.filter((chat) => chat && typeof chat.id === 'string' && Array.isArray(chat.messages))
      : [];
  } catch {
    return [];
  }
}

function initialActiveId() {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

function initialTheme() {
  try { return localStorage.getItem(THEME_KEY) === 'dark'; } catch { return false; }
}

function shortDate(iso) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ChatMessage({ message, copied, onCopy }) {
  const isUser = message.sender === 'user';
  return (
    <article className={'chat-message ' + (isUser ? 'user-message' : 'assistant-message')}>
      {!isUser && <div className="assistant-name">AIES</div>}
      <div className="message-body"><ReactMarkdown>{message.text || ''}</ReactMarkdown></div>
      {!isUser && (
        <button type="button" className="copy-button" onClick={() => onCopy(message)} aria-label="Copy response">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </article>
  );
}

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(initialActiveId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sideTab, setSideTab] = useState('chats');
  const [search, setSearch] = useState('');
  const [dark, setDark] = useState(initialTheme);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeId) || null;
  const recentChats = [...chats]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .filter((chat) => (chat.title || '').toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); } catch { /* local storage unavailable */ }
  }, [chats]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* local storage unavailable */ }
  }, [activeId]);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* local storage unavailable */ }
  }, [dark]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeId, activeChat?.messages.length, loading]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  function newChat() {
    setActiveId(null);
    setDraft('');
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  function openChat(id) {
    setActiveId(id);
    setDraft('');
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  function deleteChat(id) {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (id === activeId) setActiveId(null);
  }

  function toggleSaved(id) {
    setChats((prev) => prev.map((chat) =>
      chat.id === id ? { ...chat, saved: !chat.saved } : chat
    ));
  }

  async function copyResponse(message) {
    try {
      await navigator.clipboard.writeText(message.text || '');
      setCopiedId(message.id);
    } catch {
      setCopiedId(null);
    }
  }

  async function sendMessage(text) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    const chatId = activeChat?.id || createId();
    const userMessage = { id: createId(), sender: 'user', text: prompt };
    const timestamp = new Date().toISOString();

    setChats((prev) => {
      if (prev.some((chat) => chat.id === chatId)) {
        return prev.map((chat) => chat.id === chatId
          ? { ...chat, messages: [...chat.messages, userMessage], updatedAt: timestamp }
          : chat);
      }
      return [...prev, {
        id: chatId,
        title: prompt.length > 48 ? prompt.slice(0, 48) + '…' : prompt,
        messages: [userMessage],
        saved: false,
        updatedAt: timestamp
      }];
    });
    setActiveId(chatId);
    setDraft('');
    setLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const answer = data.answer || data.summary || data.response;
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty assistant response');
      setChats((prev) => prev.map((chat) => chat.id === chatId
        ? { ...chat, messages: [...chat.messages, { id: createId(), sender: 'bot', text: answer }], updatedAt: new Date().toISOString() }
        : chat));
    } catch (error) {
      console.error('AIES API error:', error);
      setChats((prev) => prev.map((chat) => chat.id === chatId
        ? { ...chat, messages: [...chat.messages, {
            id: createId(), sender: 'bot',
            text: 'Sorry, I could not get a response. Make sure the backend is running and try again.'
          }] }
        : chat));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function onComposerKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  return (
    <div className={'chat-app ' + (dark ? 'dark-mode' : '')}>
      {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
      <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')} aria-label="Navigation" aria-hidden={!sidebarOpen}>
        <div className="sidebar-header">
          <span className="sidebar-brand">AIES<span className="brand-dot">.</span></span>
          <button className="icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={20} /></button>
        </div>

        <button className="new-chat-button" onClick={newChat}><Plus size={18} /> New chat</button>
        <div className="sidebar-tabs">
          <button className={'sidebar-tab ' + (sideTab === 'chats' ? 'active' : '')} onClick={() => setSideTab('chats')}><MessageSquare size={17} /> Chats</button>
          <button className={'sidebar-tab ' + (sideTab === 'settings' ? 'active' : '')} onClick={() => setSideTab('settings')}><Settings2 size={17} /> Settings</button>
        </div>

        {sideTab === 'chats' ? (
          <div className="sidebar-content">
            <label className="history-search"><Search size={16} /><input placeholder="Search chats..." aria-label="Search chats" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <div className="history-header">RECENT CONVERSATIONS <span>{chats.length}</span></div>
            <div className="history-list">
              {recentChats.length ? recentChats.map((chat) => (
                <div key={chat.id} className={'history-row ' + (activeId === chat.id ? 'is-current' : '')}>
                  <button className="history-select" onClick={() => openChat(chat.id)} title={chat.title}>
                    <MessageSquare size={16} />
                    <span className="history-details"><strong>{chat.title}</strong><small>{shortDate(chat.updatedAt)}</small></span>
                    <ChevronRight className="history-chevron" size={15} />
                  </button>
                  <div className="history-actions">
                    <button className={'mini-button ' + (chat.saved ? 'is-saved' : '')} onClick={() => toggleSaved(chat.id)} aria-label={chat.saved ? 'Unsave chat' : 'Save chat'} title={chat.saved ? 'Unsave chat' : 'Save chat'}><Bookmark size={14} fill={chat.saved ? 'currentColor' : 'none'} /></button>
                    <button className="mini-button" onClick={() => deleteChat(chat.id)} aria-label="Delete chat" title="Delete chat"><Trash2 size={14} /></button>
                  </div>
                </div>
              )) : <p className="sidebar-empty">{search ? 'No matching chats.' : 'No conversations yet. Start a new chat!'}</p>}
            </div>
          </div>
        ) : (
          <div className="sidebar-content">
            <div className="history-header">PREFERENCES</div>
            <div className="setting-row">
              <div><strong>Appearance</strong><span>Choose your preferred theme</span></div>
              <button className="setting-switch" onClick={() => setDark((prev) => !prev)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
                {dark ? 'Light' : 'Dark'}
              </button>
            </div>
            <div className="settings-note">Conversations are saved locally in this browser.</div>
          </div>
        )}
        <div className="sidebar-footer"><span className="sidebar-footer-mark" /> AIES Chatbot <span className="sidebar-footer-version">v1.0</span></div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <button className="icon-button menu-button" onClick={() => { setSideTab('chats'); setSidebarOpen(true); }} aria-label="Open menu"><Menu size={23} /></button>
            <div className="header-separator" />
            <div className="header-heading"><strong>AIES Chatbot</strong><span>AI assistant</span></div>
          </div>
          <button className="header-new-chat" onClick={newChat} aria-label="Start a new chat"><Plus size={17} /><span>New chat</span></button>
        </header>

        <div className="messages-scroller">
          <div className={'messages-inner ' + (!activeChat?.messages.length ? 'is-empty' : '')}>
            {activeChat?.messages.length ? (
              <>
                <div className="thread-title">{activeChat.title}</div>
                {activeChat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} onCopy={copyResponse} copied={message.id === copiedId} />
                ))}
                {loading && (
                  <div className="chat-message assistant-message">
                    <div className="assistant-name">AIES</div>
                    <div className="typing-dots" aria-label="Assistant is typing"><span /><span /><span /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            ) : (
              <div className="welcome-screen">
                <div className="welcome-eyebrow">AIES CHATBOT</div>
                <h1>How can I help you today?</h1>
                <p>Ask a question, explore an idea, or get help understanding something new.</p>
              </div>
            )}
          </div>
        </div>

        <div className="composer-wrap">
          <div className="composer-inner">
            <form className="message-form" onSubmit={onSubmit}>
              <textarea ref={inputRef} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onComposerKeyDown} placeholder="Message AIES..." aria-label="Type your message" />
              <div className="form-footer">
                <span className="composer-hint">Enter to send · Shift + Enter for a new line</span>
                <button className="send-button" type="submit" disabled={loading || !draft.trim()} aria-label="Send message"><ArrowUp size={19} /></button>
              </div>
            </form>
            <p className="disclaimer">AIES can make mistakes. Check important information.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
