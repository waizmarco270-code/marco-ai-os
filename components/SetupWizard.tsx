
import React, { useState, useRef } from 'react';
import { ThemeColors, MasterProfile } from '../types';
import { playSound } from '../services/audioService';

interface SetupWizardProps {
  theme: ThemeColors;
  licenseKey: string;
  onComplete: (profile: MasterProfile) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ theme, licenseKey, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [voicePhrase, setVoicePhrase] = useState("PROTOCOL ALPHA");
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Voice Recording Sim
  const [isListening, setIsListening] = useState(false);

  const handleNext = () => {
      playSound('success');
      setStep(prev => prev + 1);
  };

  const handleFinish = () => {
      // Simulate Final Sync
      playSound('startup');
      setStep(4);
      let p = 0;
      const interval = setInterval(() => {
          p += 2;
          setSyncProgress(p);
          if (p >= 100) {
              clearInterval(interval);
              const profile: MasterProfile = {
                  isRegistered: true,
                  name: name || 'Master',
                  pin: pin || '0000',
                  voicePhrase: voicePhrase.toUpperCase(),
                  licenseKey,
                  registeredAt: Date.now()
              };
              setTimeout(() => onComplete(profile), 1000);
          }
      }, 50);
  };

  const startVoiceRecord = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice not supported. Using default.");
          return;
      }
      setIsListening(true);
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onresult = (e: any) => {
          setVoicePhrase(e.results[0][0].transcript.toUpperCase());
          setIsListening(false);
          playSound('success');
      };
      recognition.start();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black font-mono">
       <div className={`w-full max-w-lg p-8 border border-${theme.border} bg-gray-900/50 rounded-lg backdrop-blur-md relative overflow-hidden`}>
           
           {/* Header */}
           <div className="mb-8 border-b border-gray-700 pb-4">
               <h2 className={`text-xl font-bold text-${theme.primary} font-orbitron tracking-widest`}>GENESIS PROTOCOL</h2>
               <div className="flex gap-1 mt-2">
                   {[1,2,3,4].map(s => (
                       <div key={s} className={`h-1 flex-1 rounded ${step >= s ? `bg-${theme.primary}` : 'bg-gray-800'}`}></div>
                   ))}
               </div>
           </div>

           {/* STEP 1: IDENTITY */}
           {step === 1 && (
               <div className="space-y-6 animate-fade-in">
                   <div className="text-center">
                       <h3 className="text-white text-lg font-bold">IDENTITY REGISTRATION</h3>
                       <p className="text-xs text-gray-500 mt-2">How should the system address you?</p>
                   </div>
                   <input 
                     type="text" 
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder="ENTER YOUR NAME"
                     className={`w-full bg-black p-4 text-center text-white border border-gray-700 focus:border-${theme.primary} outline-none rounded font-bold tracking-wider`}
                   />
                   <button onClick={handleNext} disabled={!name} className={`w-full py-3 bg-${theme.primary} text-black font-bold rounded ${!name ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}>
                       CONFIRM IDENTITY
                   </button>
               </div>
           )}

           {/* STEP 2: SECURITY */}
           {step === 2 && (
               <div className="space-y-6 animate-fade-in">
                   <div className="text-center">
                       <h3 className="text-white text-lg font-bold">SECURITY CALIBRATION</h3>
                       <p className="text-xs text-gray-500 mt-2">Set your backup PIN code.</p>
                   </div>
                   <input 
                     type="text" 
                     value={pin}
                     maxLength={6}
                     onChange={(e) => setPin(e.target.value.replace(/\D/g,''))}
                     placeholder="0000"
                     className={`w-full bg-black p-4 text-center text-2xl text-white border border-gray-700 focus:border-${theme.primary} outline-none rounded font-bold tracking-[1em]`}
                   />
                   <button onClick={handleNext} disabled={pin.length < 4} className={`w-full py-3 bg-${theme.primary} text-black font-bold rounded ${pin.length < 4 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}>
                       SET PIN
                   </button>
               </div>
           )}

           {/* STEP 3: VOICE PRINT */}
           {step === 3 && (
               <div className="space-y-6 animate-fade-in">
                   <div className="text-center">
                       <h3 className="text-white text-lg font-bold">VOICE PRINT LINK</h3>
                       <p className="text-xs text-gray-500 mt-2">Record a phrase to unlock the Security Gate.</p>
                   </div>
                   
                   <div className="flex flex-col items-center gap-4 py-4">
                       <button 
                         onClick={startVoiceRecord}
                         className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all ${isListening ? 'border-red-500 bg-red-900/20 animate-pulse' : `border-${theme.primary} hover:bg-${theme.primary}/10`}`}
                       >
                           <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                       </button>
                       <div className="text-xl font-bold text-white text-center border-b border-gray-700 pb-1">
                           "{voicePhrase}"
                       </div>
                       <p className="text-[10px] text-gray-500">Tap icon to record new phrase</p>
                   </div>

                   <button onClick={handleFinish} className={`w-full py-3 bg-${theme.primary} text-black font-bold rounded hover:opacity-90`}>
                       FINALIZE SETUP
                   </button>
               </div>
           )}

           {/* STEP 4: SYNCING */}
           {step === 4 && (
               <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                   <div className={`w-16 h-16 border-4 border-${theme.primary} border-t-transparent rounded-full animate-spin mb-6`}></div>
                   <h3 className="text-xl font-bold text-white mb-2">SYNCING NEURAL CORE</h3>
                   <div className="w-full bg-gray-800 h-1 rounded overflow-hidden">
                       <div className={`h-full bg-${theme.primary} transition-all duration-75`} style={{ width: `${syncProgress}%` }}></div>
                   </div>
                   <div className="text-xs text-gray-500 mt-2 font-mono">{syncProgress}% COMPLETE</div>
               </div>
           )}

       </div>
    </div>
  );
};

export default SetupWizard;
