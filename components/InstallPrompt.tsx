
import React, { useState, useEffect } from 'react';
import { ThemeColors } from '../types';
import { playSound } from '../services/audioService';

interface InstallPromptProps {
  theme: ThemeColors;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ theme }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = () => {
        const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStand);
        if (isStand) setShowPrompt(false);
    };
    checkStandalone();
    
    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // If not standalone, we want to show prompt eventually
    if (!isStandalone) {
        // For Android/Chrome
        const handler = (e: Event) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setShowPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        
        // For iOS or if prompt doesn't fire immediately, show persistent banner anyway
        // because users might have dismissed it before
        const timer = setTimeout(() => {
            if (!isStandalone) setShowPrompt(true);
        }, 2000);

        return () => {
          window.removeEventListener('beforeinstallprompt', handler);
          clearTimeout(timer);
        };
    }
  }, [isStandalone]);

  const handleInstall = async () => {
    if (deferredPrompt) {
        playSound('startup');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowPrompt(false);
        }
    } else if (isIOS) {
        alert("To install MARCO OS:\n1. Tap the Share button below\n2. Select 'Add to Home Screen'");
    } else {
        alert("To install: Open browser menu (⋮) and select 'Install App' or 'Add to Home Screen'.");
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in-down w-[90%] max-w-sm">
      <button
        onClick={handleInstall}
        className={`
          w-full flex items-center gap-3 px-4 py-3 
          bg-black/95 border border-${theme.accent} 
          shadow-[0_0_30px_rgba(6,182,212,0.6)] rounded-lg
          group hover:bg-${theme.primary}/10 transition-all backdrop-blur-md
        `}
      >
        <div className={`p-2 rounded-full border border-${theme.primary} animate-pulse shrink-0`}>
           <svg className={`w-5 h-5 text-${theme.primary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </div>
        <div className="text-left flex-1">
            <div className={`text-xs font-bold text-${theme.accent} font-orbitron tracking-widest mb-1`}>SYSTEM UPDATE AVAILABLE</div>
            <div className="text-[9px] text-gray-300 font-mono leading-tight">
                {isIOS ? "TAP TO INSTALL APP (iOS)" : "INSTALL MARCO OS TO DEVICE"}
            </div>
        </div>
      </button>
    </div>
  );
};

export default InstallPrompt;
