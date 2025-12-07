
import React, { useState } from 'react';
import { ThemeColors } from '../types';
import { playSound } from '../services/audioService';
import { validateLicenseKey } from '../services/cryptoService';

interface LicenseGateProps {
  theme: ThemeColors;
  onSuccess: (key: string) => void;
  onDevLogin?: () => void; // Kept for interface compatibility but unused in UI
}

const LicenseGate: React.FC<LicenseGateProps> = ({ theme, onSuccess }) => {
  const [key, setKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!key.trim()) return;

    setIsValidating(true);
    playSound('click');
    setError('');

    // Simulate Network Delay for realism
    setTimeout(async () => {
        const cleanKey = key.trim().toUpperCase();
        
        // Cryptographic Validation
        const isValid = await validateLicenseKey(cleanKey);

        if (isValid) {
            playSound('success');
            onSuccess(cleanKey);
        } else {
            setIsValidating(false);
            setError('INVALID LICENSE KEY. CHECKSUM FAILED.');
            playSound('alert');
        }
    }, 1500);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black relative overflow-hidden font-mono">
       {/* Background Grid */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: `linear-gradient(#${theme.primary.replace('text-','')} 1px, transparent 1px), linear-gradient(90deg, #${theme.primary.replace('text-','')} 1px, transparent 1px)`, backgroundSize: '50px 50px' }}>
       </div>

       <div className={`z-10 w-full max-w-md p-8 border border-${theme.primary} bg-black/80 backdrop-blur-xl rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center relative`}>
           <div className={`w-20 h-20 mx-auto mb-6 border-2 border-${theme.primary} rounded-full flex items-center justify-center animate-pulse`}>
                <svg className={`w-10 h-10 text-${theme.primary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
           </div>

           <h1 className={`text-2xl font-black text-${theme.primary} mb-2 tracking-widest font-orbitron`}>MARCO OS</h1>
           <p className="text-gray-500 text-xs mb-8">PRODUCT ACTIVATION REQUIRED</p>

           <form onSubmit={handleValidate} className="space-y-4">
               <div className="relative">
                   <input 
                     type="text" 
                     value={key}
                     onChange={(e) => setKey(e.target.value.toUpperCase())}
                     placeholder="XXXX-XXXX-XXXX-XXXX"
                     disabled={isValidating}
                     className={`w-full bg-gray-900 border border-gray-700 p-4 text-center text-white tracking-[0.1em] font-bold rounded focus:border-${theme.primary} outline-none transition-all placeholder-gray-600`}
                   />
                   {isValidating && (
                       <div className={`absolute top-0 right-0 h-full w-full bg-black/50 flex items-center justify-center`}>
                           <div className={`w-6 h-6 border-2 border-${theme.primary} border-t-transparent rounded-full animate-spin`}></div>
                       </div>
                   )}
               </div>

               {error && <div className="text-red-500 text-xs animate-pulse font-bold">{error}</div>}

               <button 
                 type="submit" 
                 disabled={isValidating}
                 className={`w-full py-4 bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} font-bold tracking-widest hover:bg-${theme.primary}/40 transition-all rounded uppercase`}
               >
                   {isValidating ? 'VERIFYING KEY...' : 'ACTIVATE'}
               </button>
           </form>

           <div className="mt-6 text-[9px] text-gray-600">
               <p>ONE-TIME ACTIVATION. PERMANENT DEVICE LINK.</p>
               <p className="mt-1">ENTER THE KEY PROVIDED IN YOUR PURCHASE EMAIL.</p>
           </div>
       </div>
    </div>
  );
};

export default LicenseGate;
