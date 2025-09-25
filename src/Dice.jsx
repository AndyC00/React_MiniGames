import React, { useState, useRef, useEffect } from 'react';

export default function DiceRolling() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const [histories, setHistories] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString());
  const cloneMsgs = (arr) => arr.map(m => ({ ...m }));
  const msgsEqual = (a, b) =>
    a.length === b.length &&
    a.every((m, i) => m.id === b[i].id && m.type === b[i].type && m.content === b[i].content);

  useEffect(() => {
    setHistories(prev => {
      let changed = false;
      const next = { ...prev };

      for (const [mid, h] of Object.entries(prev)) {
        const idx = messages.findIndex(m => m.id === mid);
        if (idx !== -1) {
          const newSuffix = cloneMsgs(messages.slice(idx + 1));
          const curVer = h.versions[h.currentIndex];

          if (!msgsEqual(curVer.suffix, newSuffix)) {
            const newVersions = h.versions.slice();
            newVersions[h.currentIndex] = { ...curVer, suffix: newSuffix };
            next[mid] = { ...h, versions: newVersions };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    const newUserMessage = {
      type: 'human',
      content: userMessage,
      id: Date.now().toString(),
    };

    const snapshot = [...messages, newUserMessage];
    setMessages(snapshot);
    await generateResponse(snapshot);
  };

  // response generation
  const generateResponse = async (_messageHistory) => {
    setLoading(true);
    setError(null);
    try {
      setMessages(prev => [...prev, { type: 'robot', content: 'ok', id: uuid() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startEdit = (message) => {
    setEditingId(message.id);
    setEditText(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (messageId) => {
    if (!editText.trim()) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const original = messages[messageIndex];
    if (original.type !== 'human') return;

    const prefix = cloneMsgs(messages.slice(0, messageIndex));
    const originalSuffix = cloneMsgs(messages.slice(messageIndex + 1));
    const newContent = editText.trim();

    setHistories(prev => {
      const next = { ...prev };
      if (!next[messageId]) {
        next[messageId] = {
          messageId,
          versions: [{
            id: uuid(),
            content: original.content,
            suffix: originalSuffix,
            createdAt: Date.now(),
          }],
          currentIndex: 0,
        };
      }
      return next;
    });

    setHistories(prev => {
      const h = prev[messageId];
      const newVersion = {
        id: uuid(),
        content: newContent,
        suffix: [],
        createdAt: Date.now(),
      };
      return {
        ...prev,
        [messageId]: {
          messageId,
          versions: [...h.versions, newVersion],
          currentIndex: h.versions.length,
        }
      };
    });

    const editedHuman = { ...original, content: newContent };
    const newMsgs = [...prefix, editedHuman];
    setMessages(newMsgs);
    setEditingId(null);
    setEditText('');

    await generateResponse(newMsgs);
  };

  const navigateVersion = (messageId, dir) => {
    setHistories(prev => {
      const h = prev[messageId];
      if (!h) return prev;

      const nextIndex = Math.max(0, Math.min(h.versions.length - 1, h.currentIndex + dir));
      if (nextIndex === h.currentIndex) return prev;

      const selected = h.versions[nextIndex];

      setMessages(curr => {
        const idx = curr.findIndex(m => m.id === messageId);
        if (idx === -1) return curr;
        const prefix = cloneMsgs(curr.slice(0, idx));
        const human = { ...curr[idx], content: selected.content };
        const suffix = cloneMsgs(selected.suffix);
        return [...prefix, human, ...suffix];
      });

      return {
        ...prev,
        [messageId]: { ...h, currentIndex: nextIndex }
      };
    });
  };

  const renderMessage = (message) => {
    const isEditing = editingId === message.id;
    const history = histories[message.id];
    const hasHistory = !!history && history.versions.length >= 1;
    const canPrev = hasHistory && history.currentIndex > 0;
    const canNext = hasHistory && history.currentIndex < history.versions.length - 1;

    return (
      <div key={message.id} className={`message ${message.type}`}>
        {isEditing ? (
          <div className="edit-container">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-textarea"
              autoFocus
            />
            <div className="edit-buttons">
              <button onClick={() => saveEdit(message.id)} disabled={loading || !editText.trim()} className="save-button">
                Save
              </button>
              <button onClick={cancelEdit} disabled={loading} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="message-wrapper">
            <div className="message-content">{message.content}</div>

            {message.type === 'human' && (
              <button onClick={() => startEdit(message)} className="edit-button" disabled={loading}>
                Edit
              </button>
            )}
            {hasHistory && (
              <div className="navigation-buttons">
                <button
                  onClick={() => navigateVersion(message.id, -1)}
                  className="nav-button"
                  disabled={loading || !canPrev}
                  aria-label="Previous version"
                  title="Previous edited version"
                >
                  &lt;
                </button>
                <span className="nav-indicator">
                  {history.currentIndex + 1}/{history.versions.length}
                </span>
                <button
                  onClick={() => navigateVersion(message.id, 1)}
                  className="nav-button"
                  disabled={loading || !canNext}
                  aria-label="Next version"
                  title="Next edited version"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>

      <div className="dice_instruction">
        <p>
          Please type "number of dices + 'd' + number of sides on the dice" to roll the dice
        </p>
        <p>
          This app is aim to log and track your dice numbers and what happens when playing table games
        </p>
        <p>
          Feel free to type some notes, it will keep your notes until you reload this web page
        </p>
        <p>
          Example of use:
        </p>
        <p>
          "I got damaged from a ghoul, received damage 1 d 6"
        </p>
        <p>
          "I obsered a murder, my sanity got hurt 1 d 4"
        </p>
      </div>

      <div className="app">
        <div className="chat-container">
          <div className="messages">
            {messages.map(renderMessage)}
            {loading && (
              <div className="message assistant">
                <div className="loading">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            {error && <div className="error-message">Error: {error}</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="input-box"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
