
import React, { useRef, useEffect, useState } from 'react';
import { Message, ThemeColors, VoiceSkin, VoiceCalibration, LearningProfile, CustomCommand, AvatarType, AppView, UserRole, PersonalityMode, ActiveMusic } from '../types';
import { generateMarcoResponse } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { extractTopics } from '../services/learningService';
import { VOICE_CONFIGS } from '../constants';
import Hologram from './Hologram';

// --- INTERNAL TIMER COMPONENT ---
const ChatTimer: React.FC<{ initialSeconds: number; theme: ThemeColors }> = ({ initialSeconds, theme }) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (interval) clearInterval(interval);
            playSound('alert');
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (timeLeft / initialSeconds) * 100;

    return (
        <div className={`mt-2 w-48 bg-black/80 border border-${theme.primary} rounded-lg p-4 flex flex-col items-center shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
            <div className={`text-[10px] text-${theme.accent} font-mono mb-2 tracking-widest`}>COUNTDOWN_TIMER</div>
            <div className={`text-4xl font-mono font-bold text-white mb-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
            </div>
            <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                <div 
                    className={`h-full bg-${theme.primary} transition-all duration-1000 linear`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <button 
                onClick={() => setIsActive(!isActive)}
                className={`mt-3 text-[10px] font-mono border border-gray-600 px-3 py-1 rounded hover:bg-white/10 transition-colors ${isActive ? 'text-red-400' : 'text-green-400'}`}
            >
                {isActive ? 'PAUSE' : 'RESUME'}
            </button>
        </div>
    );
};

// --- LEGENDARY MUSIC PLAYER WIDGET ---
const MusicPlayerWidget: React.FC<{ musicState: ActiveMusic; theme: ThemeColors; }> = ({ musicState, theme }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!musicState.url || !audioRef.current) return;
        
        const audio = audioRef.current;
        audio.src = musicState.url;
        audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Auto-play blocked", e));

        // Init Visualizer
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (!ctx) return;

        if (!sourceRef.current) {
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128; // Higher res for better visual
            source.connect(analyser);
            analyser.connect(ctx.destination);
            
            sourceRef.current = source;
            analyserRef.current = analyser;
        }

        let animationId: number;

        const render = () => {
            if (!canvasRef.current || !analyserRef.current) return;
            const canvas = canvasRef.current;
            const c = canvas.getContext('2d');
            if (!c) return;
            
            // Set explicit dimensions for sharpness
            if (canvas.width !== canvas.clientWidth) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const draw = () => {
                if (!isPlaying && audioRef.current?.paused) return;
                
                animationId = requestAnimationFrame(draw);
                analyserRef.current!.getByteFrequencyData(dataArray);
                
                // Update Progress Manually for smoothness
                if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                    if (audioRef.current.duration) setDuration(audioRef.current.duration);
                }

                c.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate Bass Energy for "Alive" Pulse
                let bassSum = 0;
                for(let i=0; i<10; i++) bassSum += dataArray[i];
                const bassEnergy = bassSum / 10;
                
                // Pulse Container Border/Shadow
                if (containerRef.current) {
                    const glowOpacity = 0.2 + (bassEnergy / 255) * 0.5;
                    const scale = 1 + (bassEnergy / 255) * 0.02;
                    containerRef.current.style.boxShadow = `0 0 ${20 + bassEnergy/5}px ${theme.primary.includes('cyan') ? 'rgba(6,182,212,' : 'rgba(255,255,255,'}${glowOpacity})`;
                    // containerRef.current.style.transform = `scale(${scale})`; // Optional: might be too jittery
                }

                // --- LEGENDARY SYMMETRIC SPECTRUM ---
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const barWidth = (canvas.width / bufferLength) * 1.5;
                
                for(let i = 0; i < bufferLength; i++) {
                    const value = dataArray[i];
                    const percent = value / 255;
                    const height = Math.max(2, percent * canvas.height * 0.8);
                    const offset = i * (barWidth + 1);
                    
                    // Dynamic Rainbow Color
                    const hue = (i * 5 + (Date.now() / 20)) % 360;
                    c.fillStyle = `hsl(${hue}, 100%, 60%)`;
                    
                    // Neon Glow effect
                    c.shadowBlur = 15;
                    c.shadowColor = `hsl(${hue}, 100%, 50%)`;

                    // Draw Symmetric Bars (Center Out)
                    // Right Side
                    c.fillRect(cx + offset, cy - height/2, barWidth, height);
                    // Left Side
                    if (offset > 0) {
                        c.fillRect(cx - offset - barWidth, cy - height/2, barWidth, height);
                    }
                }
                c.shadowBlur = 0; // Reset
            };
            draw();
        };
        render();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            // audio.pause(); // Don't pause on unmount to keep playing in chat history? usually better to pause.
            // But if user scrolls away, we might want it to keep playing. 
            // For now, let's auto-pause to avoid chaos if multiple widgets render.
            audio.pause();
        };
    }, [musicState.url]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
                setIsPlaying(true);
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    if (!musicState.url) return null;

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div 
            ref={containerRef}
            className={`mt-4 w-full md:w-80 bg-black/90 border border-${theme.accent} rounded-xl p-0 relative overflow-hidden transition-all duration-100 group`}
        >
            {/* Background Animated Gradient */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-purple-900 via-blue-900 to-black animate-gradient-xy pointer-events-none"></div>

            {/* Visualizer Canvas */}
            <canvas ref={canvasRef} className="w-full h-32 block opacity-90 mix-blend-screen" />
            
            {/* Metadata Overlay */}
            <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <div className={`text-[9px] font-mono text-${theme.primary} font-bold tracking-widest uppercase mb-1`}>
                        SONIC_CORE_PLAYBACK
                    </div>
                    <div className="text-white font-bold text-sm tracking-wide truncate max-w-[200px] shadow-black drop-shadow-md">
                        {musicState.trackName}
                    </div>
                </div>
                <div className={`text-[10px] font-mono text-gray-300 bg-black/50 px-2 py-1 rounded border border-${theme.border}`}>
                    {Math.floor(currentTime/60)}:{(Math.floor(currentTime)%60).toString().padStart(2,'0')} / 
                    {Math.floor(duration/60)}:{(Math.floor(duration)%60).toString().padStart(2,'0')}
                </div>
            </div>

            {/* Controls Overlay (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3">
                <button 
                    onClick={togglePlay}
                    className={`w-10 h-10 rounded-full border border-${theme.accent} bg-black/60 text-white flex items-center justify-center hover:bg-${theme.accent} hover:text-black transition-all hover:scale-110 shadow-lg z-20`}
                >
                    {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                    ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>
                
                {/* Progress Bar */}
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden relative group/bar cursor-pointer">
                    <div 
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${theme.primary} to-${theme.accent} shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Hidden Audio Element */}
            <audio 
                ref={audioRef} 
                onEnded={() => setIsPlaying(false)} 
                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
                className="hidden" 
            />
        </div>
    );
};

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  theme: ThemeColors;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
  isListening: boolean;
  setIsListening: (v: boolean) => void;
  saveMemory: (text: string) => void;
  soundEnabled: boolean;
  voiceEnabled: boolean; 
  wakeWordEnabled: boolean;
  voiceSkin: VoiceSkin;
  voiceCalibration: VoiceCalibration;
  onAICommand: (command: string, payload: string) => void;
  learningProfile: LearningProfile;
  onUpdateProfile: (action: any) => void;
  customCommands: CustomCommand[];
  avatar: AvatarType;
  onRandomAvatar: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  currentView: AppView;
  userRole: UserRole; 
  personality: PersonalityMode;
  masterName: string; // Dynamic Master Name
  musicState: ActiveMusic; // NEW PROP
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, setMessages, theme, isSpeaking, setIsSpeaking, isListening, setIsListening, saveMemory, soundEnabled, voiceEnabled, wakeWordEnabled, voiceSkin, voiceCalibration, onAICommand, learningProfile, onUpdateProfile, customCommands, avatar, onRandomAvatar, isFullScreen, toggleFullScreen, currentView, userRole, personality, masterName, musicState
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // LEGENDARY VOICE STATE
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [interimResult, setInterimResult] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'IDLE' | 'STANDBY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('IDLE');
  const [isWakeWordStandby, setIsWakeWordStandby] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // For Visualizer
  
  // ANIMATION STATE
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [bootProgress, setBootProgress] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice Logic Refs
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLiveModeRef = useRef(false); 
  const isProcessingRef = useRef(false);
  const isWakeWordEnabledRef = useRef(wakeWordEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Triple Tap Refs
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);

  useEffect(() => {
    isWakeWordEnabledRef.current = wakeWordEnabled;
  }, [wakeWordEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (soundEnabled && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'model' && Date.now() - last.timestamp < 1000) {
        playSound('receive');
      }
    }
  }, [messages, soundEnabled]);

  useEffect(() => {
    const loadVoices = () => {
       const voices = window.speechSynthesis.getVoices();
       if (voices.length > 0) {
         setAvailableVoices(voices);
       }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Update Voice Status Effect
  useEffect(() => {
    if (isLoading) setVoiceStatus('PROCESSING');
    else if (isSpeaking) setVoiceStatus('SPEAKING');
    else if (isListening && isLiveMode) setVoiceStatus('LISTENING');
    else if (isWakeWordStandby) setVoiceStatus('STANDBY');
    else setVoiceStatus('IDLE');
  }, [isLoading, isSpeaking, isListening, isWakeWordStandby, isLiveMode]);

  // --- ROBUST LIVE MODE LOOP ---
  useEffect(() => {
      if (isLoading || isSpeaking || isProcessingRef.current) {
          if (isListening || isWakeWordStandby) {
              stopRecognition();
          }
          return;
      }

      if (isLiveMode) {
          if (!isListening) {
              const timer = setTimeout(() => {
                  if (!isProcessingRef.current && !isSpeaking) {
                      startRecognition(true);
                  }
              }, 300);
              return () => clearTimeout(timer);
          }
      } 
      else if (wakeWordEnabled && !isListening) {
           if (!isWakeWordStandby) {
               const timer = setTimeout(() => {
                   startRecognition(false);
               }, 500);
               return () => clearTimeout(timer);
           }
      }
  }, [isLiveMode, isSpeaking, isLoading, isListening, isWakeWordStandby, wakeWordEnabled]);


  // Updated Suggestion Logic
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const defaultCommands = [
        '/help', '/clear', '/scan', '/time', 
        '/hack', '/matrix', '/reboot', '/stealth', '/purge', '/override',
        '/mtracker'
    ];
    const userTriggers = customCommands.map(c => c.trigger);
    const allSlashCommands = Array.from(new Set([...defaultCommands, ...userTriggers]));
    const PREDEFINED = [
      "Remember to", "What is the", "Generate code for", "System Status",
      "Show Memories", "Create Task", "Help", "Analyze", "Who are you",
      "Switch Theme", "Red Mode", "Go to Settings"
    ];
    const history = messages.filter(m => m.role === 'user').map(m => m.content).reverse();
    const uniqueHistory = Array.from(new Set(history));
    const allCandidates = Array.from(new Set([...allSlashCommands, ...PREDEFINED, ...uniqueHistory]));
    const term = input.toLowerCase();
    const matches = allCandidates.filter(c => 
        c.toLowerCase().includes(term) && c.toLowerCase() !== term
    );
    matches.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(term);
        const bStarts = b.toLowerCase().startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        const countA = learningProfile.topCommands[a] || 0;
        const countB = learningProfile.topCommands[b] || 0;
        return countB - countA;
    });
    setSuggestions(matches.slice(0, 5));
  }, [input, messages, learningProfile, customCommands]);

  const cleanTextForSpeech = (text: string) => {
      return text
        .replace(/\[\[WIDGET:.*?\]\]/g, "Displaying requested data.") // Skip widgets
        .replace(/```[\s\S]*?```/g, "Code block generated.") 
        .replace(/[*#`_\[\]]/g, '') 
        .replace(/https?:\/\/\S+/g, 'Link attached.') 
        .replace(/<[^>]*>/g, '') 
        .trim();
  };

  const speak = (text: string) => {
    if (!voiceEnabled) return; 
    stopRecognition(); 
    
    setIsSpeaking(true);
    window.speechSynthesis.cancel(); 

    const cleanText = cleanTextForSpeech(text);
    const chunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const config = VOICE_CONFIGS[voiceSkin];
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => config.langPreference.some(l => v.lang.includes(l))) || voices.find(v => v.lang.includes('en'));
    
    // Gender fallback preference (not always reliable in WebSpeech API but good to try)
    if (config.genderPreference && selectedVoice) {
        const preferred = voices.find(v => 
            config.langPreference.some(l => v.lang.includes(l)) && 
            (v.name.toLowerCase().includes(config.genderPreference === 'male' ? 'male' : 'female') || 
             v.name.toLowerCase().includes(config.genderPreference === 'male' ? 'david' : 'zira'))
        );
        if (preferred) selectedVoice = preferred;
    }

    let chunkIndex = 0;
    
    const speakNextChunk = () => {
        if (chunkIndex >= chunks.length) {
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
        if (selectedVoice) utterance.voice = selectedVoice;

        // --- DYNAMIC VOICE EFFECTS ---
        if (voiceSkin === VoiceSkin.PERSONALIZED && voiceCalibration.isCalibrated) {
            utterance.pitch = voiceCalibration.pitch;
            utterance.rate = voiceCalibration.rate;
        } 
        else if (voiceSkin === VoiceSkin.GLITCH_ENTITY) {
            // Chaotic pitch shifting per sentence
            utterance.pitch = 0.5 + Math.random(); 
            utterance.rate = 0.8 + Math.random() * 0.4;
        } 
        else if (voiceSkin === VoiceSkin.VOID_WALKER) {
            // Consistent Low Drone
            utterance.pitch = 0.1;
            utterance.rate = 0.7;
        }
        else if (voiceSkin === VoiceSkin.IRON_MODULATION) {
            // JARVIS: Deep, Precise, slight inflection
            utterance.pitch = config.pitch + (Math.random() - 0.5) * 0.05; // Slight organic variance
            utterance.rate = config.rate;
        }
        else {
            utterance.pitch = config.pitch;
            utterance.rate = config.rate;
        }

        utterance.onend = () => {
            chunkIndex++;
            speakNextChunk();
        };
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  };

  const executeVoiceCount = (target: number) => {
      if (!voiceEnabled) return;
      stopRecognition();
      setIsSpeaking(true);
      window.speechSynthesis.cancel();

      let current = 1;
      const config = VOICE_CONFIGS[voiceSkin];
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => config.langPreference.some(l => v.lang.includes(l)));

      const speakNext = () => {
          if (current > target) {
              setIsSpeaking(false);
              // Resume live mode if active
              if (isLiveModeRef.current) startRecognition(true);
              return;
          }

          const utterance = new SpeechSynthesisUtterance(current.toString());
          if (selectedVoice) utterance.voice = selectedVoice;
          
          if (voiceSkin === VoiceSkin.PERSONALIZED && voiceCalibration.isCalibrated) {
              utterance.pitch = voiceCalibration.pitch;
              utterance.rate = voiceCalibration.rate;
          } else {
              utterance.pitch = config.pitch;
              utterance.rate = config.rate;
          }

          utterance.onend = () => {
              current++;
              setTimeout(speakNext, 600); // Rhythmic 600ms pause for better counting effect
          };
          
          utterance.onerror = () => { setIsSpeaking(false); };
          window.speechSynthesis.speak(utterance);
      };

      speakNext();
  };

  const processResponse = (rawText: string): string => {
    const commandRegex = /\[\[EXEC:(\w+)\|(.*?)\]\]/g;
    let match;
    let cleanText = rawText;
    while ((match = commandRegex.exec(rawText)) !== null) {
      const command = match[1];
      const payload = match[2];
      
      // Handle Local Chat Features
      if (command === 'COUNT') {
          const num = parseInt(payload);
          if (!isNaN(num)) executeVoiceCount(num);
      } 
      else if (command === 'TIMER') {
          const sec = parseInt(payload);
          if (!isNaN(sec)) {
              setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'system',
                  content: `[[WIDGET:TIMER|${sec}]]`,
                  timestamp: Date.now(),
                  isCommandResult: true
              }]);
          }
      }
      else if (command === 'MUSIC') {
          // MUSIC TRIGGER IS GLOBAL IN APP.TSX TO FETCH BLOB, 
          // BUT WE CAN RENDER A WIDGET HERE TOO IF NEEDED OR HANDLE UI FEEDBACK
          onAICommand(command, payload);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              content: `[[WIDGET:MUSIC_PLAYER|${payload}]]`, // Trigger widget render
              timestamp: Date.now(),
              isCommandResult: true
          }]);
      }
      else {
          // Global App Commands
          onAICommand(command, payload);
      }
      cleanText = cleanText.replace(match[0], '');
    }
    return cleanText.trim();
  };

  const processSlashCommand = (cmd: string) => {
      const parts = cmd.toLowerCase().split(' ');
      const keyword = parts[0];
      onUpdateProfile({ type: 'COMMAND', value: keyword });

      const customCmd = customCommands.find(c => c.trigger === keyword);
      if (customCmd) {
          if (soundEnabled) playSound('success');
          onAICommand(customCmd.action, customCmd.payload);
          setMessages(prev => [...prev, { 
             id: Date.now().toString(), 
             role: 'system', 
             content: `EXECUTING CUSTOM PROTOCOL: ${customCmd.action} -> ${customCmd.payload}`, 
             timestamp: Date.now(), 
             isCommandResult: true 
          }]);
          setInput('');
          setSuggestions([]);
          return;
      }

      if (soundEnabled) playSound('success');

      switch(keyword) {
          case '/help':
              // Render the new Legendary Help Widget
              setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'system', 
                  content: '[[WIDGET:HELP_TABLE]]', 
                  timestamp: Date.now(), 
                  isCommandResult: true 
              }]);
              break;
          case '/clear':
              setMessages([{ id: Date.now().toString(), role: 'system', content: 'BUFFER EMPTY.', timestamp: Date.now() }]);
              break;
          case '/scan':
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `SCAN COMPLETE. SYSTEM NOMINAL.`, timestamp: Date.now(), isCommandResult: true }]);
              break;
          case '/time':
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `TIME: ${new Date().toLocaleTimeString().toUpperCase()}`, timestamp: Date.now(), isCommandResult: true }]);
              break;
          case '/hack': onAICommand('OVERLAY', 'HACK_SIMULATION'); break;
          case '/matrix': onAICommand('OVERLAY', 'MATRIX_RAIN'); onAICommand('THEME', 'GREEN_MATRIX'); break;
          case '/reboot': onAICommand('OVERLAY', 'SYSTEM_REBOOT'); setTimeout(() => setMessages([]), 3000); break;
          case '/stealth': onAICommand('THEME', 'AMOLED_BLACK'); onAICommand('SOUND', 'OFF'); break;
          case '/purge': setMessages([{ id: Date.now().toString(), role: 'system', content: 'DATABANKS FLUSHED.', timestamp: Date.now() }]); break;
          case '/override': onAICommand('SOUND', 'ON'); onAICommand('THEME', 'RED_HACKER'); break;
          case '/mtracker': onAICommand('NAVIGATE', 'M_TRACKER'); break;
          // ADMIN ACCESS - HIDDEN
          case '/admin-access': onAICommand('NAVIGATE', 'ADMIN_GENESIS'); break;
          default:
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `ERROR: COMMAND '${keyword}' NOT RECOGNIZED.`, timestamp: Date.now() }]);
      }
      setInput('');
      setSuggestions([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAttachedImage(reader.result as string);
              if (soundEnabled) playSound('click');
          };
          reader.readAsDataURL(file);
      }
  };

  const clearAttachment = () => {
      setAttachedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
    const imgToSend = attachedImage;
    
    if (!textToSend.trim() && !imgToSend) return;
    
    stopRecognition();
    isProcessingRef.current = true;
    
    setInput('');
    setAttachedImage(null);
    setSuggestions([]);
    setInterimResult('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (soundEnabled) playSound('send');

    // Handle Slash Commands
    if (textToSend.startsWith('/')) {
        const cmdMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: Date.now() };
        setMessages(prev => [...prev, cmdMsg]);
        processSlashCommand(textToSend);
        isProcessingRef.current = false;
        return;
    }

    // Handle Voice Aliases
    const lower = textToSend.toLowerCase();
    const commandMap: Record<string, string> = {
        'system help': '/help', 'show commands': '/help', 'clear chat': '/clear',
        'scan system': '/scan', 'check time': '/time', 'initiate hack': '/hack',
        'enter matrix': '/matrix', 'system reboot': '/reboot', 'stealth mode': '/stealth',
        'open tracker': '/mtracker'
    };
    const matchedKey = Object.keys(commandMap).find(key => lower.includes(key));
    if (matchedKey) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: Date.now() }]);
        setTimeout(() => { processSlashCommand(commandMap[matchedKey]); isProcessingRef.current = false; }, 500);
        return;
    }

    onUpdateProfile({ type: 'INTERACTION' });
    const detectedTopics = extractTopics(textToSend);
    if (detectedTopics.length > 0) onUpdateProfile({ type: 'TOPIC', values: detectedTopics });

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: Date.now(), attachment: imgToSend || undefined };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const history = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
    // PASS DYNAMIC MASTER NAME
    const responseText = await generateMarcoResponse(textToSend, history, learningProfile, currentView, userRole, masterName, personality, imgToSend || undefined);
    const processedText = processResponse(responseText);

    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: processedText || "Command Executed.", timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
    isProcessingRef.current = false;
    
    if (processedText) speak(processedText);
    else {
        if (isLiveModeRef.current) {
            startRecognition(true);
        }
    }
  };

  const applySuggestion = (suggestion: string) => {
      if (soundEnabled) playSound('click');
      setInput(suggestion);
      setSuggestions([]);
      inputRef.current?.focus();
  };

  // --- AUDIO VISUALIZER ---
  const initAudioVisualizer = async (stream: MediaStream) => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32; 
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
          if (!isListening && !isWakeWordStandby) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
          setMicVolume(sum / dataArray.length);
          requestAnimationFrame(updateVolume);
      };
      updateVolume();
  };

  const startRecognition = (mode: boolean) => {
    if (!('webkitSpeechRecognition' in window)) return;
    if (recognitionRef.current) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true; 
    recognition.interimResults = true; 
    recognition.lang = 'en-US';
    
    recognition.onstart = () => { 
        if (mode) {
             setIsListening(true); 
             setIsWakeWordStandby(false);
             navigator.mediaDevices.getUserMedia({ audio: true }).then(initAudioVisualizer).catch(e => console.error(e));
        } else {
             setIsListening(false);
             setIsWakeWordStandby(true);
             navigator.mediaDevices.getUserMedia({ audio: true }).then(initAudioVisualizer).catch(e => console.error(e));
        }
    };
    
    recognition.onend = () => { 
        recognitionRef.current = null;
        setIsListening(false);
        setIsWakeWordStandby(false);
        setMicVolume(0);
        
        if (!isProcessingRef.current && !isLoading && !isSpeaking) {
            if (isLiveModeRef.current) {
                startRecognition(true); 
            } else if (isWakeWordEnabledRef.current) {
                startRecognition(false);
            }
        }
    };
    
    recognition.onresult = (event: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }

      if (mode) {
          setInterimResult(interimTranscript);
          if (finalTranscript) {
              const finalText = finalTranscript.trim();
              if (finalText) {
                  recognition.stop(); 
                  handleSend(finalText);
                  return;
              }
          }
          if (interimTranscript.trim()) {
              silenceTimerRef.current = setTimeout(() => {
                  recognition.stop();
                  handleSend(interimTranscript.trim());
              }, 2000); 
          }

      } else {
          const combined = (finalTranscript + " " + interimTranscript).toLowerCase();
          const triggers = ["hey marco", "wake up marco", "wake up", "system online", "marco"];
          
          if (triggers.some(t => combined.includes(t))) {
              recognition.stop();
              runBootSequence(); 
          }
      }
    };

    recognition.onerror = (e: any) => {
        if (e.error === 'aborted' || e.error === 'no-speech') return;
        stopRecognition();
    };
    
    try { recognition.start(); } catch (e) { /* ignore */ }
  };

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    let timePhrase = "Evening";
    if (hour >= 5 && hour < 12) timePhrase = "Morning";
    else if (hour >= 12 && hour < 17) timePhrase = "Afternoon";

    const prompts = [
        "How may I assist you?",
        "Systems at your command.",
        "How are you feeling?",
        "What is your directive?"
    ];
    const suffix = prompts[Math.floor(Math.random() * prompts.length)];
    
    // Greeting with dynamic master name
    return `Good ${timePhrase}, ${masterName}. Systems Online. ${suffix}`;
  };

  const runBootSequence = () => {
      setIsWakingUp(true);
      setBootLog([]);
      setBootProgress(0);

      if (soundEnabled) playSound('startup');

      const logs = [
          "INITIALIZING NEURAL NET...",
          "LOADING CORE MODULES...",
          "VERIFYING BIOMETRICS...",
          "ACCESSING MAIN DATABASE...",
          "SYNCING CLOUD NODES...",
          "SYSTEM ONLINE."
      ];
      
      let logIndex = 0;
      const logInterval = setInterval(() => {
          if (logIndex < logs.length) {
              setBootLog(prev => [...prev, logs[logIndex]]);
              setBootProgress(prev => prev + 15);
              if(soundEnabled) playSound('click');
              logIndex++;
          } else {
              clearInterval(logInterval);
              setBootProgress(100);
          }
      }, 300);

      setIsLiveMode(true);
      isLiveModeRef.current = true;
      
      setTimeout(() => {
          const greeting = getDynamicGreeting();
          speak(greeting);
      }, 2000); 

      setTimeout(() => {
          setIsWakingUp(false);
      }, 3000); 
  };

  const stopRecognition = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
      }
      setIsListening(false);
      setIsWakeWordStandby(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setMicVolume(0);
      setInterimResult('');
  };

  const toggleLiveMode = () => {
      const newMode = !isLiveMode;
      stopRecognition(); 
      if (newMode) {
          runBootSequence();
      } else {
          setIsLiveMode(false);
          isLiveModeRef.current = false;
          speak("Voice systems standby.");
      }
  };

  const toggleMicButton = () => {
      if (isListening) {
          stopRecognition();
          if (isLiveMode) {
              setIsLiveMode(false);
              isLiveModeRef.current = false;
          }
      } else {
          stopRecognition(); 
          startRecognition(true); 
          if (soundEnabled) playSound('click');
      }
  };

  const handleHologramClick = () => {
      clickCountRef.current += 1;
      if (soundEnabled) playSound('click'); // FEEDBACK SOUND FOR TAPS
      
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      
      if (clickCountRef.current === 3) {
          onRandomAvatar();
          clickCountRef.current = 0;
      } else {
          // Relaxed timeout to 600ms
          clickTimeoutRef.current = setTimeout(() => { clickCountRef.current = 0; }, 600);
      }
  };

  // --- LEGENDARY TEXT RENDERING ENGINE ---
  const parseInline = (text: string, theme: ThemeColors) => {
      // Extended Regex to catch Honorifics and Names for Legendary Highlighting
      // We escape masterName to ensure regex safety
      const safeMasterName = masterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keywords = ["master", "sir", "boss", "creator", "mohammed waiz monazzum", safeMasterName];
      const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

      // First split by markdown (bold/code)
      const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
      
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <span key={i} className={`font-bold text-${theme.accent} drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]`}>{part.slice(2, -2)}</span>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
              return <span key={i} className="bg-gray-800/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-cyan-300 border border-gray-600/50">{part.slice(1, -1)}</span>;
          }
          
          // Now check for Keywords inside normal text
          const subParts = part.split(keywordRegex);
          if (subParts.length > 1) {
              return (
                  <span key={i}>
                      {subParts.map((sp, j) => {
                          if (keywords.some(k => k.toLowerCase() === sp.toLowerCase())) {
                              return (
                                <span key={j} className="text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.6)] animate-pulse inline-block transform hover:scale-105 transition-transform cursor-default" title="Legendary Entity">
                                    {sp}
                                </span>
                              );
                          }
                          return sp;
                      })}
                  </span>
              );
          }

          return part;
      });
  };

  const renderStyledText = (text: string, theme: ThemeColors) => {
      // CHECK FOR SPECIAL WIDGET MARKERS
      if (text.includes('[[WIDGET:HELP_TABLE]]')) {
          return (
              <div className="w-full mt-2 animate-fade-in-up">
                  <div className={`border border-${theme.primary} rounded-lg overflow-hidden bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                      <div className={`bg-${theme.primary}/20 px-4 py-2 border-b border-${theme.primary} flex justify-between items-center`}>
                          <h3 className={`font-bold text-${theme.primary} font-orbitron tracking-widest`}>SYSTEM COMMAND PROTOCOLS</h3>
                          <span className="text-[10px] font-mono text-gray-400">ACCESS LEVEL: UNRESTRICTED</span>
                      </div>
                      <div className="p-4 grid gap-4">
                          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-gray-500 border-b border-gray-700 pb-2">
                              <div>TRIGGER</div>
                              <div className="col-span-2">FUNCTION</div>
                          </div>
                          
                          {[
                              { cmd: '/scan', desc: 'Run system diagnostics & network check.' },
                              { cmd: '/time', desc: 'Display local synchronized system time.' },
                              { cmd: '/clear', desc: 'Purge current chat memory buffer.' },
                              { cmd: '/mtracker', desc: 'Open Discipline Module (No-Fap).' },
                              { cmd: '/hack', desc: 'Initiate visual brute-force simulation.' },
                              { cmd: '/matrix', desc: 'Overlay Reality Distortion Field.' },
                              { cmd: '/reboot', desc: 'Simulate full system restart sequence.' },
                              { cmd: '/stealth', desc: 'Activate dark mode & silence audio.' },
                          ].map((item, idx) => (
                              <div key={idx} className="grid grid-cols-3 gap-2 items-center group hover:bg-white/5 p-1 rounded transition-colors">
                                  <div className={`font-bold text-${theme.accent} font-mono bg-${theme.accent}/10 px-2 py-1 rounded w-fit`}>{item.cmd}</div>
                                  <div className="col-span-2 text-xs text-gray-300 font-light">{item.desc}</div>
                              </div>
                          ))}
                      </div>
                      <div className={`bg-black/50 px-4 py-2 text-[10px] text-gray-500 font-mono border-t border-gray-800`}>
                          TIP: You can create <span className={`text-${theme.primary}`}>CUSTOM PROTOCOLS</span> in System Settings to trigger themes, alarms, or navigation.
                      </div>
                  </div>
              </div>
          );
      }

      // CHECK FOR TIMER WIDGET
      if (text.startsWith('[[WIDGET:TIMER')) {
          const parts = text.split('|');
          const seconds = parts[1] ? parseInt(parts[1].replace(']]', '')) : 60;
          return <ChatTimer initialSeconds={seconds} theme={theme} />;
      }

      // CHECK FOR MUSIC PLAYER WIDGET
      if (text.startsWith('[[WIDGET:MUSIC_PLAYER')) {
          return <MusicPlayerWidget musicState={musicState} theme={theme} />;
      }

      // 1. Split by Code Blocks
      const parts = text.split(/(```[\s\S]*?```)/g);
      
      return parts.map((part, index) => {
          if (part.startsWith('```')) {
              // Render Code Block
              const content = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
              return (
                  <div key={index} className="my-4 bg-black/60 rounded-lg border border-gray-700/50 overflow-hidden relative group shadow-lg backdrop-blur-sm">
                      <div className={`absolute top-0 left-0 w-full h-6 bg-gray-900/80 border-b border-gray-700 flex items-center px-3 justify-between`}>
                          <div className="flex gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                              <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                              <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                          </div>
                          <span className="text-[9px] font-mono text-gray-500">CODE_FRAGMENT</span>
                      </div>
                      <div className="p-4 pt-8 overflow-x-auto custom-scrollbar">
                          <pre className={`font-mono text-xs md:text-sm text-${theme.primary} whitespace-pre`}>{content}</pre>
                      </div>
                  </div>
              );
          }
          
          // Render Regular Text (Markdown-ish)
          const lines = part.split('\n');
          return (
              <div key={index}>
                  {lines.map((line, i) => {
                      if (!line.trim()) return <div key={i} className="h-3"></div>; // Breathing space

                      // Headers
                      if (line.startsWith('# ')) return <h1 key={i} className={`text-xl md:text-2xl font-black text-${theme.accent} mt-6 mb-3 font-orbitron border-b-2 border-${theme.primary}/20 pb-2 uppercase tracking-widest drop-shadow-md`}>{line.substring(2)}</h1>;
                      if (line.startsWith('## ')) return <h2 key={i} className={`text-lg md:text-xl font-bold text-${theme.primary} mt-5 mb-2 font-orbitron uppercase tracking-wider`}>{line.substring(3)}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i} className={`text-md font-bold text-white mt-4 mb-2 tracking-wide border-l-4 border-${theme.accent} pl-2`}>{line.substring(4)}</h3>;

                      // Bullet Points
                      if (line.match(/^[-*]\s/)) {
                          return (
                              <div key={i} className="flex gap-3 ml-2 mb-2 items-start">
                                  <span className={`text-${theme.accent} mt-1 text-[10px] transform rotate-0`}>►</span>
                                  <span className="flex-1 text-sm md:text-base leading-relaxed text-gray-200 font-light">{parseInline(line.replace(/^[-*]\s/, ''), theme)}</span>
                              </div>
                          );
                      }

                      // Numbered Lists
                      if (line.match(/^\d+\.\s/)) {
                           return (
                              <div key={i} className="flex gap-3 ml-2 mb-2 items-start">
                                  <span className={`text-${theme.primary} font-mono font-bold text-xs mt-1 bg-${theme.primary}/10 px-1 rounded`}>{line.match(/^\d+\./)![0]}</span>
                                  <span className="flex-1 text-sm md:text-base leading-relaxed text-gray-200 font-light">{parseInline(line.replace(/^\d+\.\s/, ''), theme)}</span>
                              </div>
                          );
                      }

                      // Regular Paragraph
                      return <p key={i} className="mb-2 leading-7 text-sm md:text-base text-gray-100 font-light">{parseInline(line, theme)}</p>;
                  })}
              </div>
          );
      });
  };

  return (
    <div className={`flex flex-col h-full relative transition-all duration-500 ${isFullScreen ? 'bg-black/90' : ''}`}>
      
      {isWakingUp && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono animate-fade-in cursor-wait">
              <div className={`w-72 h-72 border-2 border-${theme.primary}/30 rounded-full animate-spin-slow absolute`}></div>
              <div className={`w-64 h-64 border-t-2 border-b-2 border-${theme.accent} rounded-full animate-spin absolute`}></div>
              <div className={`w-32 h-32 bg-${theme.primary} rounded-full animate-pulse opacity-20 blur-2xl absolute`}></div>
              
              <div className="z-10 flex flex-col items-center">
                  <div className={`text-6xl font-black text-${theme.primary} tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]`}>
                      MARCO
                  </div>
                  <div className="text-xs text-white tracking-[1em] mt-2 opacity-70">SYSTEM WAKING</div>
              </div>
              
              <div className="mt-16 w-80 h-32 overflow-hidden flex flex-col items-center gap-1 z-10 bg-black/50 backdrop-blur-sm border border-gray-800 p-2 rounded">
                  {bootLog.map((log, i) => (
                      <div key={i} className={`text-[10px] text-${theme.primary} font-mono w-full text-left animate-fade-in`}>
                          <span className="opacity-50 mr-2">{`>_`}</span>
                          {log}
                      </div>
                  ))}
                  <div className={`w-full h-1 bg-gray-800 mt-auto rounded overflow-hidden`}>
                      <div 
                        className={`h-full bg-${theme.accent} transition-all duration-300 ease-out`} 
                        style={{ width: `${bootProgress}%` }}
                      ></div>
                  </div>
              </div>

              {bootProgress >= 100 && (
                  <div className={`absolute bottom-20 text-2xl font-bold text-white tracking-widest animate-pulse duration-75`}>
                      SYSTEM READY
                  </div>
              )}
          </div>
      )}

      <div className={`absolute top-2 right-2 z-30 flex gap-2`}>
        <button 
           onClick={toggleFullScreen}
           className={`p-2 rounded-full border border-${theme.border} bg-black/40 text-${theme.primary} hover:bg-${theme.primary}/20 transition-all`}
        >
           {isFullScreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
           ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
           )}
        </button>
      </div>

      {!isFullScreen && (
        <div className="flex-none p-2 flex justify-center border-b border-gray-800 bg-black/40 backdrop-blur-sm z-10 shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
            <Hologram isActive={true} isSpeaking={isSpeaking} isListening={isListening} themeColors={theme} avatar={avatar} onClick={handleHologramClick} />
        </div>
      )}

      {isFullScreen && (isLoading || isSpeaking || isListening) && (
          <div className="absolute top-12 right-1/2 translate-x-1/2 md:translate-x-0 md:right-12 z-20 w-32 h-32 md:w-48 md:h-48 pointer-events-none animate-fade-in-down">
              <div className={`absolute inset-0 bg-black/60 rounded-full blur-xl`}></div>
              <Hologram isActive={true} isSpeaking={isSpeaking} isListening={isListening} themeColors={theme} avatar={avatar} />
              <div className={`absolute -bottom-4 left-0 w-full text-center text-[10px] font-mono font-bold text-${theme.accent} bg-black/80 px-2 py-1 rounded border border-${theme.border} tracking-widest`}>
                 {voiceStatus}
              </div>
          </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-6 pb-36 scrollbar-hide ${isFullScreen ? 'pt-16' : ''}`}>
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'} mb-6`}>
            
            {/* NEW LEGENDARY HEADER */}
            <div className={`flex items-center gap-2 mb-1 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* NAME BADGE */}
                <div className={`
                    flex items-center gap-2 px-3 py-1 rounded-t-md border-t border-x 
                    text-[10px] font-mono font-bold tracking-widest uppercase
                    ${m.role === 'user' 
                        ? `bg-${theme.primary}/20 border-${theme.primary}/50 text-${theme.primary}` 
                        : `bg-${theme.accent}/20 border-${theme.accent}/50 text-${theme.accent}`}
                `}>
                    {m.role === 'user' ? (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {masterName}
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            MARCO_AI <span className="opacity-50 text-[8px] border-l border-current pl-1 ml-1">ARCH: WAIZ</span>
                        </>
                    )}
                </div>
                {/* TIME STAMP */}
                <div className="text-[9px] text-gray-600 font-mono bg-black/40 px-2 py-0.5 rounded border border-gray-800">
                    {new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
            </div>

            {/* MESSAGE CONTAINER */}
            <div className={`
              relative max-w-[90%] md:max-w-[80%] rounded-b-md p-1 min-w-[200px]
              backdrop-blur-xl animate-fade-in transition-all duration-300
              shadow-[0_4px_20px_rgba(0,0,0,0.3)]
              ${m.role === 'user' 
                ? `bg-gradient-to-br from-gray-900/80 to-black/80 border-r-2 border-${theme.primary} rounded-tl-md` 
                : m.isCommandResult 
                    ? `bg-black/90 border-l-2 border-${theme.accent} w-full rounded-tr-md`
                    : `bg-gradient-to-br from-gray-900/90 to-black/90 border-l-2 border-${theme.accent} rounded-tr-md`}
            `}>
               {/* Decorative Corner */}
               <div className={`absolute top-0 ${m.role === 'user' ? 'right-0' : 'left-0'} w-2 h-2 border-t border-${m.role === 'user' ? theme.primary : theme.accent}`}></div>

               <div className={`p-4 md:p-5 ${m.isCommandResult ? 'py-3' : ''} relative z-10`}>
                   {m.attachment && (
                       <div className="mb-4 rounded-lg overflow-hidden border border-gray-700/50 relative group">
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                           <img src={m.attachment} alt="Attachment" className="max-w-full h-auto max-h-60 object-cover w-full" />
                           <div className={`absolute bottom-0 left-0 w-full p-2 text-center text-[10px] font-mono tracking-widest text-${theme.accent} bg-black/60 backdrop-blur-md border-t border-gray-800`}>
                               VISUAL DATA ANALYSIS
                           </div>
                       </div>
                   )}
                   
                   {/* Content Renderer */}
                   {m.isCommandResult && !m.content.includes('[[WIDGET') ? (
                       <div className={`font-mono text-xs md:text-sm text-${theme.primary} whitespace-pre-wrap leading-relaxed tracking-wide`}>{m.content}</div>
                   ) : (
                       <div className={`${m.role === 'user' ? 'text-gray-100 text-right' : 'text-gray-200 text-left'}`}>
                           {renderStyledText(m.content, theme)}
                       </div>
                   )}
               </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-6">
             <div className="flex items-center gap-2 mb-1 px-1">
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-t-md border-t border-x border-${theme.accent}/30 bg-${theme.accent}/10 text-${theme.accent} text-[10px] font-mono font-bold tracking-widest uppercase`}>
                     PROCESSING
                 </div>
             </div>
             <div className={`px-6 py-4 rounded-b-md rounded-tr-md bg-black/60 border-l-2 border-${theme.accent} flex items-center gap-2 shadow-lg`}>
                 <div className={`w-1.5 h-1.5 rounded-full bg-${theme.accent} animate-bounce`}></div>
                 <div className={`w-1.5 h-1.5 rounded-full bg-${theme.accent} animate-bounce delay-75`}></div>
                 <div className={`w-1.5 h-1.5 rounded-full bg-${theme.accent} animate-bounce delay-150`}></div>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={`absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-20 ${isFullScreen ? 'backdrop-blur-sm' : ''}`}>
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 w-full px-4 mb-2 animate-fade-in-up z-50">
             <div className={`bg-black/90 border border-${theme.border} rounded-lg overflow-hidden backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)]`}>
                <div className={`text-[10px] px-3 py-1 bg-${theme.primary}/10 text-${theme.secondary} font-mono border-b border-gray-800 flex justify-between`}>
                   <span>SUGGESTED_PROTOCOLS</span><span className="text-gray-600">CMD_ID_v{suggestions.length}</span>
                </div>
                {suggestions.map((suggestion, index) => (
                   <button key={index} onClick={() => applySuggestion(suggestion)} className={`w-full text-left px-4 py-3 text-sm text-gray-300 font-mono hover:bg-${theme.primary}/20 hover:text-${theme.accent} transition-colors border-b border-gray-800 last:border-0 flex items-center gap-2 group`}>
                      <span className={`text-${theme.primary} opacity-50 group-hover:opacity-100`}>&gt;_</span>{suggestion}
                   </button>
                ))}
             </div>
          </div>
        )}

        {attachedImage && (
            <div className={`mb-2 mx-2 p-2 rounded bg-black/60 border border-${theme.accent} flex items-center justify-between animate-fade-in backdrop-blur-md`}>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded border border-gray-600 overflow-hidden relative">
                       <img src={attachedImage} alt="Preview" className="w-full h-full object-cover opacity-70" />
                   </div>
                   <div className="flex flex-col"><span className={`text-[10px] text-${theme.accent} font-mono font-bold`}>VISUAL_INPUT</span></div>
                </div>
                <button onClick={clearAttachment} className="text-gray-400 hover:text-white p-2">&times;</button>
            </div>
        )}

        <div className={`flex items-center gap-2 border bg-black/60 p-2 rounded-full backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] ring-1 ring-white/5 relative z-20 transition-all duration-300
           ${isLiveMode ? `border-${theme.accent} shadow-[0_0_30px_rgba(6,182,212,0.3)]` : `border-${theme.border}`}
        `}>
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-full text-gray-400 hover:text-${theme.primary} hover:bg-${theme.primary}/10 transition-colors`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
          </button>

          <div className="flex gap-1 bg-black/40 rounded-full p-1 border border-gray-800">
              <button 
                  onClick={toggleLiveMode}
                  className={`px-3 py-2 rounded-full font-mono text-[10px] font-bold transition-all whitespace-nowrap
                    ${isLiveMode ? `bg-${theme.primary} text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]` : 'text-gray-500 hover:text-white'}
                  `}
              >
                  {isLiveMode ? 'LIVE ON' : 'LIVE OFF'}
              </button>
              
              <button 
                onClick={toggleMicButton}
                className={`p-2 rounded-full transition-all duration-300 relative overflow-hidden
                  ${isListening ? `bg-red-500 text-white animate-pulse` : (isWakeWordStandby ? 'bg-yellow-600/50 text-yellow-200 animate-pulse' : `text-${theme.primary} hover:bg-${theme.primary}/10`)}
                `}
                title={isWakeWordStandby ? "Standby Mode (Wake Word Active)" : "Toggle Mic"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={isListening || isWakeWordStandby ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 relative z-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 013 3v4.5a3 3 0 01-3 3 3 3 0 01-3-3V4.5a3 3 0 01-3-3V4.5a3 3 0 013-3z" />
                </svg>
              </button>
          </div>
          
          <div className="flex-1 relative flex items-center">
             {isListening && micVolume > 0 && (
                 <div className="absolute inset-0 flex items-center gap-0.5 opacity-50 pointer-events-none z-0">
                     {Array.from({length: 20}).map((_, i) => (
                         <div 
                            key={i} 
                            className={`flex-1 bg-${theme.primary} transition-all duration-75 ease-in-out`}
                            style={{ 
                                height: `${Math.min(100, Math.max(10, micVolume * (0.5 + Math.random())))}%`,
                                opacity: 0.5 + Math.random() * 0.5
                            }}
                         ></div>
                     ))}
                 </div>
             )}

             <input 
                ref={inputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? (isLiveMode ? "HEARING YOU..." : "LISTENING...") : (isWakeWordStandby ? "STANDBY: 'HEY MARCO'" : "AWAITING COMMAND...")}
                className={`w-full bg-transparent border-none outline-none font-mono min-w-0 transition-colors z-10 relative
                    ${isLiveMode ? `text-${theme.accent} placeholder-${theme.accent}/50` : 'text-white placeholder-gray-500'}
                `}
                autoComplete="off"
             />
             
             {interimResult && isListening && (
                 <div className="absolute inset-0 flex items-center z-10 pointer-events-none text-gray-500 opacity-80 font-mono truncate pl-1">
                     <span className="opacity-0">{input}</span> <span className={`text-${theme.primary} font-bold animate-pulse`}>{interimResult}</span>
                 </div>
             )}
          </div>

          <button 
            onClick={() => handleSend()}
            className={`p-3 rounded-full transition-colors ${!input.trim() && !attachedImage ? 'text-gray-600' : `text-${theme.primary} hover:bg-${theme.primary}/20`}`}
            disabled={!input.trim() && !attachedImage}
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
