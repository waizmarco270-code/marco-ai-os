import React, { useState, useEffect, useRef } from 'react';
import { ThemeColors, TodoItem, Alarm, FocusState } from '../types';
import { getTodos, saveTodo, deleteTodo, saveAlarm, deleteAlarm, getAlarms, getScratchpad, saveScratchpad } from '../services/storageService';
import { playSound } from '../services/audioService';

interface DashboardProps {
  theme: ThemeColors;
  soundEnabled: boolean;
  focusMode: FocusState;
  onToggleFocus: (minutes?: number) => void;
}

interface WeatherState {
  temp: number | null;
  condition: string;
  location: string;
  loading: boolean;
  error: boolean;
}

// --- CSS FOR MARQUEE ---
const MarqueeStyles = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee-infinite {
  display: flex;
  width: max-content;
  animation: marquee 60s linear infinite;
}
.animate-marquee-infinite:hover {
  animation-play-state: paused;
}
`;

// --- HELPER FOR CANVAS COLORS ---
const getColor = (twClass: string | undefined) => {
    if (!twClass) return '#ffffff';
    if (twClass.includes('cyan')) return '#06b6d4';
    if (twClass.includes('blue')) return '#3b82f6';
    if (twClass.includes('red')) return '#ef4444';
    if (twClass.includes('green')) return '#22c55e';
    if (twClass.includes('emerald')) return '#10b981';
    if (twClass.includes('fuchsia')) return '#d946ef';
    if (twClass.includes('purple')) return '#a855f7';
    if (twClass.includes('pink')) return '#ec4899';
    if (twClass.includes('slate')) return '#94a3b8';
    if (twClass.includes('neutral')) return '#a3a3a3';
    if (twClass.includes('yellow')) return '#eab308';
    if (twClass.includes('orange')) return '#f97316';
    if (twClass.includes('teal')) return '#14b8a6';
    if (twClass.includes('indigo')) return '#6366f1';
    if (twClass.includes('white')) return '#ffffff';
    if (twClass.includes('black')) return '#000000';
    return '#ffffff';
};

// --- ROBUST VISUAL COMPONENTS ---

const CornerBracket = ({ position, theme }: { position: 'TL' | 'TR' | 'BL' | 'BR', theme: ThemeColors }) => {
    const pClass = position === 'TL' ? 'top-0 left-0 border-t-2 border-l-2' :
                   position === 'TR' ? 'top-0 right-0 border-t-2 border-r-2' :
                   position === 'BL' ? 'bottom-0 left-0 border-b-2 border-l-2' :
                   'bottom-0 right-0 border-b-2 border-r-2';
    return <div className={`absolute w-3 h-3 ${pClass} border-${theme.primary} opacity-70 pointer-events-none`}></div>;
};

const TechCard = ({ children, title, theme, className = '', heightClass = '' }: { children?: React.ReactNode, title: string, theme: ThemeColors, className?: string, heightClass?: string }) => {
    const primaryHex = getColor(theme.primary);
    
    return (
        <div className={`relative bg-black/40 border border-${theme.border} backdrop-blur-md p-1 ${className} ${heightClass} group overflow-hidden flex flex-col`}>
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${theme.primary} to-transparent opacity-50`}></div>
            <div className="flex justify-between items-center bg-black/60 px-3 py-1 border-b border-gray-800 shrink-0">
                <h3 className={`text-[10px] font-bold font-orbitron text-${theme.accent} tracking-widest uppercase truncate`}>{title}</h3>
                <div className="flex gap-1">
                    <div className={`w-1 h-1 bg-${theme.primary} rounded-full animate-pulse`}></div>
                    <div className={`w-1 h-1 bg-${theme.primary} rounded-full opacity-50`}></div>
                </div>
            </div>
            <div className="p-3 flex-1 overflow-auto custom-scrollbar relative">
                {children}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-5 z-0" 
                    style={{ 
                        backgroundImage: `linear-gradient(${primaryHex} 1px, transparent 1px), linear-gradient(90deg, ${primaryHex} 1px, transparent 1px)`, 
                        backgroundSize: '20px 20px' 
                    }}
                ></div>
            </div>
            <CornerBracket position="BL" theme={theme} />
            <CornerBracket position="BR" theme={theme} />
        </div>
    );
};

const ResourceGraph = ({ theme }: { theme: ThemeColors }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let dataPoints: number[] = Array(50).fill(50);
        let active = true;

        const render = () => {
            if (!active) return;
            
            // Safe resize
            if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
                if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                }
            }

            const w = canvas.width;
            const h = canvas.height;
            if (w === 0 || h === 0) {
                animationId = requestAnimationFrame(render);
                return;
            }

            // Simulate Data
            const last = dataPoints[dataPoints.length - 1];
            const next = Math.max(10, Math.min(90, last + (Math.random() - 0.5) * 20));
            dataPoints.push(next);
            dataPoints.shift();

            ctx.clearRect(0, 0, w, h);

            const color = getColor(theme.primary);

            // Grid
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for(let x=0; x<w; x+=20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
            for(let y=0; y<h; y+=20) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
            ctx.stroke();

            // Line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            ctx.beginPath();
            dataPoints.forEach((val, i) => {
                const x = (i / (dataPoints.length - 1)) * w;
                const y = h - ((val / 100) * h);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Fill
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.globalAlpha = 1;

            animationId = requestAnimationFrame(render);
        };
        render();
        return () => {
            active = false;
            cancelAnimationFrame(animationId);
        };
    }, [theme]);

    return <canvas ref={canvasRef} className="w-full h-24 block" />;
};

const NeuralCortex = ({ theme }: { theme: ThemeColors }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let active = true;
        let tick = 0;

        const nodes: {x: number, y: number, vx: number, vy: number}[] = [];
        for(let i=0; i<15; i++) {
            nodes.push({
                x: Math.random() * 100, 
                y: Math.random() * 100, 
                vx: (Math.random()-0.5)*0.5, 
                vy: (Math.random()-0.5)*0.5
            });
        }

        const render = () => {
            if (!active) return;
            
            if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
                if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                }
            }
            const w = canvas.width;
            const h = canvas.height;
            if (w === 0 || h === 0) {
                animationId = requestAnimationFrame(render);
                return;
            }

            tick++;
            ctx.clearRect(0, 0, w, h);
            
            const color = getColor(theme.primary);
            const cx = w / 2;
            const cy = h / 2;

            // Central Core
            const coreSize = 10 + Math.sin(tick * 0.05) * 2;
            ctx.fillStyle = color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Rotating Rings
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, 30, tick * 0.02, tick * 0.02 + Math.PI * 1.5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(cx, cy, 45, -tick * 0.03, -tick * 0.03 + Math.PI);
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Nodes
            ctx.fillStyle = '#fff';
            nodes.forEach(n => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > 100) n.vx *= -1;
                if (n.y < 0 || n.y > 100) n.vy *= -1;

                // Map to canvas
                const nx = (n.x / 100) * w;
                const ny = (n.y / 100) * h;

                // Draw connection to center
                const dist = Math.sqrt(Math.pow(nx-cx, 2) + Math.pow(ny-cy, 2));
                if (dist < 60) {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 1 - (dist/60);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                ctx.beginPath();
                ctx.arc(nx, ny, 1.5, 0, Math.PI*2);
                ctx.fill();
            });

            animationId = requestAnimationFrame(render);
        };
        render();
        return () => {
            active = false;
            cancelAnimationFrame(animationId);
        };
    }, [theme]);

    return <canvas ref={canvasRef} className="w-full h-full opacity-80 block" />;
};

const NetActivity = ({ theme }: { theme: ThemeColors }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        let animationId: number;
        let tick = 0;
        const bars = 20;
        
        const render = () => {
            if(canvas.width !== canvas.clientWidth) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }
            const w = canvas.width;
            const h = canvas.height;
            const barW = w / bars;
            
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = getColor(theme.primary);
            
            tick++;
            
            for(let i=0; i<bars; i++) {
                const height = Math.sin(tick * 0.1 + i) * h * 0.4 + h * 0.4;
                ctx.globalAlpha = 0.3 + Math.random() * 0.7;
                ctx.fillRect(i * barW, h - height, barW - 1, height);
            }
            animationId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationId);
    }, [theme]);
    
    return <canvas ref={canvasRef} className="w-16 h-4" />;
};

const ReactorTimer = ({ theme, focusMode, onToggleFocus }: { theme: ThemeColors, focusMode: FocusState, onToggleFocus: (minutes?: number) => void }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = focusMode.isActive && focusMode.startTime
                ? Math.max(0, (focusMode.durationMinutes * 60) - Math.floor((Date.now() - focusMode.startTime) / 1000))
                : (focusMode.durationMinutes * 60);
            setTimeLeft(isNaN(remaining) ? 0 : remaining);
        }, 1000);
        return () => clearInterval(interval);
    }, [focusMode]);
    
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const progress = focusMode.isActive ? 1 - (timeLeft / (focusMode.durationMinutes * 60)) : 0;
    const color = getColor(theme.primary);
    
    return (
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            <div className={`absolute inset-0 border-2 border-dashed border-${theme.border} rounded-full ${focusMode.isActive ? 'animate-spin-slow' : ''}`}></div>
            <div className={`relative z-10 w-32 h-32 rounded-full border-4 border-${theme.primary} flex items-center justify-center bg-black/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-sm`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                     <circle 
                         cx="50" cy="50" r="42" 
                         stroke={focusMode.isActive ? color : '#333'}
                         strokeWidth="6" 
                         fill="none" 
                         strokeLinecap="round"
                         strokeDasharray={2 * Math.PI * 42}
                         strokeDashoffset={2 * Math.PI * 42 * (1 - (isNaN(progress) ? 0 : progress))} 
                         className="transition-all duration-1000"
                     />
                 </svg>
                 <div className="text-center z-20">
                     <div className={`text-2xl font-black font-mono text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]`}>{mins}:{secs.toString().padStart(2, '0')}</div>
                     <div className={`text-[8px] font-mono tracking-[0.2em] mt-1 ${focusMode.isActive ? `text-${theme.accent} animate-pulse` : 'text-gray-500'}`}>
                         {focusMode.isActive ? 'CORE ACTIVE' : 'STANDBY'}
                     </div>
                 </div>
            </div>
            <div className="absolute -bottom-8 flex gap-2">
                 {focusMode.isActive ? (
                     <button onClick={() => onToggleFocus()} className="px-6 py-1 bg-red-900/80 border border-red-500 text-red-500 text-[10px] rounded font-bold hover:bg-red-800">ABORT</button>
                 ) : (
                     <>
                         <button onClick={() => onToggleFocus(25)} className={`px-4 py-1 bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} text-[10px] rounded font-bold hover:bg-${theme.primary}/40`}>25M</button>
                         <button onClick={() => onToggleFocus(50)} className={`px-4 py-1 bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} text-[10px] rounded font-bold hover:bg-${theme.primary}/40`}>50M</button>
                     </>
                 )}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ theme, soundEnabled, focusMode, onToggleFocus }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MED' | 'LOW'>('MED');
  
  // ALARM STATE
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmDays, setNewAlarmDays] = useState<number[]>([]);
  const [newAlarmSound, setNewAlarmSound] = useState<Alarm['sound']>('SIREN');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [is24Hour, setIs24Hour] = useState(true);
  
  // Weather State
  const [weather, setWeather] = useState<WeatherState>({
    temp: null,
    condition: 'SCANNING...',
    location: 'LOCATING...',
    loading: true,
    error: false
  });

  // Scratchpad State
  const [scratchpad, setScratchpad] = useState('');

  // Neural Sync State
  const [isNeuralSyncActive, setIsNeuralSyncActive] = useState(false);
  const neuralAudioCtx = useRef<AudioContext | null>(null);
  const neuralGain = useRef<GainNode | null>(null);

  // News Feed State
  const [newsItems, setNewsItems] = useState<string[]>([
      "ESTABLISHING SECURE UPLINK...",
      "SYNCING GLOBAL DATABANKS..."
  ]);

  // Connection info state
  const [connectionInfo, setConnectionInfo] = useState<{rtt?: number, downlink?: number, effectiveType?: string}>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadTodos();
    loadAlarms();
    fetchWeather();
    fetchLiveNews();
    setScratchpad(getScratchpad());
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as any;
    if (nav.connection) {
       setConnectionInfo({
         rtt: nav.connection.rtt,
         downlink: nav.connection.downlink,
         effectiveType: nav.connection.effectiveType
       });
       nav.connection.addEventListener('change', () => {
         setConnectionInfo({
            rtt: nav.connection.rtt,
            downlink: nav.connection.downlink,
            effectiveType: nav.connection.effectiveType
         });
       });
    }
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopNeuralSync();
    };
  }, []);

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setScratchpad(val);
      saveScratchpad(val);
  };

  const fetchLiveNews = async () => {
      try {
          const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty');
          if (!topStoriesRes.ok) throw new Error("API Error");
          const ids = await topStoriesRes.json();
          if (!Array.isArray(ids)) throw new Error("Invalid format");

          const topIds = ids.slice(0, 15);
          const storyPromises = topIds.map((id: number) => 
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
          );
          
          const stories = await Promise.all(storyPromises);
          const headlines = stories.map((s: any) => `[NEWS] ${s.title.toUpperCase()}`);
          
          // MIX IN SIMULATED MARKET DATA FOR "LEGENDARY" FEEL
          const markets = [
              "[MARKET] BTC/USD: 94,320 (+2.1%)",
              "[MARKET] ETH/USD: 3,450 (-0.5%)",
              "[MARKET] NVDA: 1,140 (+1.8%)",
              "[SYS] GLOBAL HASH RATE: STABLE",
              "[INTEL] QUANTUM DECRYPTION: OFFLINE"
          ];
          
          // Interleave them
          const mixedContent = [];
          for(let i=0; i<headlines.length; i++) {
              mixedContent.push(headlines[i]);
              if (i % 3 === 0) mixedContent.push(markets[i % markets.length]);
          }
          
          setNewsItems(mixedContent);
      } catch (e) {
          console.error("News Fetch Failed", e);
          setNewsItems(["UPLINK FAILED", "USING CACHED PROTOCOLS", "SYSTEM ALERT: CHECK NETWORK"]);
      }
  };

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      setWeather(prev => ({ ...prev, loading: false, error: true, condition: 'NO GPS SIGNAL' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const weatherData = await weatherRes.json();
          if (!weatherData.current_weather) throw new Error("Invalid weather data");

          const wCode = weatherData.current_weather.weathercode;
          const temp = weatherData.current_weather.temperature;

          let conditionText = "UNKNOWN";
          if (wCode === 0) conditionText = "CLEAR SKY";
          else if (wCode >= 1 && wCode <= 3) conditionText = "CLOUDY";
          else if (wCode >= 45 && wCode <= 48) conditionText = "FOG DETECTED";
          else if (wCode >= 51 && wCode <= 67) conditionText = "RAIN";
          else if (wCode >= 71 && wCode <= 77) conditionText = "SNOW";
          else if (wCode >= 80 && wCode <= 82) conditionText = "SHOWERS";
          else if (wCode >= 95) conditionText = "STORM ALERT";

          let locationText = `SEC: ${latitude.toFixed(2)} | ${longitude.toFixed(2)}`;
          try {
             const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
             const geoData = await geoRes.json();
             if (geoData && geoData.address) {
                const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county;
                if (city) locationText = `${city.toUpperCase()}`;
             }
          } catch (e) {
             console.warn("Geocoding failed, using coordinates");
          }

          setWeather({
            temp,
            condition: conditionText,
            location: locationText,
            loading: false,
            error: false
          });

        } catch (error) {
          console.error("Weather Fetch Error:", error);
          setWeather(prev => ({ ...prev, loading: false, error: true, condition: 'DATA ERR' }));
        }
      },
      (error) => {
        console.warn("Geolocation Error:", error);
        setWeather(prev => ({ ...prev, loading: false, error: true, condition: 'GPS DENIED' }));
      }
    );
  };

  const loadTodos = async () => {
    const data = await getTodos();
    const priorityVal = { 'HIGH': 3, 'MED': 2, 'LOW': 1 };
    data.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (priorityVal[b.priority || 'MED'] || 0) - (priorityVal[a.priority || 'MED'] || 0);
    });
    setTodos(data);
  };

  const loadAlarms = async () => {
      const data = await getAlarms();
      setAlarms(data.sort((a,b) => a.time.localeCompare(b.time)));
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    const item: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      priority: newPriority
    };
    await saveTodo(item);
    if (soundEnabled) playSound('click');
    setNewTodo('');
    loadTodos();
  };

  const toggleTodo = async (item: TodoItem) => {
    await saveTodo({ ...item, completed: !item.completed });
    if (!item.completed && soundEnabled) playSound('success');
    else if (soundEnabled) playSound('click');
    loadTodos();
  };

  const removeTodo = async (id: string) => {
    await deleteTodo(id);
    if (soundEnabled) playSound('alert'); 
    loadTodos();
  };

  const toggleNeuralSync = () => {
      if (isNeuralSyncActive) stopNeuralSync();
      else startNeuralSync();
  };

  const startNeuralSync = () => {
      if (!window.AudioContext && !(window as any).webkitAudioContext) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      neuralAudioCtx.current = ctx;
      
      const bufferSize = ctx.sampleRate * 2; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; 
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      
      const gain = ctx.createGain();
      gain.gain.value = 0.05; 
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      neuralGain.current = gain;
      setIsNeuralSyncActive(true);
      if (soundEnabled) playSound('startup');
  };

  const stopNeuralSync = () => {
      if (neuralAudioCtx.current) {
          neuralAudioCtx.current.close();
          neuralAudioCtx.current = null;
      }
      setIsNeuralSyncActive(false);
  };

  const handleAddAlarm = async () => {
      if(!newAlarmTime) return;
      const newAlarm: Alarm = {
          id: Date.now().toString(),
          time: newAlarmTime,
          label: newAlarmLabel || 'ALERT',
          isActive: true,
          days: newAlarmDays,
          sound: newAlarmSound
      };
      await saveAlarm(newAlarm);
      if(soundEnabled) playSound('success');
      setNewAlarmLabel('');
      setNewAlarmDays([]);
      setNewAlarmSound('SIREN');
      loadAlarms();
  };

  const toggleAlarm = async (alarm: Alarm) => {
      await saveAlarm({...alarm, isActive: !alarm.isActive, snoozedUntil: undefined});
      if(soundEnabled) playSound('click');
      loadAlarms();
  };

  const removeAlarm = async (id: string) => {
      await deleteAlarm(id);
      if(soundEnabled) playSound('click');
      loadAlarms();
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden relative">
      <style>{MarqueeStyles}</style>
      
      {/* --- HUD HEADER --- */}
      <div className="flex justify-between items-start mb-4 shrink-0 relative">
          <div className="flex items-center gap-4">
              <div className={`w-14 h-14 border-2 border-${theme.primary} rounded-full flex items-center justify-center relative`}>
                  <div className={`absolute inset-1 border border-${theme.accent} rounded-full border-dashed animate-spin-slow opacity-50`}></div>
                  <div className={`text-[10px] font-bold text-${theme.primary} font-mono`}>{currentTime.getSeconds()}</div>
              </div>
              <div>
                  <div className="text-3xl font-black font-orbitron tracking-wider text-white leading-none">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
                  </div>
                  <div className="flex gap-2 text-[9px] font-mono text-gray-400 tracking-widest mt-1">
                      <span>{currentTime.toDateString().toUpperCase()}</span>
                      <span className={`text-${theme.accent}`}>|</span>
                      <span className="text-green-500 font-bold">SECURE UPLINK</span>
                  </div>
              </div>
          </div>

          <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-lg font-light text-white">
                  {weather.loading ? <span className="animate-pulse">SCANNING...</span> : <span>{weather.temp}°C</span>}
                  <svg className={`w-5 h-5 text-${theme.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <div className="text-[9px] font-mono text-gray-500 tracking-widest mt-1">
                  {weather.location} // {weather.condition}
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="text-[8px] font-mono text-gray-500">TIME FORMAT</span>
                  <button 
                    onClick={() => setIs24Hour(!is24Hour)} 
                    className={`w-8 h-4 rounded-full border border-gray-700 flex items-center px-0.5 transition-all ${is24Hour ? `justify-end bg-${theme.primary}/20 border-${theme.primary}` : 'justify-start bg-black'}`}
                  >
                      <div className={`w-2.5 h-2.5 rounded-full ${is24Hour ? `bg-${theme.primary}` : 'bg-gray-500'}`}></div>
                  </button>
              </div>
          </div>
          <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${theme.border} to-transparent`}></div>
      </div>

      {/* --- MAIN CONTROL GRID --- */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden pb-10">
          
          {/* COL 1: TACTICAL OPS */}
          <div className="flex flex-col gap-4">
              <TechCard title="MISSION OBJECTIVES" theme={theme} className="flex-1" heightClass="min-h-[200px]">
                  <div className="flex gap-2 mb-3 bg-black/40 p-1.5 rounded border border-gray-800">
                      <input 
                        type="text" 
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                        placeholder="NEW DIRECTIVE..."
                        className="flex-1 bg-transparent text-[10px] text-white font-mono outline-none placeholder-gray-600"
                      />
                      <select 
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className={`bg-transparent text-[9px] font-bold outline-none border border-gray-700 rounded px-1
                            ${newPriority === 'HIGH' ? 'text-red-500' : newPriority === 'MED' ? 'text-yellow-500' : 'text-blue-500'}
                        `}
                      >
                          <option value="HIGH">HIGH</option>
                          <option value="MED">MED</option>
                          <option value="LOW">LOW</option>
                      </select>
                      <button onClick={handleAddTodo} className={`text-${theme.primary} hover:text-white px-2`}>+</button>
                  </div>

                  <div className="space-y-2">
                      {todos.slice(0, 6).map(todo => (
                          <div key={todo.id} className={`flex items-center justify-between p-1.5 border-l-2 bg-white/5 hover:bg-white/10 transition-all group ${todo.completed ? 'border-gray-600 opacity-50' : `border-${todo.priority === 'HIGH' ? 'red-500' : todo.priority === 'LOW' ? 'blue-500' : 'yellow-500'}`}`}>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => toggleTodo(todo)} className={`w-3 h-3 border border-gray-500 flex items-center justify-center ${todo.completed ? `bg-${theme.primary} border-${theme.primary} text-black` : ''}`}>
                                      {todo.completed && <span className="text-[8px]">✓</span>}
                                  </button>
                                  <span className={`text-[10px] font-mono ${todo.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{todo.text}</span>
                              </div>
                              <button onClick={() => removeTodo(todo.id)} className="text-gray-600 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100">&times;</button>
                          </div>
                      ))}
                      {todos.length === 0 && <div className="text-center text-[9px] text-gray-600 font-mono mt-10">NO ACTIVE MISSIONS</div>}
                  </div>
              </TechCard>

              <TechCard title="QUICK PROTOCOLS" theme={theme} className="h-32">
                  <div className="grid grid-cols-2 gap-2 h-full">
                      <button onClick={toggleNeuralSync} className={`flex flex-col items-center justify-center border rounded ${isNeuralSyncActive ? `border-${theme.primary} bg-${theme.primary}/20 text-${theme.primary}` : 'border-gray-800 text-gray-500 hover:text-white'}`}>
                          <div className="text-[9px] font-bold">NEURAL SYNC</div>
                          <div className="text-[8px] opacity-70">{isNeuralSyncActive ? 'ACTIVE' : 'OFFLINE'}</div>
                      </button>
                      <div className="flex flex-col items-center justify-center border border-gray-800 rounded bg-black/40">
                          <div className="text-[9px] text-gray-500 font-mono">NET_STATUS</div>
                          <div className={`text-xs font-bold ${isOnline ? 'text-green-500' : 'text-red-500'}`}>{isOnline ? 'CONNECTED' : 'SEVERED'}</div>
                      </div>
                  </div>
              </TechCard>
          </div>

          {/* COL 2: CENTRAL COMMAND */}
          <div className="flex flex-col gap-4">
              <div className="flex-1 flex flex-col items-center justify-start pt-4 relative min-h-[220px]">
                  <div className={`absolute inset-0 bg-${theme.primary} opacity-5 blur-[80px] rounded-full pointer-events-none`}></div>
                  <ReactorTimer theme={theme} focusMode={focusMode} onToggleFocus={onToggleFocus} />
                  <div className="mt-8 w-full px-4">
                      <div className="flex justify-between text-[9px] font-mono text-gray-500 mb-1">
                          <span>SYSTEM LOAD</span>
                          <span>STABLE</span>
                      </div>
                      <ResourceGraph theme={theme} />
                  </div>
              </div>
              
              <TechCard title="NEURAL NETWORK STATUS" theme={theme} className="h-40">
                  <div className="flex gap-4 h-full items-center">
                      <div className="w-24 h-24 shrink-0 border border-gray-800 rounded-full overflow-hidden relative bg-black/50">
                          <NeuralCortex theme={theme} />
                      </div>
                      <div className="flex-1 space-y-2">
                          <div className="flex justify-between border-b border-gray-800 pb-1 text-[9px] font-mono text-gray-400">
                              <span>NODES ACTIVE</span><span className="text-white">15/15</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-800 pb-1 text-[9px] font-mono text-gray-400">
                              <span>LATENCY</span><span className="text-green-500">{connectionInfo.rtt || 24}ms</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-800 pb-1 text-[9px] font-mono text-gray-400">
                              <span>UPLINK</span><span className="text-blue-400">{connectionInfo.downlink || 10} MBPS</span>
                          </div>
                      </div>
                  </div>
              </TechCard>
          </div>

          {/* COL 3: LOGISTICS */}
          <div className="flex flex-col gap-4 h-full">
              <TechCard title="CHRONO ALARMS" theme={theme} className="flex-1 max-h-56">
                  <div className="space-y-1 mb-2">
                      {alarms.map(alarm => (
                          <div key={alarm.id} className="flex justify-between items-center p-1.5 bg-white/5 rounded border border-white/5 hover:border-gray-600 transition-colors">
                              <div>
                                  <div className={`font-mono font-bold text-xs ${alarm.isActive ? `text-${theme.primary}` : 'text-gray-500'}`}>{alarm.time}</div>
                                  <div className="text-[8px] text-gray-500 truncate max-w-[80px]">{alarm.label}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => toggleAlarm(alarm)} className={`w-2 h-2 rounded-full ${alarm.isActive ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-red-900'}`}></button>
                                  <button onClick={() => removeAlarm(alarm.id)} className="text-gray-600 hover:text-white text-xs">&times;</button>
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  {/* ALARM DAYS SELECTOR */}
                  <div className="flex justify-between mb-2">
                      {['S','M','T','W','T','F','S'].map((day, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                                if (newAlarmDays.includes(i)) setNewAlarmDays(prev => prev.filter(d => d !== i));
                                else setNewAlarmDays(prev => [...prev, i]);
                            }}
                            className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-mono border ${newAlarmDays.includes(i) ? `bg-${theme.primary} text-black border-${theme.primary}` : 'border-gray-700 text-gray-500'}`}
                          >
                              {day}
                          </button>
                      ))}
                  </div>

                  {/* SOUND SELECTOR */}
                  <div className="flex gap-1 mb-2">
                      {(['SIREN', 'PULSE', 'ETHEREAL'] as const).map(sound => (
                          <button
                            key={sound}
                            onClick={() => setNewAlarmSound(sound)}
                            className={`flex-1 text-[7px] py-1 border rounded ${newAlarmSound === sound ? `border-${theme.accent} text-${theme.accent}` : 'border-gray-800 text-gray-600'}`}
                          >
                              {sound}
                          </button>
                      ))}
                  </div>

                  <div className="mt-auto border-t border-gray-800 pt-2 flex gap-2">
                      <input type="time" value={newAlarmTime} onChange={(e) => setNewAlarmTime(e.target.value)} className="bg-black text-white text-[10px] p-1 rounded border border-gray-700 outline-none" />
                      <button onClick={handleAddAlarm} className={`flex-1 bg-${theme.primary}/10 border border-${theme.primary} text-${theme.primary} text-[10px] font-bold rounded hover:bg-${theme.primary}/30`}>SET</button>
                  </div>
              </TechCard>

              <TechCard title="SCRATCHPAD" theme={theme} className="h-48">
                  <textarea 
                    value={scratchpad}
                    onChange={handleScratchpadChange}
                    placeholder="// ENTER DATA FRAGMENTS..."
                    className={`w-full h-full bg-transparent text-[10px] font-mono text-${theme.accent} outline-none resize-none placeholder-gray-800`}
                  />
              </TechCard>
          </div>

      </div>

      {/* --- LEGENDARY LIVE TICKER --- */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-black/80 backdrop-blur-md border-t border-gray-800 flex items-center z-20 overflow-hidden shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
          {/* LEFT LABEL */}
          <div className={`px-4 h-full bg-${theme.primary}/10 border-r border-${theme.primary} text-${theme.primary} text-[10px] font-black font-orbitron flex items-center gap-2 shrink-0`}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></div>
              LIVE INTEL
          </div>
          
          {/* MARQUEE CONTAINER */}
          <div className="flex-1 overflow-hidden relative group cursor-help">
              <div className="animate-marquee-infinite group-hover:[animation-play-state:paused] flex items-center">
                  {[...newsItems, ...newsItems].map((item, i) => (
                      <span key={i} className="text-[10px] font-mono text-gray-400 mx-8 flex items-center whitespace-nowrap">
                          {item.includes('[NEWS]') && <span className={`text-${theme.accent} mr-2 font-bold`}>[NEWS]</span>}
                          {item.includes('[MARKET]') && <span className="text-green-400 mr-2 font-bold">[MARKET]</span>}
                          {item.includes('[SYS]') && <span className="text-blue-400 mr-2 font-bold">[SYS]</span>}
                          {item.replace(/\[.*?\]\s*/, '')}
                      </span>
                  ))}
              </div>
              {/* Fade edges */}
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
          </div>

          {/* RIGHT STATS */}
          <div className="hidden md:flex items-center gap-3 px-4 h-full border-l border-gray-800 bg-black/40 shrink-0">
              <div className="flex flex-col items-end leading-none">
                  <span className="text-[8px] text-gray-500 font-mono">NET_TRAFFIC</span>
                  <span className={`text-[9px] font-bold text-${theme.accent}`}>{connectionInfo.downlink || 10} MBPS</span>
              </div>
              <div className="w-12 h-full py-1">
                  <NetActivity theme={theme} />
              </div>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;