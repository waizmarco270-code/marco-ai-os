

import React, { useEffect, useRef, useState } from 'react';
import { OverlayType, ThemeColors } from '../types';
import { playSound } from '../services/audioService';

interface SystemOverlayProps {
  type: OverlayType;
  theme: ThemeColors;
  onClose: (snooze?: boolean) => void;
}

const SystemOverlay: React.FC<SystemOverlayProps> = ({ type, theme, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [alarmTime, setAlarmTime] = useState('');

  // Update time for alarm
  useEffect(() => {
     if (type === 'ALARM_TRIGGER') {
         const interval = setInterval(() => {
             const now = new Date();
             setAlarmTime(now.toLocaleTimeString());
         }, 1000);
         return () => clearInterval(interval);
     }
  }, [type]);

  // HACK SIMULATION LOGIC
  useEffect(() => {
    if (type !== 'HACK_SIMULATION') return;

    playSound('alert');
    
    const commands = [
      "INITIALIZING BRUTE FORCE PROTOCOL...",
      "BYPASSING FIREWALL... [SUCCESS]",
      "INJECTING SQL PAYLOAD...",
      "ACCESSING MAINFRAME ROOT...",
      "DECRYPTING SECURITY KEYS...",
      "DOWNLOADING SENSITIVE DATA...",
      "MASKING IP ADDRESS...",
      "ESTABLISHING SECURE TUNNEL...",
      "TARGET SYSTEM COMPROMISED.",
      "UPLOAD COMPLETE."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= commands.length) {
        clearInterval(interval);
        setTimeout(() => onClose(), 1000);
        return;
      }
      setTerminalLines(prev => [...prev.slice(-15), `> ${commands[i]} ${Math.random() > 0.5 ? '[OK]' : '...'}`]);
      playSound('click');
      i++;
    }, 400);

    return () => clearInterval(interval);
  }, [type, onClose]);

  // MATRIX RAIN LOGIC
  useEffect(() => {
    if (type !== 'MATRIX_RAIN') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const alphabet = katakana + latin;

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Classic Matrix Green
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 30);
    
    // Close on click or specific timeout if desired, but user might want to enjoy it
    const handleClose = () => onClose();
    window.addEventListener('click', handleClose);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleClose);
    };
  }, [type, onClose]);

  // SYSTEM REBOOT LOGIC
  useEffect(() => {
    if (type !== 'SYSTEM_REBOOT') return;
    
    playSound('startup');
    const sequence = [
      "BIOS CHECK... OK",
      "LOADING KERNEL MODULES...",
      "MOUNTING FILE SYSTEMS...",
      "STARTING AI ENGINE...",
      "SYSTEM REBOOT SUCCESSFUL"
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i >= sequence.length) {
            clearInterval(interval);
            setTimeout(() => onClose(), 800);
            return;
        }
        setTerminalLines(prev => [...prev, sequence[i]]);
        i++;
    }, 600);
    
    return () => clearInterval(interval);
  }, [type, onClose]);

  if (type === 'NONE') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-green-500 font-mono overflow-hidden flex flex-col items-center justify-center">
      
      {type === 'MATRIX_RAIN' && <canvas ref={canvasRef} className="absolute inset-0" />}
      
      {type === 'HACK_SIMULATION' && (
        <div className="absolute inset-0 bg-black/90 p-10 font-mono text-sm md:text-lg text-green-500">
           <h1 className="text-4xl mb-8 animate-pulse text-red-500 font-bold border-b border-red-500 pb-2">CRITICAL OVERRIDE // HACK_MODE</h1>
           <div className="space-y-2">
             {terminalLines.map((line, idx) => (
                <div key={idx} className="animate-fade-in-up">{line}</div>
             ))}
           </div>
           <div className="mt-4 animate-pulse">_</div>
        </div>
      )}

      {type === 'SYSTEM_REBOOT' && (
         <div className="flex flex-col items-start gap-4 p-8 w-full max-w-2xl">
            <div className="text-2xl text-white mb-4">MARCO OS v3.0</div>
            {terminalLines.map((line, idx) => (
                <div key={idx} className="text-gray-400 border-l-2 border-blue-500 pl-2 w-full">{line}</div>
            ))}
            <div className="w-full bg-gray-900 h-1 mt-4 rounded overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse w-full origin-left transition-transform duration-[3000ms]"></div>
            </div>
         </div>
      )}

      {type === 'ALARM_TRIGGER' && (
          <div className="absolute inset-0 z-[200] bg-red-950 flex flex-col items-center justify-center animate-pulse">
              <div className="text-[120px] font-black text-red-500 leading-none">{alarmTime || "00:00:00"}</div>
              <div className="text-4xl font-mono text-white tracking-widest mt-4 mb-16 animate-bounce">WAKE UP PROTOCOL ACTIVE</div>
              <div className="flex gap-4">
                  <button 
                    onClick={() => onClose(false)}
                    className="px-10 py-5 bg-white text-black font-black text-xl tracking-widest hover:bg-gray-200 transition-colors rounded shadow-[0_0_50px_rgba(255,255,255,0.5)]"
                  >
                      DISMISS
                  </button>
                  <button 
                    onClick={() => onClose(true)}
                    className="px-10 py-5 bg-transparent border-2 border-white text-white font-black text-xl tracking-widest hover:bg-white/10 transition-colors rounded"
                  >
                      SNOOZE (5m)
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default SystemOverlay;