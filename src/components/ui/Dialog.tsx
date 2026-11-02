import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { ScrollArea } from './scroll-area';
import RiIcon from './RiIcon';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
    actions?: ReactNode;
    type?: 'info' | 'success' | 'warning' | 'error';
    maxWidth?: string;
}

export default function Dialog({ 
    isOpen, 
    onClose, 
    title, 
    description, 
    children, 
    actions,
    type = 'info',
    maxWidth = 'max-w-md'
}: DialogProps) {
    
    const getIcon = () => {
        switch(type) {
            case 'success': return 'ri-checkbox-circle-fill text-green-500'; 
            case 'warning': return 'ri-alert-fill text-yellow-500'; 
            case 'error': return 'ri-error-warning-fill text-red-500'; 
            default: return 'ri-information-fill text-primary'; 
        }
    };

    const getGradient = () => {
        switch(type) {
            case 'success': return 'from-green-500/10 to-transparent';
            case 'warning': return 'from-yellow-500/10 to-transparent';
            case 'error': return 'from-red-500/10 to-transparent';
            default: return 'from-primary/10 to-transparent';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop with heavy blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className={`relative w-full ${maxWidth} bg-white border border-slate-100 rounded-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] overflow-hidden`}
                    >
                        {/* Ambient Glow based on type */}
                        <div className={`absolute top-0 inset-x-0 h-48 bg-linear-to-b ${getGradient()} opacity-100 blur-3xl pointer-events-none`} />

                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all z-20 group border border-slate-100"
                        >
                            <RiIcon className="ri-close-line text-lg group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Header Section - Fixed */}
                        <div className="relative px-5 sm:px-10 pt-8 sm:pt-10 pb-4 shrink-0 z-10">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 relative">
                                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${type === 'info' ? 'bg-primary' : type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-lg shadow-black/5">
                                        <RiIcon className={`${getIcon()} text-4xl drop-shadow-sm`} />
                                    </div>
                                </div>
                                
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
                                {description && (
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {/* Body Content - Scrollable */}
                        <div className="relative z-10">
                            <ScrollArea className="h-auto max-h-[40vh] w-full">
                                <div className="px-5 sm:px-10 py-4 text-slate-600 font-medium text-sm leading-relaxed">
                                    {children}
                                </div>
                            </ScrollArea>
                        </div>
                        
                        {/* Actions Footer - Fixed */}
                        {actions ? (
                            <div className="relative px-5 sm:px-10 pb-6 sm:pb-10 pt-4 shrink-0 z-10">
                                <div className="pt-6 border-t border-slate-50 flex flex-col-reverse sm:flex-row justify-stretch sm:justify-end gap-3 font-bold">
                                    {actions}
                                </div>
                            </div>
                        ) : (
                            <div className="pb-6 sm:pb-10 shrink-0" />
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
