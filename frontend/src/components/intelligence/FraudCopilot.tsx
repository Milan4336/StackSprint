import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    X,
    Send,
    Sparkles,
    ShieldAlert,
    TrendingUp,
    Activity,
    ChevronRight,
    Minimize2,
    Maximize2
} from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    metadata?: any;
}

export const FraudCopilot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'ai',
            content: "SOC AI Agent online. I'm monitoring live streams for fraud rings. How can I assist with your investigation?",
            timestamp: new Date()
        }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate AI Response
        setTimeout(() => {
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: `Analyzing entity graph for references to "${input}". I've detected a cluster of 4 devices using shared fingerprinting hardware IDs associated with recent alerts.`,
                timestamp: new Date(),
                metadata: { entitiesFound: 4 }
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 800);
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
                            height: isMinimized ? '60px' : '500px',
                            width: '380px'
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-blue-600/10">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bot className="text-blue-400" size={20} />
                                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-100">Fraud AI Copilot</h3>
                                    <p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Active Surveillance</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition"
                                >
                                    {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                                }`}>
                                                {msg.role === 'ai' && (
                                                    <div className="flex items-center gap-2 mb-1.5 text-blue-400">
                                                        <Sparkles size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">AI Reasoning</span>
                                                    </div>
                                                )}
                                                {msg.content}
                                                {msg.metadata?.entitiesFound && (
                                                    <div className="mt-2 pt-2 border-t border-slate-700">
                                                        <button className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold transition">
                                                            VIEW CLUSTER ANALYSIS <ChevronRight size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                                    <div className="relative flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-100 outline-none focus:border-blue-500/50 transition"
                                            placeholder="Ask copilot about an entity or alert..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        />
                                        <button
                                            onClick={handleSend}
                                            className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition shadow-lg shadow-blue-600/20"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <button className="text-[10px] font-bold text-slate-500 hover:text-blue-400 flex items-center gap-1 uppercase transition">
                                            <ShieldAlert size={10} /> Triage Alerts
                                        </button>
                                        <button className="text-[10px] font-bold text-slate-500 hover:text-blue-400 flex items-center gap-1 uppercase transition">
                                            <Activity size={10} /> Live Trends
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
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen
                        ? 'bg-slate-900 border border-blue-500/50 text-blue-400'
                        : 'bg-blue-600 text-white'
                    }`}
            >
                <Bot size={24} className={isOpen ? 'animate-pulse' : ''} />
            </motion.button>
        </div>
    );
};
