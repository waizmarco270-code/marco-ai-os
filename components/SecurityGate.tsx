
import React, { useState, useEffect, useRef } from 'react';
import { ThemeColors, UserRole, MasterProfile } from '../types';
import { playSound } from '../services/audioService';

interface SecurityGateProps {
  theme: ThemeColors;
  masterProfile: MasterProfile;
  onAuthenticate: (role: UserRole) => void;
}

const SecurityGate: React.FC<SecurityGateProps> = ({ theme, masterProfile, onAuthenticate }) => {
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'SCANNING' | 'ACCESS_GRANTED' | 'ACCESS_DENIED'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [authMethod, setAuthMethod] = useState<'TEXT' | 'VOICE'>('TEXT');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // BIOMETRIC SCAN VISUALIZATION
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let tick = 0;

    const render = () => {
      tick++;
      canvas.width = 300;
      canvas.height = 300;
      const cx = 150;
      const cy = 150;

      ctx.clearRect(0, 0, 300, 300);

      const baseColor = status === 'ACCESS_DENIED' ? '#ef4444' : (status === 'ACCESS_GRANTED' ? '#22c55e' : '#06b6d4');

      // Outer Rotating Ring
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 100, tick * 0.02, tick * 0.02 + Math.PI * 1.5);
      ctx.stroke();

      // Inner Ring (Counter Rotate)
      ctx.strokeStyle = status === 'ACCESS_DENIED' ? '#991b1b' : (status === 'ACCESS_GRANTED' ? '#166534' : '#155e75');
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, -tick * 0.03, -tick * 0.03 + Math.PI);
      ctx.stroke();

      // Center Visuals
      if (status === 'SCANNING') {
          // Scanning Beam
          const scanY = 50 + (tick % 200);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = baseColor;
          ctx.beginPath();
          ctx.moveTo(50, scanY);
          ctx.lineTo(250, scanY);
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // Random Data Points
          ctx.fillStyle = baseColor;
          for(let i=0; i<5; i++) {
              ctx.fillRect(60 + Math.random()*180, scanY + Math.random()*20, 2, 2);
          }
      } else if (status === 'LISTENING') {
          // Audio Waveform Simulation
          ctx.beginPath();
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          for (let i = 0; i < 100; i++) {
              const x = 50 + i * 2;
              const y = cy + Math.sin(tick * 0.2 + i * 0.5) * (10 + Math.random() * 20);
              i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
          
          ctx.fillStyle = baseColor;
          ctx.font = '10px monospace';
          ctx.fillText("ANALYZING VOICE PATTERN...", cx, cy + 40);
          ctx.textAlign = 'center';
      }

      // Center Icon (when not listing/scanning special visuals)
      if (status !== 'LISTENING' && status !== 'SCANNING') {
          ctx.font = '40px monospace';
          ctx.fillStyle = status === 'ACCESS_DENIED' ? '#ef4444' : (status === 'ACCESS_GRANTED' ? '#22c55e' : '#fff');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let icon = '🔒';
          if (status === 'ACCESS_GRANTED') icon = '🔓';
          if (status === 'ACCESS_DENIED') icon = '🚫';
          
          ctx.fillText(icon, cx, cy);
      }

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationId);
  }, [status]);

  const startVoiceAuth = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice auth not supported in this browser.");
          return;
      }
      
      setAuthMethod('VOICE');
      setStatus('LISTENING');
      playSound('startup');
      
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setPasscode(transcript);
          validateCredentials(transcript);
      };
      
      recognition.onerror = (event: any) => {
          console.error("Voice Auth Error", event.error);
          setStatus('IDLE');
          setAuthMethod('TEXT');
      };
      
      recognition.onend = () => {
          if (status === 'LISTENING') setStatus('IDLE'); // Reset if no result
      };
      
      recognitionRef.current = recognition;
      recognition.start();
  };

  const handleTextLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!passcode.trim()) return;
    validateCredentials(passcode);
  };

  const validateCredentials = (inputPass: string) => {
    setStatus('SCANNING');
    setScanProgress(0);
    playSound('click');

    // Simulate Scan Duration
    let p = 0;
    const interval = setInterval(() => {
        p += 5;
        setScanProgress(p);
        if (p >= 100) {
            clearInterval(interval);
            finalizeLogin(inputPass);
        }
    }, 30);
  };

  const finalizeLogin = (inputPass: string) => {
      const lower = inputPass.toLowerCase().trim();
      
      // MASTER CREDENTIALS FROM PROFILE
      // Check Voice Phrase match OR PIN match OR Name match
      const voiceMatch = lower.includes(masterProfile.voicePhrase.toLowerCase());
      const pinMatch = lower === masterProfile.pin;
      const nameMatch = lower === masterProfile.name.toLowerCase();
      const identityMatch = lower.includes(`i am ${masterProfile.name.toLowerCase()}`);

      if (voiceMatch || pinMatch || nameMatch || identityMatch) {
          setStatus('ACCESS_GRANTED');
          playSound('success');
          setTimeout(() => onAuthenticate('MASTER'), 1200);
      } 
      // INTRUDER
      else {
          setStatus('ACCESS_DENIED');
          playSound('alert');
          setPasscode('');
          setTimeout(() => {
              setStatus('IDLE');
              setAuthMethod('TEXT');
          }, 2000);
      }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
        </div>

        <div className="z-10 flex flex-col items-center gap-8 w-full max-w-md p-6">
            <div className="text-center">
                <h1 className="text-4xl font-black font-orbitron text-cyan-500 tracking-[0.5em] animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                    MARCO
                </h1>
                <div className="text-[10px] font-mono text-cyan-800 tracking-widest mt-2 border-t border-cyan-900 pt-1">
                    SECURE BIOMETRIC GATEWAY // v3.3
                </div>
                <div className="text-[9px] font-bold text-red-500 tracking-widest mt-1 animate-pulse">
                    RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY
                </div>
            </div>

            <div className="relative w-[300px] h-[300px]">
                <canvas ref={canvasRef} className="w-full h-full" />
                
                {status === 'SCANNING' && (
                    <div className="absolute bottom-10 left-0 w-full text-center text-cyan-400 font-mono text-xs animate-pulse">
                        VERIFYING DNA SEQUENCE... {scanProgress}%
                    </div>
                )}
                
                {status === 'LISTENING' && (
                    <div className="absolute bottom-10 left-0 w-full text-center text-cyan-400 font-mono text-xs animate-pulse">
                        LISTENING...
                    </div>
                )}
            </div>

            {/* INPUT SECTION */}
            <div className="w-full space-y-4 relative">
                {status === 'ACCESS_DENIED' ? (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
                        <div className="text-red-500 font-black tracking-widest animate-bounce text-xl border-2 border-red-500 p-4 rounded">
                            UNAUTHORIZED PERSONNEL
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center gap-4 mb-2">
                            <button 
                                onClick={() => setAuthMethod('TEXT')}
                                className={`text-xs font-mono px-3 py-1 rounded border ${authMethod === 'TEXT' ? 'border-cyan-500 text-cyan-500 bg-cyan-900/20' : 'border-gray-800 text-gray-600'}`}
                            >
                                PIN PAD
                            </button>
                            <button 
                                onClick={startVoiceAuth}
                                className={`text-xs font-mono px-3 py-1 rounded border flex items-center gap-1 ${authMethod === 'VOICE' ? 'border-cyan-500 text-cyan-500 bg-cyan-900/20' : 'border-gray-800 text-gray-600'}`}
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                VOICE SCAN
                            </button>
                        </div>

                        {authMethod === 'TEXT' && (
                            <form onSubmit={handleTextLogin} className="flex flex-col gap-4 animate-fade-in">
                                <input 
                                    type="password" 
                                    autoFocus
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="ENTER MASTER PIN"
                                    disabled={status === 'SCANNING' || status === 'ACCESS_GRANTED'}
                                    className="w-full bg-gray-900/80 border border-gray-700 p-4 text-center text-white font-mono rounded-lg outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all placeholder-gray-600 tracking-widest uppercase"
                                />
                                <button 
                                    type="submit"
                                    disabled={status === 'SCANNING'}
                                    className="w-full py-3 bg-cyan-600/20 border border-cyan-500 text-cyan-400 font-bold font-mono rounded hover:bg-cyan-600/40 transition-colors tracking-widest"
                                >
                                    {status === 'SCANNING' ? 'AUTHENTICATING...' : 'VERIFY ACCESS'}
                                </button>
                            </form>
                        )}

                        {authMethod === 'VOICE' && (
                            <div className="flex flex-col items-center justify-center p-4 border border-cyan-900/50 bg-cyan-900/10 rounded-lg animate-fade-in">
                                <p className="text-xs text-cyan-300 font-mono mb-2">SAY: "{masterProfile.voicePhrase}"</p>
                                <button 
                                    onClick={startVoiceAuth}
                                    className={`p-6 rounded-full border-2 ${status === 'LISTENING' ? 'border-red-500 animate-pulse bg-red-900/20' : 'border-cyan-500 hover:bg-cyan-500/20'} transition-all`}
                                >
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="absolute bottom-4 text-[9px] text-gray-800 font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-green-900 rounded-full animate-pulse"></span>
                SECURE CONNECTION // {masterProfile.isRegistered ? 'REGISTERED' : 'UNREGISTERED'}
            </div>
        </div>
    </div>
  );
};

export default SecurityGate;
