
import React, { useState, useEffect } from 'react';
import { ThemeColors } from '../types';
import { playSound } from '../services/audioService';

interface InstallPromptProps {
  theme: ThemeColors;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ theme }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    playSound('startup');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-down">
      <button
        onClick={handleInstall}
        className={`
          flex items-center gap-3 px-6 py-2 
          bg-black/90 border border-${theme.accent} 
          shadow-[0_0_20px_rgba(6,182,212,0.4)] rounded-full 
          group hover:bg-${theme.primary}/10 transition-all
        `}
      >
        <div className={`p-1.5 rounded-full border border-${theme.primary} animate-pulse`}>
           <svg className={`w-4 h-4 text-${theme.primary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </div>
        <div className="text-left">
            <div className={`text-[10px] font-bold text-${theme.accent} font-orbitron tracking-widest`}>SYSTEM UPDATE AVAILABLE</div>
            <div className="text-[8px] text-gray-400 font-mono">INSTALL MARCO OS TO DEVICE</div>
        </div>
      </button>
    </div>
  );
};

export default InstallPrompt;
