
import React, { useState, useEffect, useRef } from 'react';
import { ThemeColors } from '../types';
import { playSound } from '../services/audioService';

interface DevToolsProps {
  theme: ThemeColors;
}

type Tab = 'CONSOLE' | 'NETWORK' | 'STORAGE' | 'SONIC' | 'CRYPTO' | 'SYS_MON';
type Language = 'JS' | 'PYTHON';

interface LogEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
}

interface Process {
    pid: number;
    name: string;
    cpu: number;
    mem: number;
    status: 'RUNNING' | 'SLEEPING' | 'ZOMBIE';
    user: 'root' | 'marco' | 'system';
}

const JS_SNIPPETS = [
  { 
    label: 'FIBONACCI SEQUENCE', 
    code: `// Generate Fibonacci Sequence
function fibonacci(n) {
  let sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence[i] = sequence[i - 1] + sequence[i - 2];
  }
  return sequence;
}
console.log("Generating first 10 numbers:");
console.log(fibonacci(10));` 
  },
  { 
    label: 'SYSTEM DIAGNOSTIC', 
    code: `// Run Mock Diagnostics
console.log("INITIATING SYSTEM SCAN...");
let progress = 0;
const interval = setInterval(() => {
   progress += 20;
   console.log("SCANNING SECTOR " + progress + "...");
   if (progress >= 100) {
      clearInterval(interval);
      console.log("SCAN COMPLETE. NO THREATS DETECTED.");
   }
}, 500);` 
  }
];

const PY_SNIPPETS = [
    {
        label: 'HELLO WORLD',
        code: `# Basic Python Test
name = "Master Waiz"
print("Hello " + name)
print("System is Online")`
    },
    {
        label: 'CALCULATOR',
        code: `# Simple Math
a = 10
b = 5
c = a * b
print("A is " + a)
print("B is " + b)
print("Result: " + c)`
    }
];

const DevTools: React.FC<DevToolsProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CONSOLE');
  const [activeLang, setActiveLang] = useState<Language>('JS');
  const [code, setCode] = useState('// MARCO KERNEL ACCESS\n// Enter JavaScript commands...\nconsole.log("System Ready. Awaiting input.");');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Storage State
  const [storageItems, setStorageItems] = useState<{key:string, value:string}[]>([]);

  // Sonic Generator State
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  const [volume, setVolume] = useState(0.1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Crypto State
  const [cryptoInput, setCryptoInput] = useState('');
  const [cryptoOutput, setCryptoOutput] = useState('');
  const [cryptoMode, setCryptoMode] = useState<'BASE64' | 'HEX' | 'BINARY' | 'MORSE'>('BASE64');

  // SysMon State
  const [processes, setProcesses] = useState<Process[]>([]);

  // Load Storage
  useEffect(() => {
      if (activeTab === 'STORAGE') {
          refreshStorage();
      }
      if (activeTab === 'SYS_MON') {
          initProcesses();
      }
  }, [activeTab]);

  useEffect(() => {
      // Toggle default code based on lang
      if (!isTyping) {
          if (activeLang === 'JS') {
              setCode('// MARCO KERNEL ACCESS\nconsole.log("JS Runtime Active");');
          } else {
              setCode('# MARCO PYTHON INTERPRETER (v1.0)\nprint("Python Runtime Active")');
          }
      }
  }, [activeLang]);

  // --- SYSTEM MONITOR LOGIC ---
  const initProcesses = () => {
      const names = ['kernel_task', 'neural_engine', 'audio_daemon', 'chrome_helper', 'docker_container', 'node_server', 'ssh_tunnel', 'gpu_renderer', 'marco_core', 'watchdog'];
      const newProcs: Process[] = names.map((name, i) => ({
          pid: 1000 + i + Math.floor(Math.random() * 500),
          name,
          cpu: Math.random() * 5,
          mem: Math.random() * 200,
          status: Math.random() > 0.8 ? 'SLEEPING' : 'RUNNING',
          user: i < 2 ? 'root' : 'marco'
      }));
      setProcesses(newProcs);
  };

  useEffect(() => {
      if (activeTab === 'SYS_MON') {
          const interval = setInterval(() => {
              setProcesses(prev => prev.map(p => ({
                  ...p,
                  cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 2),
                  mem: Math.max(10, p.mem + (Math.random() - 0.5) * 5)
              })));
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [activeTab]);

  const killProcess = (pid: number) => {
      setProcesses(prev => prev.filter(p => p.pid !== pid));
      playSound('alert');
  };

  // --- CRYPTO LOGIC ---
  useEffect(() => {
      if (!cryptoInput) { setCryptoOutput(''); return; }
      try {
          switch(cryptoMode) {
              case 'BASE64':
                  setCryptoOutput(btoa(cryptoInput));
                  break;
              case 'HEX':
                  setCryptoOutput(cryptoInput.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '));
                  break;
              case 'BINARY':
                  setCryptoOutput(cryptoInput.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '));
                  break;
              case 'MORSE':
                  const morseCode: Record<string, string> = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----', ' ': '/' };
                  setCryptoOutput(cryptoInput.toUpperCase().split('').map(c => morseCode[c] || c).join(' '));
                  break;
          }
      } catch (e) {
          setCryptoOutput("ENCODING_ERROR");
      }
  }, [cryptoInput, cryptoMode]);


  const refreshStorage = () => {
      const items = [];
      for(let i=0; i<localStorage.length; i++) {
          const key = localStorage.key(i);
          if(key) {
              items.push({ key, value: localStorage.getItem(key) || '' });
          }
      }
      setStorageItems(items);
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setLogs(prev => [...prev, { type, message, timestamp: time }]);
  };

  // --- PYTHON INTERPRETER (BASIC) ---
  const executePython = (code: string) => {
    addLog('info', '> EXEC_PYTHON_SCRIPT');
    const lines = code.split('\n');
    const variables: Record<string, any> = {};
    
    try {
        lines.forEach((line, idx) => {
            const l = line.trim();
            if (!l || l.startsWith('#')) return;

            if (l.startsWith('print(') && l.endsWith(')')) {
                const content = l.slice(6, -1);
                // Check if string literal
                if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
                    addLog('log', content.slice(1, -1));
                } else if (content.includes('+')) {
                    // String concatenation simulation
                    const parts = content.split('+').map(p => p.trim());
                    let result = '';
                    parts.forEach(p => {
                         if ((p.startsWith('"') && p.endsWith('"'))) result += p.slice(1, -1);
                         else if (variables.hasOwnProperty(p)) result += variables[p];
                         else result += p; // fallback
                    });
                    addLog('log', result);
                }
                else if (variables.hasOwnProperty(content)) {
                    addLog('log', String(variables[content]));
                } else {
                     // Try math eval
                    try {
                        let expr = content;
                        Object.keys(variables).forEach(v => {
                            expr = expr.replace(new RegExp(`\\b${v}\\b`, 'g'), variables[v]);
                        });
                        // eslint-disable-next-line no-eval
                        addLog('log', String(eval(expr)));
                    } catch(e) {
                        addLog('error', `Line ${idx+1}: NameError: name '${content}' is not defined`);
                    }
                }
            }
            else if (l.includes('=')) {
                const parts = l.split('=');
                const varName = parts[0].trim();
                let expr = parts[1].trim();
                
                // String assignment
                if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
                    variables[varName] = expr.slice(1, -1);
                } else {
                    // Numeric/Math assignment
                    try {
                         Object.keys(variables).forEach(v => {
                            expr = expr.replace(new RegExp(`\\b${v}\\b`, 'g'), variables[v]);
                         });
                         // eslint-disable-next-line no-eval
                         variables[varName] = eval(expr);
                    } catch(e) {
                         variables[varName] = expr; // Fallback store as string
                    }
                }
            }
        });
        addLog('success', '> PROCESS_EXIT_CODE_0');
    } catch(e: any) {
        addLog('error', `INTERPRETER_ERROR: ${e.message}`);
    }
  };

  const runCode = async () => {
    playSound('click');
    
    if (activeLang === 'PYTHON') {
        executePython(code);
        return;
    }

    addLog('info', '> EXEC_JS_SCRIPT');
    try {
      // Mock Console
      const mockConsole = {
        log: (...args: any[]) => addLog('log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args: any[]) => addLog('error', args.join(' ')),
        warn: (...args: any[]) => addLog('warn', args.join(' ')),
        info: (...args: any[]) => addLog('info', args.join(' ')),
      };

      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('console', 'window', 'document', 'localStorage', code);
      
      await fn(mockConsole, window, document, localStorage);
      addLog('success', '> PROCESS_EXIT_CODE_0');
    } catch (e: any) {
      addLog('error', `RUNTIME_ERR: ${e.message}`);
      playSound('alert');
    }
  };

  const marcoAutoCode = (snippetCode: string) => {
      if (isTyping) return;
      setIsTyping(true);
      setCode('');
      let i = 0;
      const interval = setInterval(() => {
          setCode(snippetCode.substring(0, i));
          i++;
          if (i > snippetCode.length) {
              clearInterval(interval);
              setIsTyping(false);
              playSound('success');
          }
      }, 5);
  };

  // --- SONIC GENERATOR LOGIC ---
  const toggleSonic = () => {
      if (isPlaying) stopSonic();
      else startSonic();
  };

  const startSonic = () => {
      if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(volume, ctx.currentTime);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
      setIsPlaying(true);
  };

  const stopSonic = () => {
      if (oscRef.current) {
          oscRef.current.stop();
          oscRef.current.disconnect();
          oscRef.current = null;
      }
      setIsPlaying(false);
  };

  useEffect(() => {
      if (isPlaying && oscRef.current && audioCtxRef.current && gainRef.current) {
          oscRef.current.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
          oscRef.current.type = waveType;
          gainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
      }
  }, [frequency, waveType, volume, isPlaying]);

  useEffect(() => {
      return () => stopSonic();
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black/40 backdrop-blur-md">
       {/* HEADER TABS */}
       <div className={`flex items-center border-b border-${theme.border} bg-black/60 overflow-x-auto scrollbar-hide`}>
          <div className={`px-4 py-3 font-mono font-bold text-${theme.primary} border-r border-${theme.border} flex items-center gap-2 whitespace-nowrap`}>
             <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             DEV_KERNEL
          </div>
          {(['CONSOLE', 'SYS_MON', 'CRYPTO', 'NETWORK', 'STORAGE', 'SONIC'] as Tab[]).map(tab => (
             <button
               key={tab}
               onClick={() => { setActiveTab(tab); playSound('click'); }}
               className={`px-4 py-3 text-xs font-mono font-bold transition-all border-r border-${theme.border} hover:bg-white/5 whitespace-nowrap
                  ${activeTab === tab ? `text-${theme.accent} bg-${theme.primary}/10 border-b-2 border-b-${theme.accent}` : 'text-gray-500'}
               `}
             >
                {tab}
             </button>
          ))}
       </div>

       {/* MAIN CONTENT AREA */}
       <div className="flex-1 overflow-hidden p-4 relative">
          
          {/* --- CONSOLE TAB --- */}
          {activeTab === 'CONSOLE' && (
             <div className="h-full flex flex-col gap-4">
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                    {/* EDITOR */}
                    <div className={`flex-[3] flex flex-col glass-panel rounded overflow-hidden border border-${theme.border}`}>
                        <div className="bg-black/60 p-2 text-[10px] text-gray-500 font-mono border-b border-gray-800 flex justify-between items-center">
                            <div className="flex gap-2 items-center">
                                <span>EDITOR //</span>
                                <div className="flex bg-black border border-gray-700 rounded overflow-hidden">
                                    <button 
                                      onClick={() => setActiveLang('JS')} 
                                      className={`px-2 py-0.5 ${activeLang === 'JS' ? `bg-${theme.primary} text-black` : 'text-gray-500 hover:text-white'}`}
                                    >JS</button>
                                    <button 
                                      onClick={() => setActiveLang('PYTHON')} 
                                      className={`px-2 py-0.5 ${activeLang === 'PYTHON' ? `bg-${theme.primary} text-black` : 'text-gray-500 hover:text-white'}`}
                                    >PY</button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="group relative">
                                    <button className={`text-${theme.accent} hover:text-white flex items-center gap-1`}>
                                        MARCO_ASSIST <span className="text-[8px]">▼</span>
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-gray-700 rounded shadow-xl hidden group-hover:block z-50">
                                        {(activeLang === 'JS' ? JS_SNIPPETS : PY_SNIPPETS).map(snip => (
                                            <button 
                                                key={snip.label}
                                                onClick={() => marcoAutoCode(snip.code)}
                                                className="block w-full text-left px-3 py-2 text-[10px] text-gray-300 hover:bg-white/10"
                                            >
                                                {snip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => setCode('')} className="text-red-500 hover:text-red-400">CLEAR</button>
                            </div>
                        </div>
                        <textarea 
                           value={code}
                           onChange={(e) => setCode(e.target.value)}
                           disabled={isTyping}
                           className="flex-1 bg-[#0d1117] text-gray-300 font-mono text-xs p-4 outline-none resize-none leading-relaxed"
                           spellCheck={false}
                        />
                        <div className="bg-black/60 p-2 border-t border-gray-800 flex justify-end">
                            <button 
                                onClick={runCode}
                                className={`px-4 py-1 bg-${theme.primary} text-black font-bold font-mono text-xs rounded hover:opacity-90`}
                            >
                                EXECUTE_RUN
                            </button>
                        </div>
                    </div>

                    {/* LOGS */}
                    <div className={`flex-[2] flex flex-col glass-panel rounded overflow-hidden border border-${theme.border}`}>
                        <div className="bg-black/60 p-2 text-[10px] text-gray-500 font-mono border-b border-gray-800 flex justify-between">
                            <span>TERMINAL_OUTPUT</span>
                            <button onClick={() => setLogs([])} className="text-gray-500 hover:text-white">CLEAR</button>
                        </div>
                        <div className="flex-1 bg-black p-2 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar">
                             {logs.length === 0 && <div className="text-gray-700 italic opacity-50 p-2">Waiting for output stream...</div>}
                             {logs.map((log, i) => (
                                 <div key={i} className={`flex gap-2 border-b border-white/5 pb-1 last:border-0 animate-fade-in`}>
                                     <span className="text-gray-600 select-none">[{log.timestamp}]</span>
                                     <span className={`
                                        break-all
                                        ${log.type === 'error' ? 'text-red-500' : ''}
                                        ${log.type === 'warn' ? 'text-yellow-500' : ''}
                                        ${log.type === 'success' ? 'text-green-500' : ''}
                                        ${log.type === 'info' ? 'text-blue-400' : ''}
                                        ${log.type === 'log' ? 'text-gray-300' : ''}
                                     `}>
                                         {log.type === 'error' && '✖ '}
                                         {log.type === 'success' && '✔ '}
                                         {log.message}
                                     </span>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
             </div>
          )}

          {/* --- SYSTEM MONITOR TAB --- */}
          {activeTab === 'SYS_MON' && (
              <div className="h-full flex flex-col glass-panel rounded border border-gray-800">
                  <div className="p-3 bg-black/60 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="text-xs font-mono text-gray-400 font-bold">ACTIVE_PROCESSES (PID)</h3>
                      <div className={`text-xs text-${theme.primary} animate-pulse`}>MONITORING ACTIVE</div>
                  </div>
                  <div className="flex-1 overflow-auto p-0 custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-black/40 sticky top-0 z-10">
                              <tr className="text-[10px] text-gray-500 font-mono border-b border-gray-800">
                                  <th className="p-3">PID</th>
                                  <th className="p-3">NAME</th>
                                  <th className="p-3">USER</th>
                                  <th className="p-3">CPU%</th>
                                  <th className="p-3">MEM (MB)</th>
                                  <th className="p-3">STATUS</th>
                                  <th className="p-3 text-right">ACTION</th>
                              </tr>
                          </thead>
                          <tbody className="font-mono text-xs">
                              {processes.map(proc => (
                                  <tr key={proc.pid} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                      <td className="p-3 text-gray-500">{proc.pid}</td>
                                      <td className={`p-3 text-${theme.accent} font-bold`}>{proc.name}</td>
                                      <td className="p-3 text-gray-400">{proc.user}</td>
                                      <td className={`p-3 ${proc.cpu > 4 ? 'text-red-500' : 'text-green-500'}`}>{proc.cpu.toFixed(1)}%</td>
                                      <td className="p-3 text-gray-400">{proc.mem.toFixed(1)}</td>
                                      <td className="p-3">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${proc.status === 'RUNNING' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                                              {proc.status}
                                          </span>
                                      </td>
                                      <td className="p-3 text-right">
                                          <button 
                                            onClick={() => killProcess(proc.pid)}
                                            className="text-red-500 hover:text-white hover:bg-red-900/50 px-2 py-1 rounded text-[10px] border border-red-900"
                                          >
                                              KILL
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* --- CRYPTO TAB --- */}
          {activeTab === 'CRYPTO' && (
              <div className="h-full flex items-center justify-center p-4">
                  <div className={`w-full max-w-3xl glass-panel p-6 rounded border border-${theme.primary} flex flex-col gap-6`}>
                      <h2 className={`text-xl font-mono font-bold text-${theme.accent} border-b border-gray-800 pb-2`}>
                          CRYPTOGRAPHIC_MODULE
                      </h2>
                      
                      <div className="grid grid-cols-4 gap-2">
                          {(['BASE64', 'HEX', 'BINARY', 'MORSE'] as const).map(m => (
                              <button
                                key={m}
                                onClick={() => setCryptoMode(m)}
                                className={`py-2 text-xs font-bold border rounded transition-all
                                   ${cryptoMode === m ? `bg-${theme.primary}/20 border-${theme.primary} text-${theme.primary}` : 'border-gray-700 text-gray-500'}
                                `}
                              >
                                  {m}
                              </button>
                          ))}
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row">
                          <div className="flex-1 space-y-2">
                              <label className="text-[10px] text-gray-500 font-mono">INPUT_TEXT</label>
                              <textarea 
                                 value={cryptoInput}
                                 onChange={(e) => setCryptoInput(e.target.value)}
                                 placeholder="Enter data to encode..."
                                 className="w-full h-40 bg-black/60 border border-gray-700 p-3 text-sm text-white font-mono rounded outline-none focus:border-white/50 resize-none"
                              />
                          </div>
                          <div className="flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-600 md:-rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                          </div>
                          <div className="flex-1 space-y-2">
                              <label className="text-[10px] text-gray-500 font-mono">OUTPUT_HASH</label>
                              <textarea 
                                 readOnly
                                 value={cryptoOutput}
                                 placeholder="Encoded output..."
                                 className={`w-full h-40 bg-black/80 border border-${theme.primary} p-3 text-sm text-${theme.primary} font-mono rounded outline-none resize-none`}
                              />
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- SONIC TAB --- */}
          {activeTab === 'SONIC' && (
              <div className="h-full flex items-center justify-center p-4">
                  <div className={`w-full max-w-2xl glass-panel p-8 rounded border border-${theme.primary} relative overflow-hidden`}>
                      <div className={`absolute top-0 left-0 w-full h-1 bg-${theme.primary} animate-pulse`}></div>
                      
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                          <div className="flex-1 w-full space-y-6">
                              <h2 className={`text-2xl font-mono font-bold text-${theme.accent} mb-4`}>OSCILLATOR_V2</h2>
                              
                              <div>
                                  <label className="text-xs text-gray-500 font-mono flex justify-between">
                                      <span>FREQUENCY</span> <span className={`text-${theme.primary}`}>{frequency} Hz</span>
                                  </label>
                                  <input 
                                    type="range" min="20" max="1000" value={frequency} 
                                    onChange={(e) => setFrequency(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer mt-2 accent-cyan-500"
                                  />
                              </div>

                              <div>
                                  <label className="text-xs text-gray-500 font-mono flex justify-between">
                                      <span>GAIN / VOLUME</span> <span className={`text-${theme.primary}`}>{Math.round(volume * 100)}%</span>
                                  </label>
                                  <input 
                                    type="range" min="0" max="0.5" step="0.01" value={volume} 
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer mt-2 accent-cyan-500"
                                  />
                              </div>

                              <div className="grid grid-cols-4 gap-2">
                                  {(['sine', 'square', 'sawtooth', 'triangle'] as const).map(w => (
                                      <button 
                                        key={w} 
                                        onClick={() => setWaveType(w)}
                                        className={`py-2 text-[10px] uppercase font-bold border rounded transition-all
                                            ${waveType === w ? `bg-${theme.primary} text-black border-${theme.primary}` : 'bg-transparent text-gray-500 border-gray-700'}
                                        `}
                                      >
                                          {w}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex items-center justify-center">
                              <button 
                                onClick={toggleSonic}
                                className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 relative group
                                   ${isPlaying ? 'border-red-500 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : `border-${theme.primary} text-${theme.primary} hover:bg-${theme.primary}/10`}
                                `}
                              >
                                  <span className="text-3xl font-black">{isPlaying ? 'STOP' : 'PLAY'}</span>
                                  <span className="text-xs font-mono mt-1 opacity-70">{isPlaying ? 'EMITTING' : 'STANDBY'}</span>
                                  
                                  {/* Visual Rings */}
                                  {isPlaying && (
                                      <>
                                        <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20"></div>
                                        <div className="absolute -inset-4 rounded-full border border-red-500 animate-pulse opacity-10"></div>
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- STORAGE TAB --- */}
          {activeTab === 'STORAGE' && (
              <div className="h-full flex flex-col glass-panel rounded border border-gray-800">
                  <div className="p-3 bg-black/60 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="text-xs font-mono text-gray-400 font-bold">LOCAL_STORAGE_DUMP</h3>
                      <button onClick={refreshStorage} className={`text-xs text-${theme.primary} hover:underline`}>REFRESH</button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="text-[10px] text-gray-500 font-mono border-b border-gray-800">
                                  <th className="p-2 w-1/4">KEY</th>
                                  <th className="p-2">VALUE</th>
                                  <th className="p-2 w-16">ACTION</th>
                              </tr>
                          </thead>
                          <tbody className="font-mono text-xs">
                              {storageItems.map(item => (
                                  <tr key={item.key} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                      <td className={`p-2 text-${theme.accent} font-bold break-all`}>{item.key}</td>
                                      <td className="p-2 text-gray-400 break-all font-light opacity-80 max-w-xs truncate">{item.value.substring(0, 100)}{item.value.length > 100 ? '...' : ''}</td>
                                      <td className="p-2 text-center">
                                          <button 
                                            onClick={() => {
                                                if(confirm('Delete this key?')) {
                                                    localStorage.removeItem(item.key);
                                                    refreshStorage();
                                                }
                                            }}
                                            className="text-red-500 hover:text-white"
                                          >
                                              &times;
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {storageItems.length === 0 && (
                                  <tr><td colSpan={3} className="p-4 text-center text-gray-600 italic">Storage is empty</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-3 bg-black/60 border-t border-gray-800 text-right">
                      <button 
                         onClick={() => {
                             if(confirm('WARNING: THIS WILL WIPE ALL APP DATA. CONTINUE?')) {
                                 localStorage.clear();
                                 window.location.reload();
                             }
                         }}
                         className="px-3 py-1 bg-red-900/30 border border-red-900 text-red-500 text-xs rounded hover:bg-red-900/50"
                      >
                          NUKE_STORAGE
                      </button>
                  </div>
              </div>
          )}

          {/* --- NETWORK TAB --- */}
          {activeTab === 'NETWORK' && (
              <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                      <div className={`text-6xl text-${theme.primary} animate-pulse`}>
                          <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <h2 className="text-xl font-mono text-gray-300">NETWORK MONITOR ACTIVE</h2>
                      <p className="text-xs text-gray-500 font-mono max-w-md mx-auto">
                          Traffic analysis module running in background. No suspicious packets detected. 
                          Connection secure via TLS 1.3.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm mx-auto">
                          <div className="p-4 border border-gray-800 rounded bg-black/40">
                              <div className="text-[10px] text-gray-500">LATENCY</div>
                              <div className="text-2xl text-green-500 font-mono">24ms</div>
                          </div>
                          <div className="p-4 border border-gray-800 rounded bg-black/40">
                              <div className="text-[10px] text-gray-500">PACKETS</div>
                              <div className="text-2xl text-blue-500 font-mono">14.2k</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

       </div>
    </div>
  );
};

export default DevTools;
