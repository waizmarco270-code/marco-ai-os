
import React, { useState } from 'react';
import { ThemeColors } from '../types';
import { generateLicenseKey } from '../services/cryptoService';
import { playSound } from '../services/audioService';

interface AdminKeyGenProps {
  theme: ThemeColors;
  onClose: () => void;
}

const AdminKeyGen: React.FC<AdminKeyGenProps> = ({ theme, onClose }) => {
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [amount, setAmount] = useState(1);
  
  // Local Root Authentication
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [rootPass, setRootPass] = useState('');
  const [error, setError] = useState('');

  const handleRootUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (rootPass === 'waiz-dev-unlock') {
          playSound('success');
          setIsUnlocked(true);
      } else {
          playSound('alert');
          setError('ROOT ACCESS DENIED');
      }
  };

  const handleGenerate = async () => {
      const newKeys = [];
      for(let i=0; i<amount; i++) {
          newKeys.push(await generateLicenseKey());
      }
      setGeneratedKeys(prev => [...newKeys, ...prev]);
      playSound('success');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      playSound('click');
      alert(`COPIED: ${text}`);
  };

  // LOCKED STATE
  if (!isUnlocked) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black relative z-50">
            <div className="max-w-sm w-full p-8 border border-red-500 bg-red-950/10 rounded-lg text-center backdrop-blur-md">
                <div className="text-4xl mb-4 animate-bounce">🔒</div>
                <h2 className="text-red-500 font-black text-xl mb-6 tracking-widest font-mono">ROOT CLEARANCE REQUIRED</h2>
                <form onSubmit={handleRootUnlock} className="space-y-4">
                    <input 
                      type="password"
                      autoFocus
                      value={rootPass}
                      onChange={(e) => setRootPass(e.target.value)}
                      placeholder="ENTER ROOT PASSCODE"
                      className="w-full bg-black border border-red-900 p-3 text-red-500 rounded outline-none text-center font-mono placeholder-red-900/50"
                    />
                    {error && <div className="text-red-500 text-xs font-bold animate-pulse">{error}</div>}
                    <button type="submit" className="w-full bg-red-900 text-white py-3 rounded font-bold tracking-widest hover:bg-red-800 transition-colors">
                        UNLOCK CONSOLE
                    </button>
                    <button type="button" onClick={onClose} className="text-gray-500 text-xs hover:text-white underline">
                        RETURN TO SYSTEM
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // UNLOCKED STATE
  return (
    <div className="h-full p-8 bg-black overflow-y-auto custom-scrollbar font-mono animate-fade-in">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-8">
            <h1 className={`text-2xl font-bold text-${theme.primary}`}>ADMIN GENESIS CONSOLE</h1>
            <button onClick={onClose} className="text-red-500 hover:text-white">EXIT_ROOT</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-6 rounded border border-gray-800">
                <h2 className="text-xl text-white mb-4">MINT LICENSE KEYS</h2>
                <div className="flex gap-4 mb-4">
                    <input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={amount} 
                      onChange={(e) => setAmount(parseInt(e.target.value))}
                      className="bg-black border border-gray-700 p-2 text-white w-20 text-center rounded"
                    />
                    <button 
                      onClick={handleGenerate}
                      className={`flex-1 bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} font-bold rounded hover:bg-${theme.primary}/40 transition-all`}
                    >
                        GENERATE
                    </button>
                </div>
                <p className="text-xs text-gray-500">
                    These keys are cryptographically signed with your secret salt. 
                    Copy them and add them to your Gumroad/Stripe product delivery email.
                </p>
            </div>

            <div className="glass-panel p-6 rounded border border-gray-800 flex flex-col h-96">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl text-white">GENERATED KEYS ({generatedKeys.length})</h2>
                    <button onClick={() => setGeneratedKeys([])} className="text-xs text-red-500">CLEAR</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/50 p-2 rounded border border-gray-900 space-y-2">
                    {generatedKeys.map((k, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded hover:bg-white/10 group">
                            <span className={`text-${theme.accent} font-bold tracking-wider`}>{k}</span>
                            <button 
                              onClick={() => copyToClipboard(k)}
                              className="text-xs text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"
                            >
                                COPY
                            </button>
                        </div>
                    ))}
                    {generatedKeys.length === 0 && <div className="text-center text-gray-600 mt-10">NO KEYS GENERATED</div>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminKeyGen;
