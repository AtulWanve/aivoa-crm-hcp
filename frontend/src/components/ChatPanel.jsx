import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, Bot, User, Loader2, Sparkles, Zap } from 'lucide-react';
import { addUserMessage, addAIMessageChunk, setStreamingStatus, addSystemMessage } from '../store/chatSlice';
import { updateFormState } from '../store/formSlice';

const SUGGESTED_PROMPTS = [
  "Met Dr. Sarah Khan (Cardiologist) today at 2pm, detailed discussion on Metoprolol dosage. She was interested.",
  "Visited Dr. Raj Mehta's clinic, gave 5 samples of Atorvastatin, follow-up scheduled next Tuesday.",
  "Attended a group meeting with Dr. Gupta and Dr. Sharma — covered clinical trial data and adverse event reporting.",
];

const ChatPanel = () => {
  const [input, setInput] = useState('');
  const messages = useSelector((state) => state.chat.messages);
  const isStreaming = useSelector((state) => state.chat.isStreaming);
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    dispatch(addUserMessage(text));
    dispatch(setStreamingStatus(true));

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.filter((m) => m.role !== 'system'),
        }),
      });

      if (!response.ok) throw new Error(`Backend error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;
          const lines = eventStr.split('\n');
          const eventTypeLine = lines.find((l) => l.startsWith('event:'));
          const dataLine = lines.find((l) => l.startsWith('data:'));
          if (!eventTypeLine || !dataLine) continue;

          const eventType = eventTypeLine.replace('event:', '').trim();
          // Use slice(6) NOT .trim() — trim strips leading spaces from ' logged', ' your', etc.
          const data = dataLine.slice(6); // removes exactly 'data: ' prefix (6 chars)


          if (eventType === 'text_chunk') {
            dispatch(addAIMessageChunk(data));
          } else if (eventType === 'state_patch') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.form_data) dispatch(updateFormState(parsed.form_data));
            } catch (_) {}
          } else if (eventType === 'error') {
            dispatch(addSystemMessage(`Error: ${data}`));
          }
        }
      }
    } catch (err) {
      console.error(err);
      dispatch(addSystemMessage('⚠ Could not reach backend. Make sure FastAPI is running on port 8000.'));
    } finally {
      dispatch(setStreamingStatus(false));
    }
  };

  const handleSuggest = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0e14] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-60 h-60 bg-purple-700/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl ai-gradient flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0c0e14] pulse-dot" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">AI HCP Assistant</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <Zap size={10} />
            Powered by Groq · gemma2-9b-it
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-5">
        {messages.map((msg, i) => {
          if (msg.role === 'system') {
            return (
              <div key={i} className="flex justify-center slide-in">
                <div className="bg-rose-500/15 border border-rose-500/25 text-rose-300 text-xs px-4 py-2 rounded-full">
                  {msg.content}
                </div>
              </div>
            );
          }
          const isUser = msg.role === 'user';
          return (
            <div key={i} className={`flex items-end gap-2.5 slide-in ${isUser ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${
                isUser ? 'user-gradient shadow-sky-500/20' : 'ai-gradient shadow-indigo-500/20'
              }`}>
                {isUser
                  ? <User size={14} className="text-white" />
                  : <Bot size={14} className="text-white" />
                }
              </div>
              {/* Bubble */}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                isUser
                  ? 'rounded-br-sm bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/25 text-sky-100'
                  : 'rounded-bl-sm bg-white/[0.05] border border-white/[0.08] text-slate-200'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isStreaming && (
          <div className="flex items-end gap-2.5 slide-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg ai-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.08] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot" />
            </div>
          </div>
        )}

        {/* Suggested prompts — only visible when no user messages yet */}
        {messages.filter((m) => m.role === 'user').length === 0 && !isStreaming && (
          <div className="pt-2 space-y-2">
            <p className="text-xs text-slate-600 font-medium uppercase tracking-wider px-1">Try an example →</p>
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSuggest(p)}
                className="w-full text-left text-xs text-slate-400 hover:text-indigo-300 bg-white/[0.03] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/25 rounded-xl px-3 py-2.5 transition-all duration-200 slide-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06] bg-[#0c0e14]/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe the HCP interaction… (Enter to send)"
              disabled={isStreaming}
              className="w-full px-4 py-3 pr-3 rounded-xl text-sm resize-none bg-white/[0.05] border border-white/[0.08] focus:border-indigo-500/50 focus:bg-indigo-500/5 text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 scrollbar-thin min-h-[46px] max-h-[120px]"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-11 h-11 rounded-xl ai-gradient hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all duration-200 active:scale-95"
          >
            {isStreaming
              ? <Loader2 size={16} className="text-white animate-spin" />
              : <Send size={15} className="text-white ml-0.5" />
            }
          </button>
        </form>
        <p className="text-center text-xs text-slate-700 mt-2">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
};

export default ChatPanel;
