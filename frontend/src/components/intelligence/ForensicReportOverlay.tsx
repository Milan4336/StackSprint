import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ShieldAlert, FileText, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { HUDPanel } from '../visual/HUDDecorations';

interface ForensicReportOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    reportContent: string;
    txId: string;
}

export const ForensicReportOverlay = ({ isOpen, onClose, reportContent, txId }: ForensicReportOverlayProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="w-full max-w-4xl h-[85vh] relative"
                    >
                        <HUDPanel className="h-full flex flex-col p-0 overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-blue-600/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <ShieldAlert className="text-blue-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Forensic Incident briefing</h2>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">{txId} // INTEL-CAPTURED</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <Download size={16} /> Export PDF
                                    </button>
                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <Share2 size={16} /> Share Link
                                    </button>
                                    <div className="w-px h-8 bg-white/10 mx-2" />
                                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-10 prose prose-invert prose-slate max-w-none scrollbar-thin scrollbar-thumb-white/10">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ children }: any) => <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-8 bg-gradient-to-r from-blue-500 to-transparent p-4 border-l-4 border-blue-500">{children}</h1>,
                                        h2: ({ children }: any) => <h2 className="text-sm font-black uppercase tracking-[0.3em] text-blue-400 mt-12 mb-6 border-b border-white/5 pb-2">{children}</h2>,
                                        table: ({ children }: any) => <div className="p-4 bg-white/5 rounded-2xl border border-white/10 my-8"><table className="w-full text-left border-collapse">{children}</table></div>,
                                        th: ({ children }: any) => <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-white/10">{children}</th>,
                                        td: ({ children }: any) => <td className="p-3 text-[11px] font-medium text-slate-300 border-b border-white/5">{children}</td>,
                                        blockquote: ({ children }: any) => <div className="p-6 bg-red-500/10 border-l-4 border-red-500 rounded-r-2xl my-8 italic text-red-200">{children}</div>,
                                        code: ({ children }: any) => <code className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono text-[10px]">{children}</code>,
                                    }}
                                >
                                    {reportContent}
                                </ReactMarkdown>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Data Verified By Neural Link</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-400/50">
                                        <FileText size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Hash: 77a8b...2291c</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Confidential SOC Investigation Asset</p>
                            </div>
                        </HUDPanel>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
