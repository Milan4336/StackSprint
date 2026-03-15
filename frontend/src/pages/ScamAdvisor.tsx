import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';

interface AnalysisResult {
  isScam: boolean;
  scamType?: string;
  confidence: number;
  explanation: string;
  recommendedActions: string[];
}

export const ScamAdvisor: React.FC = () => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>(['[SYSTEM] ScamAdvisor Neural Link Established...', '[READY] Paste message or describe suspicious activity.']);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  const addLine = (line: string) => {
    setTerminalLines(prev => [...prev, `> ${line}`]);
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [terminalLines]);

  const handleAnalyze = async () => {
    if (!input.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);
    addLine(`ANALYZING: "${input.slice(0, 50)}..."`);
    addLine('CONNECTING TO GEMINI NEURAL ENGINE...');

    try {
      const response = await fetch('/api/v1/scam-advisor/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: input, type: 'text' })
      });

      const data = await response.json();
      
      if (data.isScam) {
        addLine(`⚠️ THREAT DETECTED: ${data.scamType}`);
        addLine(`CONFIDENCE: ${(data.confidence * 100).toFixed(1)}%`);
      } else {
        addLine('✅ NO IMMEDIATE THREAT DETECTED.');
      }
      
      setResult(data);
      addLine('ANALYSIS COMPLETE.');
    } catch (error) {
      addLine('❌ ERROR: CONNECTION INTERRUPTED.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">AI Scam Advisor</h1>
        <p className="text-slate-400">Paste suspicious messages, SMS, or emails for real-time forensic analysis.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <section className="panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Forensic Input</h2>
            <div className="flex gap-2">
              <span className="chip bg-blue-500/10 text-blue-300 border-blue-500/20">OCR Enabled</span>
              <span className="chip bg-purple-500/10 text-purple-300 border-purple-500/20">Gemini-Flash 2.0</span>
            </div>
          </div>
          
          <textarea
            className="w-full h-64 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono text-sm"
            placeholder="Paste suspicious text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !input.trim()}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
              isAnalyzing 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]'
            }`}
          >
            {isAnalyzing ? 'Processing...' : 'Run Forensic Analysis'}
          </button>
        </section>

        {/* Terminal/Result Section */}
        <section className="panel bg-slate-950 border-slate-800 flex flex-col h-[500px]">
          <div className="p-3 border-b border-slate-800 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-xs font-mono text-slate-500 ml-2">INTEL_TERMINAL_V4.0</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-hide">
            {terminalLines.map((line, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }}
                className={line.includes('⚠️') ? 'text-red-400' : line.includes('✅') ? 'text-emerald-400' : 'text-slate-400'}
              >
                {line}
              </motion.div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 border-t border-slate-800 ${result.isScam ? 'bg-red-500/5' : 'bg-emerald-500/5'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${result.isScam ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {result.isScam ? '⚠️' : '✅'}
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className={`text-lg font-bold ${result.isScam ? 'text-red-300' : 'text-emerald-300'}`}>
                      {result.isScam ? `Detected: ${result.scamType}` : 'No Scam Detected'}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                    
                    {result.recommendedActions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended Actions:</p>
                        <ul className="grid grid-cols-1 gap-2">
                          {result.recommendedActions.map((action, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1 h-1 rounded-full bg-slate-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};
