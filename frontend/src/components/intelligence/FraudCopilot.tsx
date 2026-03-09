import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    X,
    Send,
    Sparkles,
    ShieldAlert,
    Activity,
    ChevronRight,
    Minimize2,
    Maximize2,
    Mic,
    MicOff,
    Terminal,
    Eye,
    Download,
    Cpu
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useUISound } from '../../hooks/useUISound';
import { ForensicReportOverlay } from './ForensicReportOverlay';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    type?: 'TEXT' | 'INVESTIGATION' | 'REPORT' | 'CLUSTER' | 'TIMELINE';
    data?: any;
    suggestions?: string[];
}

export const FraudCopilot = () => {
    const { playSound } = useUISound();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAutonomous, setIsAutonomous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');
    const [reportData, setReportData] = useState<{ isOpen: boolean; content: string; txId: string }>({
        isOpen: false,
        content: '',
        txId: ''
    });
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'ai',
            content: "Neural Intelligence Link Established. I am scanning global transaction vectors for coordinated fraud clusters. How can I assist your surveillance?",
            timestamp: new Date(),
            type: 'TEXT'
        }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Voice Support
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            playSound('SCAN');
            setIsListening(true);
            recognitionRef.current?.start();
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (overrideInput?: string) => {
        const textToQuery = overrideInput || input;
        if (!textToQuery.trim()) return;

        playSound('CLICK');
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: textToQuery,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await monitoringApi.queryCopilot(textToQuery);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response.content,
                timestamp: new Date(),
                type: response.type,
                data: response.data,
                suggestions: response.suggestions
            };

            if (response.data?.autonomous !== undefined) {
                setIsAutonomous(response.data.autonomous);
            }

            setMessages(prev => [...prev, aiMsg]);

            // Text to Speech for AI responses
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(response.content);
                utterance.pitch = 0.8;
                utterance.rate = 1.1;
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Copilot Query Failed', error);
        } finally {
            setLoading(false);
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
                            height: isMinimized ? '60px' : '500px',
                            width: '420px'
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 bg-[#0a0f1d]/95 backdrop-blur-2xl border border-blue-500/30 rounded-[32px] shadow-[0_0_50px_rgba(37,99,235,0.2)] flex flex-col overflow-hidden ring-1 ring-white/10"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`absolute -inset-2 rounded-full blur-lg opacity-50 ${isAutonomous ? 'bg-red-500' : 'bg-blue-500'}`} />
                                    <Bot className={isAutonomous ? 'text-red-400' : 'text-blue-400'} size={24} />
                                    <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a0f1d] ${isAutonomous ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Autonomous Intelligence</h3>
                                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Cpu size={10} /> {isAutonomous ? 'Autonomous Mode Engaged' : 'SOC Analyst Assistant'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div className={`p-4 rounded-2xl text-[11px] font-medium leading-relaxed shadow-lg ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none border border-blue-400/30'
                                                    : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10 backdrop-blur-md'
                                                    }`}>
                                                    {msg.role === 'ai' && (
                                                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                                                            <Sparkles size={12} className="animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Node Reasoning</span>
                                                        </div>
                                                    )}
                                                    {msg.content}

                                                    {/* Structured Data Result */}
                                                    {msg.type === 'INVESTIGATION' && msg.data && (
                                                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                    <ShieldAlert size={10} /> Risk Assessment
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-white font-black">{msg.data.fraudScore.toFixed(2)}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${msg.data.fraudScore > 0.7 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                                        {msg.data.fraudScore > 0.7 ? 'High Risk' : 'Low Risk'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    if (msg.type === 'REPORT' && msg.data?.report) {
                                                                        setReportData({ isOpen: true, content: msg.data.report, txId: msg.data.id });
                                                                    } else if (msg.type === 'INVESTIGATION' && msg.data?.entityId) {
                                                                        const r = await monitoringApi.getCopilotReport(msg.data.entityId);
                                                                        setReportData({ isOpen: true, content: r, txId: msg.data.entityId });
                                                                    }
                                                                }}
                                                                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all"
                                                            >
                                                                <span className="flex items-center gap-2 text-blue-400"><Terminal size={12} /> View Forensic Trace</span>
                                                                <ChevronRight size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Suggestions */}
                                                {msg.suggestions && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {msg.suggestions.map(s => (
                                                            <button
                                                                key={s} onClick={() => handleSend(s)}
                                                                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[8px] font-black text-slate-400 uppercase tracking-widest hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="mt-1.5 text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 rounded-tl-none flex gap-2">
                                                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-6 border-t border-white/5 bg-black/20">
                                    <div className="relative flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                className={`w-full bg-white/5 border ${isListening ? 'border-blue-500 animate-pulse' : 'border-white/10'} rounded-2xl py-3.5 pl-5 pr-12 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600`}
                                                placeholder={isListening ? "Listening to SOC logs..." : "Search entities, trace IPs, analyze clusters..."}
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            />
                                            <button
                                                onClick={toggleVoice}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={loading || !input.trim()}
                                            className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <button className="text-[9px] font-black text-slate-500 hover:text-blue-400 flex items-center gap-2 uppercase tracking-widest transition-colors">
                                                <Eye size={12} /> Live Capture
                                            </button>
                                            <button className="text-[9px] font-black text-slate-500 hover:text-blue-400 flex items-center gap-2 uppercase tracking-widest transition-colors">
                                                <Download size={12} /> Export Node
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sync Ver. 4.2.0</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                        setIsMinimized(false);
                    } else {
                        setIsMinimized(false);
                    }
                }}
                className={`h-16 w-16 rounded-[22px] flex items-center justify-center shadow-2xl transition-all duration-500 relative overflow-hidden group ${isOpen
                    ? 'bg-[#0a0f1d] border border-blue-500/50 text-blue-400'
                    : 'bg-blue-600 text-white'
                    }`}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Bot size={28} className={isOpen ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'} />

                {isAutonomous && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-[#0a0f1d] rounded-full flex items-center justify-center"
                    >
                        <ShieldAlert size={10} className="text-white" />
                    </motion.div>
                )}
            </motion.button>

            <ForensicReportOverlay
                isOpen={reportData.isOpen}
                onClose={() => setReportData(prev => ({ ...prev, isOpen: false }))}
                reportContent={reportData.content}
                txId={reportData.txId}
            />
        </div>
    );
};
