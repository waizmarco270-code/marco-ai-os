
import React, { useState, useEffect } from 'react';
import { ThemeColors, NoFapState } from '../types';
import { M_RANKS, M_QUOTES } from '../constants';
import { playSound } from '../services/audioService';

interface MTrackerProps {
  theme: ThemeColors;
  data: NoFapState;
  onUpdate: (data: NoFapState) => void;
  onBack: () => void;
  soundEnabled: boolean;
}

const PANIC_INSTRUCTIONS = [
    "DROP AND DO 20 PUSHUPS NOW!",
    "TAKE A COLD SHOWER IMMEDIATELY.",
    "WALK OUTSIDE. BREATHE FRESH AIR.",
    "CALL A FRIEND OR FAMILY MEMBER.",
    "CLOSE YOUR EYES. VISUALIZE SUCCESS.",
    "READ YOUR GOALS OUT LOUD.",
    "DRINK A LARGE GLASS OF WATER."
];

const REGRET_MESSAGES = [
    "SYSTEM INTEGRITY COMPROMISED.",
    "WHY DID YOU DO IT?",
    "WAS IT WORTH THE MOMENT?",
    "DISCIPLINE PROTOCOLS FAILED.",
    "WEAKNESS DETECTED.",
    "RESETTING CORE SYSTEMS..."
];

const MOTIVATION_MESSAGES = [
    "FAILURE IS NOT THE END.",
    "WE LEARN. WE ADAPT. WE RISE.",
    "REBOOTING WILLPOWER...",
    "NEW OBJECTIVE: SURPASS LIMITS.",
    "DAY 1 BEGINS NOW."
];

const MTracker: React.FC<MTrackerProps> = ({ theme, data, onUpdate, onBack, soundEnabled }) => {
  const [timeClean, setTimeClean] = useState<{ d: number, h: number, m: number, s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [quote, setQuote] = useState(M_QUOTES[0]);
  const [rank, setRank] = useState(M_RANKS[0]);
  
  // Panic Mode State
  const [panicMode, setPanicMode] = useState(false);
  const [panicInstruction, setPanicInstruction] = useState(PANIC_INSTRUCTIONS[0]);
  const [panicTimer, setPanicTimer] = useState(0);

  // Relapse Protocol State
  const [relapseStage, setRelapseStage] = useState<'IDLE' | 'REGRET' | 'MOTIVATION'>('IDLE');
  const [protocolMessage, setProtocolMessage] = useState('');

  // Urge Surfer State
  const [isSurfing, setIsSurfing] = useState(false);
  const [surfTimer, setSurfTimer] = useState(600); // 10 minutes

  // View Toggle
  const [view, setView] = useState<'DASHBOARD' | 'ROADMAP' | 'ANALYTICS'>('DASHBOARD');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const lastRelapse = data.lastRelapseDate || now; // Fallback if missing
      const diff = Math.max(0, now - lastRelapse);
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeClean({ d, h, m, s });

      // Determine Rank
      const currentRank = [...M_RANKS].reverse().find(r => d >= r.days) || M_RANKS[0];
      setRank(currentRank);
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    setQuote(M_QUOTES[Math.floor(Math.random() * M_QUOTES.length)]);

    return () => clearInterval(timer);
  }, [data.lastRelapseDate]);

  // Panic Mode Interval
  useEffect(() => {
      let interval: any;
      if (panicMode) {
          setPanicTimer(60); // 60s countdown
          interval = setInterval(() => {
             setPanicInstruction(PANIC_INSTRUCTIONS[Math.floor(Math.random() * PANIC_INSTRUCTIONS.length)]);
             setPanicTimer(prev => {
                 if (prev <= 1) {
                     setPanicMode(false);
                     return 0;
                 }
                 return prev - 1;
             });
             if (soundEnabled && Math.random() > 0.8) playSound('alert');
          }, 2000);
      }
      return () => clearInterval(interval);
  }, [panicMode, soundEnabled]);

  // Urge Surfer Interval
  useEffect(() => {
      let interval: any;
      if (isSurfing && surfTimer > 0) {
          interval = setInterval(() => {
              setSurfTimer(prev => prev - 1);
          }, 1000);
      } else if (surfTimer === 0 && isSurfing) {
          setIsSurfing(false);
          if (soundEnabled) playSound('success');
          alert("URGE DEFEATED. WILLPOWER INCREASED.");
          setSurfTimer(600);
      }
      return () => clearInterval(interval);
  }, [isSurfing, surfTimer, soundEnabled]);

  const triggerRelapseProtocol = (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      
      // Removed window.confirm to ensure immediate reaction on click
      
      // Start Sequence
      setRelapseStage('REGRET');
      if (soundEnabled) playSound('alert');

      // Sequence Logic
      let step = 0;
      
      // Phase 1: Regret (0-4 seconds)
      const regretInterval = setInterval(() => {
          setProtocolMessage(REGRET_MESSAGES[step % REGRET_MESSAGES.length]);
          if(soundEnabled) playSound('click');
          step++;
      }, 800);

      // Phase 2: Transition to Motivation (at 4s)
      setTimeout(() => {
          clearInterval(regretInterval);
          setRelapseStage('MOTIVATION');
          if (soundEnabled) playSound('startup');
          
          step = 0;
          const motivationInterval = setInterval(() => {
               setProtocolMessage(MOTIVATION_MESSAGES[step % MOTIVATION_MESSAGES.length]);
               step++;
          }, 800);

          // Phase 3: Actual Reset (at 8s)
          setTimeout(() => {
              clearInterval(motivationInterval);
              performReset();
              setRelapseStage('IDLE');
          }, 4000);

      }, 4000);
  };

  const performReset = () => {
    const now = Date.now();
    // Safely spread history, fallback to empty array if undefined
    const prevHistory = Array.isArray(data.history) ? data.history : [];
    const lastRelapse = data.lastRelapseDate || now;
    const streakHours = Math.floor((now - lastRelapse) / (1000 * 60 * 60));
    const newBest = Math.max(data.bestStreakHours || 0, streakHours);

    const newData: NoFapState = {
        ...data,
        lastRelapseDate: now,
        currentStreakHours: 0,
        bestStreakHours: newBest,
        history: [...prevHistory, { date: now, streakHours }],
        status: 'RELAPSED'
    };
    
    // Immediate visual reset
    setTimeClean({ d: 0, h: 0, m: 0, s: 0 });
    setRank(M_RANKS[0]);

    // Update Storage
    onUpdate(newData);
    if(soundEnabled) playSound('success');
  };

  const handlePanic = () => {
      setPanicMode(true);
      if (soundEnabled) playSound('alert');
  };

  const toggleSurfer = () => {
      if (isSurfing) {
          setIsSurfing(false);
          setSurfTimer(600);
      } else {
          setIsSurfing(true);
          if (soundEnabled) playSound('click');
      }
  };

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month); // 0 = Sun
      const today = new Date();
      
      const days = [];
      // Empty slots for start of month
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-10 md:h-14 bg-transparent"></div>);
      }

      // History processing
      const history = Array.isArray(data.history) ? data.history : [];
      
      let successCount = 0;
      let totalPassedDays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const isToday = date.toDateString() === today.toDateString();
          const isFuture = date > today;
          
          // Check for relapse on this specific day
          const startOfDay = new Date(year, month, day, 0, 0, 0).getTime();
          const endOfDay = new Date(year, month, day, 23, 59, 59).getTime();
          
          const hasRelapse = history.some(entry => entry.date >= startOfDay && entry.date <= endOfDay);
          const isClean = !hasRelapse && !isFuture;

          if (!isFuture) {
              totalPassedDays++;
              if (isClean) successCount++;
          }

          let bgClass = 'bg-gray-800/30 border-gray-800';
          let textClass = 'text-gray-500';
          let statusIcon = null;

          if (isFuture) {
              bgClass = 'bg-transparent border-gray-900 opacity-30';
              textClass = 'text-gray-700';
          } else if (hasRelapse) {
              bgClass = 'bg-red-900/20 border-red-900';
              textClass = 'text-red-500 font-bold';
              statusIcon = (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              );
          } else if (isToday) {
              bgClass = `bg-${theme.primary}/20 border-${theme.primary} animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.2)]`;
              textClass = `text-${theme.primary} font-bold`;
          } else {
              // Past clean day
              bgClass = 'bg-green-900/20 border-green-900';
              textClass = 'text-green-500';
              statusIcon = (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
              );
          }

          days.push(
              <div key={day} className={`relative h-10 md:h-14 border rounded flex items-start justify-start p-1 ${bgClass} transition-all hover:bg-opacity-40`}>
                  <span className={`text-[10px] md:text-xs font-mono ${textClass}`}>{day}</span>
                  {statusIcon}
                  {isToday && <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-${theme.accent}`}></div>}
              </div>
          );
      }

      const successRate = totalPassedDays > 0 ? Math.round((successCount / totalPassedDays) * 100) : 100;

      return (
          <div className="w-full animate-fade-in">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-gray-400 hover:text-white">&lt; PREV</button>
                  <div className="text-center">
                      <h3 className={`text-lg font-bold text-${theme.primary} font-orbitron`}>
                          {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                      </h3>
                      <div className="text-[10px] text-gray-500 font-mono">
                          SUCCESS RATE: <span className={successRate >= 80 ? 'text-green-500' : (successRate >= 50 ? 'text-yellow-500' : 'text-red-500')}>{successRate}%</span>
                      </div>
                  </div>
                  <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-gray-400 hover:text-white">NEXT &gt;</button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center">
                  {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                      <div key={d} className="text-[9px] text-gray-600 font-mono">{d}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {days}
              </div>
          </div>
      );
  };

  // Visualization vars
  const circumference = 2 * Math.PI * 120;
  const nextRank = M_RANKS.find(r => r.days > timeClean.d) || { days: timeClean.d + 100, title: 'LEGEND', color: 'cyan-500' };
  const prevRank = [...M_RANKS].reverse().find(r => r.days <= timeClean.d) || M_RANKS[0];
  
  const totalDaysInRank = nextRank.days - prevRank.days;
  const daysPassedInRank = timeClean.d - prevRank.days;
  const progressPercent = Math.min(1, Math.max(0, daysPassedInRank / (totalDaysInRank || 1)));
  const dashoffset = circumference - (progressPercent * circumference);

  return (
    <div className={`relative h-full w-full flex flex-col p-4 md:p-6 overflow-hidden ${panicMode ? 'bg-red-950 animate-pulse' : ''}`}>
      
      {/* RELAPSE PROTOCOL OVERLAYS */}
      {relapseStage === 'REGRET' && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 animate-fade-in">
              <div className="absolute inset-0 bg-red-900/20 animate-pulse"></div>
              <h1 className="text-4xl md:text-6xl font-black text-red-600 mb-4 tracking-widest text-center animate-bounce glitch-text">
                  SYSTEM FAILURE
              </h1>
              <p className="text-xl font-mono text-red-400 animate-pulse text-center">
                  {protocolMessage || "BREACH DETECTED"}
              </p>
          </div>
      )}

      {relapseStage === 'MOTIVATION' && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-fade-in duration-1000">
              <div className="absolute inset-0 bg-cyan-500/10"></div>
              <h1 className="text-4xl md:text-6xl font-black text-black mb-4 tracking-widest text-center animate-fade-in-up">
                  REBOOTING...
              </h1>
              <p className="text-xl font-mono text-gray-800 font-bold text-center">
                  {protocolMessage}
              </p>
              <div className="mt-8 w-24 h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-black animate-progress-indeterminate"></div>
              </div>
          </div>
      )}

      {/* PANIC MODE OVERLAY */}
      {panicMode && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-center p-8 animate-fade-in">
             <h1 className="text-6xl md:text-8xl font-black text-red-600 animate-bounce mb-8 tracking-tighter">STOP</h1>
             <div className="text-2xl md:text-4xl font-bold text-white mb-8 border-y-4 border-red-600 py-4 w-full animate-pulse">
                 {panicInstruction}
             </div>
             <div className="text-xl font-mono text-red-400 mb-8">
                 HOLD FAST: {panicTimer}s
             </div>
             <button 
                onClick={() => setPanicMode(false)}
                className="px-8 py-3 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 font-mono text-xs"
             >
                 I AM IN CONTROL
             </button>
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className={`p-2 rounded hover:bg-${theme.primary}/20 text-${theme.primary}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
                <h2 className={`text-xl md:text-2xl font-bold tracking-widest text-${theme.primary} font-orbitron`}>M-TRACKER</h2>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest">DISCIPLINE PROTOCOL // v3.1</div>
            </div>
        </div>
        <div className="flex gap-1 md:gap-2">
            {[
                { id: 'DASHBOARD', label: 'DASH' },
                { id: 'ANALYTICS', label: 'CALENDAR' },
                { id: 'ROADMAP', label: 'MAP' }
            ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setView(tab.id as any)}
                    className={`px-2 md:px-3 py-1 rounded border text-[10px] md:text-xs font-bold tracking-widest font-mono transition-colors
                        ${view === tab.id ? `bg-${theme.primary}/20 border-${theme.primary} text-${theme.primary}` : 'border-gray-700 text-gray-500'}
                    `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
      
      {view === 'DASHBOARD' && (
        <div className="animate-fade-in">
            {/* Main Stats Circle */}
            <div className="flex flex-col items-center justify-center relative mb-8 min-h-[300px]">
                <div className="relative w-72 h-72 flex items-center justify-center">
                    {/* Urge Surfer Overlay */}
                    {isSurfing && (
                        <div className="absolute inset-0 z-20 bg-black/80 rounded-full flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in">
                             <div className="text-4xl font-black text-blue-500 animate-pulse">
                                 {Math.floor(surfTimer / 60)}:{(surfTimer % 60).toString().padStart(2, '0')}
                             </div>
                             <div className="text-xs text-blue-300 font-mono mt-2 tracking-widest">URGE SURFING</div>
                             <div className="text-[9px] text-gray-500 mt-1 max-w-[150px] text-center">THIS FEELING IS TEMPORARY. OBSERVE IT PASS.</div>
                        </div>
                    )}

                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 260 260">
                        {/* Background Track */}
                        <circle cx="130" cy="130" r="120" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                        {/* Progress Arc */}
                        <circle 
                            cx="130" cy="130" r="120" 
                            stroke={theme.primary === 'red-600' ? '#ef4444' : (theme.primary === 'cyan-500' ? '#06b6d4' : '#22c55e')}
                            strokeWidth="8" 
                            fill="none" 
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    
                    <div className="text-center z-10 flex flex-col items-center">
                        <div className={`text-xs font-bold tracking-[0.2em] mb-2 text-${rank.color} bg-${rank.color}/10 px-2 py-0.5 rounded border border-${rank.color}/20`}>
                             {rank.title}
                        </div>
                        <div className="text-7xl font-black font-mono text-white leading-none tracking-tighter shadow-black drop-shadow-lg">{timeClean.d}</div>
                        <div className="text-xs font-bold tracking-[0.3em] text-gray-500 mt-1 mb-4">DAYS CLEAN</div>
                        <div className="font-mono text-xl text-gray-300 bg-black/40 px-3 py-1 rounded border border-gray-800">
                            {timeClean.h.toString().padStart(2, '0')}:{timeClean.m.toString().padStart(2, '0')}:{timeClean.s.toString().padStart(2, '0')}
                        </div>
                    </div>
                    
                    {/* Ambient Glow */}
                    <div className={`absolute inset-0 rounded-full bg-${theme.primary} blur-[80px] opacity-10 pointer-events-none`}></div>
                </div>

                <div className="mt-6 text-center max-w-lg mx-auto px-4">
                    <p className="text-sm md:text-base italic text-gray-400 font-light font-serif">"{quote}"</p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto w-full mb-8">
                <button 
                    onClick={handlePanic}
                    className="col-span-1 bg-red-600/10 border border-red-600/50 hover:bg-red-600 hover:text-white text-red-500 font-bold py-3 rounded transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                >
                    <span className="text-sm tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        PANIC
                    </span>
                    <span className="text-[9px] font-mono opacity-60 group-hover:opacity-100">EMERGENCY ASSIST</span>
                </button>

                <button 
                    onClick={toggleSurfer}
                    className="col-span-1 bg-blue-600/10 border border-blue-600/50 hover:bg-blue-600 hover:text-white text-blue-500 font-bold py-3 rounded transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                >
                     <span className="text-sm tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        URGE SURFER
                    </span>
                    <span className="text-[9px] font-mono opacity-60 group-hover:opacity-100">10 MIN TIMER</span>
                </button>
                
                <button 
                    onClick={triggerRelapseProtocol}
                    className="col-span-2 bg-transparent border border-gray-800 hover:border-yellow-500 hover:text-yellow-500 text-gray-600 font-mono py-3 rounded transition-all text-xs tracking-widest flex items-center justify-center gap-2 group"
                >
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    I BROKE IT
                </button>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto w-full text-center">
                 <div className="glass-panel p-2 rounded">
                    <div className="text-[9px] text-gray-500 font-mono">BEST RUN</div>
                    <div className="text-xl font-bold text-gray-300">{Math.floor((data.bestStreakHours || 0) / 24)}D</div>
                 </div>
                 <div className="glass-panel p-2 rounded">
                    <div className="text-[9px] text-gray-500 font-mono">RELAPSES</div>
                    <div className="text-xl font-bold text-gray-300">{data.history.length}</div>
                 </div>
                 <div className="glass-panel p-2 rounded">
                    <div className="text-[9px] text-gray-500 font-mono">NEXT GOAL</div>
                    <div className="text-xl font-bold text-gray-300">{nextRank.days}D</div>
                 </div>
            </div>
        </div>
      )}

      {view === 'ANALYTICS' && renderCalendar()}

      {view === 'ROADMAP' && (
          <div className="space-y-4 max-w-2xl mx-auto w-full animate-fade-in">
              {M_RANKS.map((r, i) => {
                  const unlocked = timeClean.d >= r.days;
                  const current = rank.title === r.title;
                  return (
                      <div key={r.title} className={`relative flex items-center p-4 rounded border transition-all
                          ${current ? `bg-${r.color}/20 border-${r.color} shadow-[0_0_15px_rgba(0,0,0,0.5)]` : (unlocked ? 'bg-gray-800/40 border-gray-700' : 'bg-transparent border-gray-900 opacity-50')}
                      `}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mr-4 font-bold text-lg
                             ${unlocked ? `border-${r.color} text-${r.color}` : 'border-gray-700 text-gray-700'}
                          `}>
                              {unlocked ? '✓' : i + 1}
                          </div>
                          <div className="flex-1">
                              <h4 className={`text-lg font-bold tracking-widest ${unlocked ? `text-${r.color}` : 'text-gray-600'}`}>{r.title}</h4>
                              <p className="text-xs font-mono text-gray-500">{r.days} DAYS REQUIRED</p>
                          </div>
                          {current && <div className={`text-xs font-bold text-${r.color} font-mono animate-pulse`}>CURRENT RANK</div>}
                      </div>
                  );
              })}
          </div>
      )}

      </div>
    </div>
  );
};

export default MTracker;
