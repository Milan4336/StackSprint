import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Link2, Maximize2, Minimize2, Send, ShieldAlert, Sparkles, TrendingUp, X } from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { CopilotSource } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: CopilotSource[];
    suggestions?: string[];
    mode?: 'gemini' | 'fallback';
  };
}

export const FraudCopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: "SOC AI Agent online. Ask for triage, explainability, or case guidance and I'll cite evidence.",
      timestamp: new Date()
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (seededMessage?: string) => {
    const content = (seededMessage ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = await monitoringApi.copilotChat(content);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: payload.response,
        timestamp: new Date(),
        metadata: {
          sources: payload.sources,
          suggestions: payload.suggestions,
          mode: payload.mode
        }
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Copilot is temporarily unavailable. Check API connectivity and Gemini key configuration.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '60px' : '540px',
              width: '410px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 flex flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--surface-border)' }}
          >
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--surface-border)', background: 'color-mix(in srgb, var(--accent) 10%, var(--surface-2) 90%)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot size={20} style={{ color: 'var(--accent)' }} />
                  <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--status-success)' }} />
                </div>
                <div>
                  <h3 className="theme-strong-text text-sm font-bold">Fraud AI Copilot</h3>
                  <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Big Brains Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="theme-btn-ghost p-1.5"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="theme-btn-ghost p-1.5"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'rounded-tr-none'
                            : 'rounded-tl-none border'
                        }`}
                        style={msg.role === 'user'
                          ? { background: 'linear-gradient(120deg, var(--accent), var(--accent-strong))', color: 'var(--button-primary-text)' }
                          : { background: 'var(--surface-1)', color: 'var(--app-text)', borderColor: 'var(--surface-border)' }}
                      >
                        {msg.role === 'ai' && (
                          <div className="mb-1.5 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                            <Sparkles size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">
                              AI Reasoning {msg.metadata?.mode === 'fallback' ? '(Fallback)' : ''}
                            </span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {msg.role === 'ai' && msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="theme-muted-text text-[10px] uppercase tracking-wider">Evidence</div>
                            {msg.metadata.sources.slice(0, 4).map((source) => (
                              <div
                                key={`${msg.id}-${source.id}`}
                                className="rounded-lg border px-2 py-1.5 text-[10px]"
                                style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-2)', color: 'var(--app-text)' }}
                              >
                                <div className="theme-muted-text flex items-center gap-1">
                                  <Link2 size={10} />
                                  <span className="font-semibold">{source.id}</span>
                                </div>
                                <p className="mt-1 text-[10px] leading-snug">{source.snippet}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.role === 'ai' && msg.metadata?.suggestions && msg.metadata.suggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.metadata.suggestions.map((suggestion) => (
                              <button
                                key={`${msg.id}-${suggestion}`}
                                onClick={() => handleSend(suggestion)}
                                disabled={isLoading}
                                className="theme-btn-secondary rounded-md px-2 py-1 text-[10px]"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-none border p-3" style={{ background: 'var(--surface-1)', color: 'var(--app-text)', borderColor: 'var(--surface-border)' }}>
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ animationDelay: '0ms', background: 'var(--accent)' }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ animationDelay: '150ms', background: 'var(--accent)' }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ animationDelay: '300ms', background: 'var(--accent)' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="border-t p-4" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-3)' }}>
                  <div className="relative flex items-center gap-2">
                    <input
                      type="text"
                      className="input flex-1 py-2.5 px-4 text-xs"
                      placeholder="Ask about an alert, case, transaction, user, or device..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSend();
                      }}
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading}
                      className={`rounded-xl p-2.5 transition shadow-lg ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={isLoading
                        ? { background: 'var(--surface-1)', color: 'var(--app-text-muted)' }
                        : { background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', boxShadow: '0 10px 20px -16px color-mix(in srgb, var(--accent) 85%, transparent)' }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => handleSend('Summarize open alerts and recommend triage order.')}
                      className="theme-btn-ghost text-[10px] font-bold uppercase"
                    >
                      <ShieldAlert size={10} /> Triage Alerts
                    </button>
                    <button
                      onClick={() => handleSend('Summarize the latest high-risk transaction trends and model confidence clues.')}
                      className="theme-btn-ghost text-[10px] font-bold uppercase"
                    >
                      <TrendingUp size={10} /> Live Trends
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setIsMinimized(false);
          } else {
            setIsMinimized(false);
          }
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl transition-all duration-300"
        style={isOpen
          ? { background: 'var(--surface-2)', borderColor: 'var(--surface-border-strong)', color: 'var(--accent)' }
          : { background: 'var(--button-primary-bg)', borderColor: 'transparent', color: 'var(--button-primary-text)' }}
      >
        <Bot size={24} className={isOpen ? 'animate-pulse' : ''} />
      </motion.button>
    </div>
  );
};
