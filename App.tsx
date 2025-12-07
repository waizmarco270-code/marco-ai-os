
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppView, ThemeName, Message, ThemeColors, VoiceSkin, OverlayType, LearningProfile, CustomCommand, SoundPack, NoFapState, AvatarType, Alarm, UserRole, MasterProfile, PersonalityMode, MusicTrack } from './types';
import { THEMES, VOICE_CONFIGS } from './constants';
import { saveMemory, saveTodo, getLearningProfile, saveLearningProfile, getCustomCommands, saveCustomCommand, deleteCustomCommand, getNoFapData, saveNoFapData, getAlarms, saveAlarm, saveScratchpad, getMasterProfile, saveMasterProfile, getMusicTracks } from './services/storageService';
import { updateProfile, INITIAL_PROFILE } from './services/learningService';
import { playSound, setGlobalSoundPack, playAlarmSound, stopAlarmSound } from './services/audioService';
import { MASTER_KEY } from './services/cryptoService';

// Components
import ChatInterface from './components/ChatInterface';
import MemoryVault from './components/MemoryVault';
import Dashboard from './components/Dashboard';
import DevTools from './components/DevTools';
import ParticleBackground from './components/ParticleBackground';
import VoiceCalibrator from './components/VoiceCalibrator';
import SystemOverlay from './components/SystemOverlay';
import MTracker from './components/MTracker';
import SecurityGate from './components/SecurityGate';
import LicenseGate from './components/LicenseGate';
import SetupWizard from './components/SetupWizard';
import AdminKeyGen from './components/AdminKeyGen';
import Hologram from './components/Hologram';
import InstallPrompt from './components/InstallPrompt'; // NEW IMPORT

const DEFAULT_PROFILE: MasterProfile = {
    isRegistered: false,
    name: 'Master',
    voicePhrase: 'PROTOCOL ALPHA',
    pin: '0000',
    licenseKey: '',
    registeredAt: 0
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: AppView.CHAT,
    theme: ThemeName.NEON_BLUE,
    voiceSkin: VoiceSkin.ROBOTIC_GRUNT, 
    avatar: AvatarType.CLASSIC,
    personality: PersonalityMode.LOGICAL,
    voiceCalibration: { pitch: 1.0, rate: 1.0, isCalibrated: false },
    messages: [
      { id: 'init', role: 'model', content: 'Systems Online. MARCO initialized. Awaiting orders.', timestamp: Date.now() }
    ],
    isListening: false,
    isSpeaking: false,
    voiceEnabled: true, 
    wakeWordEnabled: false, 
    soundEffectsOn: true,
    soundPack: 'CLASSIC_SCI_FI',
    activeOverlay: 'NONE',
    learningProfile: INITIAL_PROFILE,
    customCommands: [],
    noFapData: {
      currentStreakHours: 0,
      lastRelapseDate: Date.now(),
      bestStreakHours: 0,
      history: [],
      status: 'CLEAN'
    },
    alarms: [],
    focusMode: {
      isActive: false,
      durationMinutes: 25,
      startTime: null,
      label: 'FOCUS'
    },
    // NEW MUSIC STATE
    musicState: {
        isPlaying: false,
        trackName: '',
        url: null
    },
    is3DMode: false,
    isFullScreenChat: false,
    userRole: 'GUEST',
    masterProfile: DEFAULT_PROFILE 
  });

  // FLOW STATES
  const [isLicensed, setIsLicensed] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Local state for custom command form & Avatar Slider
  const [newCmdTrigger, setNewCmdTrigger] = useState('');
  const [newCmdAction, setNewCmdAction] = useState<CustomCommand['action']>('NAVIGATE');
  const [newCmdPayload, setNewCmdPayload] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  
  // Track last checked minute to avoid re-triggering or missing seconds
  const lastCheckedMinuteRef = useRef<string>('');

  const currentTheme = THEMES[state.theme];

  // Load All Data on Mount
  useEffect(() => {
    const initData = async () => {
      const profile = await getLearningProfile();
      const commands = await getCustomCommands();
      const nfData = await getNoFapData();
      const loadedAlarms = await getAlarms();
      const loadedMaster = getMasterProfile(); // Sync Load
      
      setState(prev => ({
        ...prev,
        learningProfile: profile || prev.learningProfile,
        customCommands: commands || [],
        noFapData: nfData || prev.noFapData,
        alarms: loadedAlarms || [],
        masterProfile: loadedMaster || DEFAULT_PROFILE
      }));

      // Check Logic flow
      if (loadedMaster && loadedMaster.isRegistered) {
          setIsLicensed(true);
          setIsSetupComplete(true);
          // Still need Security Gate auth
      } else {
          // If no profile, they need license or setup
          setIsLicensed(false);
          setIsSetupComplete(false);
      }
    };
    initData();
  }, []);

  const handleLicenseSuccess = (key: string) => {
      if (key === MASTER_KEY) {
          // --- MASTER KEY BYPASS PROTOCOL ---
          // Skips Setup, Skips Security, Grants Master Access Immediately
          const waizProfile: MasterProfile = {
              isRegistered: true,
              name: 'Mohammed Waiz Monazzum', // The Real Creator
              voicePhrase: 'PROTOCOL ALPHA', 
              pin: '0000',
              licenseKey: key,
              registeredAt: Date.now()
          };
          
          saveMasterProfile(waizProfile);
          setState(prev => ({ 
              ...prev, 
              masterProfile: waizProfile,
              userRole: 'MASTER',
              messages: [
                  { id: 'master_welcome', role: 'model', content: 'Identity Verified: Mohammed Waiz Monazzum. Welcome back, Creator.', timestamp: Date.now() }
              ]
          }));
          
          setIsLicensed(true);
          setIsSetupComplete(true);
          setIsAuthenticated(true);
          playSound('startup');
      } else {
          // Standard User Flow
          setIsLicensed(true);
          // Temp store key, SetupWizard handles final save
          setState(prev => ({ ...prev, masterProfile: { ...prev.masterProfile, licenseKey: key } }));
      }
  };

  const handleSetupComplete = (profile: MasterProfile) => {
      saveMasterProfile(profile);
      setState(prev => ({ 
          ...prev, 
          masterProfile: profile,
          messages: [
              { 
                  id: Date.now().toString(), 
                  role: 'model', 
                  content: `**IDENTITY CONFIRMED: ${profile.name.toUpperCase()}**\n\nWelcome to MARCO OS (v3.3). I am your Holographic AI Assistant.\n\nI was created and architected by the visionary developer **Mohammed Waiz Monazzum**.\n\nI am now linked to your biometrics and fully at your command. My systems are online and ready. How may I serve you today?`, 
                  timestamp: Date.now() 
              }
          ]
      }));
      setIsSetupComplete(true);
      // Auto-authenticate immediately after setup
      handleAuthentication('MASTER');
  };

  // ALARM CHECK LOGIC
  useEffect(() => {
     const interval = setInterval(() => {
         const now = new Date();
         const currentMinuteStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); 
         if (lastCheckedMinuteRef.current === currentMinuteStr) return;
         lastCheckedMinuteRef.current = currentMinuteStr;
         const currentDay = now.getDay(); 
         const nowTs = now.getTime();
         let activeAlarmFound: Alarm | null = null;
         state.alarms.forEach(alarm => {
             if (!alarm.isActive) return;
             if (alarm.snoozedUntil && nowTs < alarm.snoozedUntil) return;
             if (alarm.snoozedUntil && nowTs >= alarm.snoozedUntil) { activeAlarmFound = alarm; return; }
             if (alarm.time === currentMinuteStr) {
                 if (alarm.days.length === 0) { activeAlarmFound = alarm; } 
                 else if (alarm.days.includes(currentDay)) { activeAlarmFound = alarm; }
             }
         });
         if (activeAlarmFound) {
             const alarm = activeAlarmFound as Alarm; 
             setState(prev => ({ ...prev, activeOverlay: 'ALARM_TRIGGER' }));
             playAlarmSound(alarm.sound);
             if (alarm.days.length === 0 && !alarm.snoozedUntil) {
                 const updated = { ...alarm, isActive: false };
                 saveAlarm(updated);
                 setState(prev => ({ ...prev, alarms: prev.alarms.map(a => a.id === alarm.id ? updated : a) }));
             }
             if (alarm.snoozedUntil) {
                 const updated = { ...alarm, snoozedUntil: undefined };
                 saveAlarm(updated);
                 setState(prev => ({ ...prev, alarms: prev.alarms.map(a => a.id === alarm.id ? updated : a) }));
             }
         }
     }, 1000);
     return () => clearInterval(interval);
  }, [state.alarms]);

  const handleAlarmClose = (snooze: boolean = false) => {
      stopAlarmSound();
      setState(prev => ({...prev, activeOverlay: 'NONE'}));
      if (snooze) {
          const now = new Date();
          const currentMinuteStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const snoozeDuration = 5 * 60 * 1000; 
          const updatedAlarms = state.alarms.map(a => {
              if (a.isActive && (a.time === currentMinuteStr || (a.snoozedUntil && a.snoozedUntil <= now.getTime() + 60000))) {
                   const updated = { ...a, snoozedUntil: now.getTime() + snoozeDuration, isActive: true };
                   saveAlarm(updated);
                   return updated;
              }
              return a;
          });
          setState(prev => ({ ...prev, alarms: updatedAlarms }));
      }
  };

  const handleToggleFocus = (minutes?: number) => {
      if (minutes) {
          setState(prev => ({ ...prev, focusMode: { isActive: true, durationMinutes: minutes, startTime: Date.now(), label: 'FOCUS_SESSION' } }));
          if(state.soundEffectsOn) playSound('success');
      } else {
          setState(prev => ({ ...prev, focusMode: { ...prev.focusMode, isActive: false, startTime: null } }));
          if(state.soundEffectsOn) playSound('click');
      }
  };

  useEffect(() => { if (state.learningProfile.totalInteractions > 0) saveLearningProfile(state.learningProfile); }, [state.learningProfile]);
  useEffect(() => { setGlobalSoundPack(state.soundPack); }, [state.soundPack]);
  useEffect(() => { document.body.className = `bg-${currentTheme.bg} text-${currentTheme.text} overflow-hidden`; }, [currentTheme]);
  useEffect(() => { if(state.soundEffectsOn) { const timer = setTimeout(() => playSound('startup'), 500); return () => clearTimeout(timer); } }, []);

  const changeView = (view: AppView) => {
    if (state.soundEffectsOn && state.view !== view) playSound('click');
    setState(prev => ({ ...prev, view }));
  };

  const handleUpdateProfile = (action: any) => { setState(prev => ({ ...prev, learningProfile: updateProfile(prev.learningProfile, action) })); };
  const handleUpdateNoFap = async (data: NoFapState) => { await saveNoFapData(data); setState(prev => ({ ...prev, noFapData: data })); };

  const handleRegisterCommand = async () => {
    if (!newCmdTrigger || !newCmdPayload) return;
    const trigger = newCmdTrigger.startsWith('/') ? newCmdTrigger : `/${newCmdTrigger}`;
    if (state.customCommands.some(c => c.trigger === trigger)) { if(state.soundEffectsOn) playSound('alert'); alert("Command trigger already exists."); return; }
    const newCommand: CustomCommand = { id: Date.now().toString(), trigger, action: newCmdAction, payload: newCmdPayload };
    await saveCustomCommand(newCommand);
    setState(prev => ({ ...prev, customCommands: [...prev.customCommands, newCommand] }));
    if(state.soundEffectsOn) playSound('success');
    setNewCmdTrigger(''); setNewCmdPayload('');
  };

  const handleDeleteCommand = async (id: string) => {
    await deleteCustomCommand(id);
    setState(prev => ({ ...prev, customCommands: prev.customCommands.filter(c => c.id !== id) }));
    if(state.soundEffectsOn) playSound('click');
  };

  const previewVoice = (skin: VoiceSkin) => {
      window.speechSynthesis.cancel();
      const config = VOICE_CONFIGS[skin];
      const utterance = new SpeechSynthesisUtterance("Voice systems nominal. Processing command.");
      utterance.pitch = config.pitch;
      utterance.rate = config.rate;
      
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => config.langPreference.some(l => v.lang.includes(l)));
      if (config.genderPreference && selectedVoice) {
           const preferred = voices.find(v => 
              config.langPreference.some(l => v.lang.includes(l)) && 
              (v.name.toLowerCase().includes(config.genderPreference === 'male' ? 'male' : 'female') || 
               v.name.toLowerCase().includes(config.genderPreference === 'male' ? 'david' : 'zira'))
          );
          if (preferred) selectedVoice = preferred;
      }
      if (selectedVoice) utterance.voice = selectedVoice;
      
      if (skin === VoiceSkin.GLITCH_ENTITY) {
          utterance.pitch = 0.5 + Math.random(); 
          utterance.rate = 0.8 + Math.random() * 0.4;
      } else if (skin === VoiceSkin.VOID_WALKER) {
          utterance.pitch = 0.1;
          utterance.rate = 0.7;
      } else if (skin === VoiceSkin.IRON_MODULATION) {
          utterance.text = "J.A.R.V.I.S. Protocol Engaged. Systems Check Complete.";
          utterance.pitch = 0.9;
          utterance.rate = 1.05;
      }
  
      window.speechSynthesis.speak(utterance);
  };

  const AVATAR_KEYS = Object.keys(AvatarType) as AvatarType[];
  const ITEMS_PER_PAGE = 3;
  const handleNextAvatar = () => { if(state.soundEffectsOn) playSound('hover'); setAvatarIndex((prev) => (prev + 1) % AVATAR_KEYS.length); };
  const handlePrevAvatar = () => { if(state.soundEffectsOn) playSound('hover'); setAvatarIndex((prev) => (prev - 1 + AVATAR_KEYS.length) % AVATAR_KEYS.length); };
  const handleRandomAvatar = () => {
    if(state.soundEffectsOn) playSound('success');
    let newAvatar = AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)];
    while (newAvatar === state.avatar) { newAvatar = AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)]; }
    setState(prev => ({ ...prev, avatar: newAvatar }));
  };
  const getVisibleAvatars = () => { const visible = []; for(let i=0; i<ITEMS_PER_PAGE; i++) { visible.push(AVATAR_KEYS[(avatarIndex + i) % AVATAR_KEYS.length]); } return visible; };

  const handleAICommand = async (command: string, payload: string) => {
    console.log(`[AI COMMAND] EXEC: ${command} | PAYLOAD: ${payload}`);
    if(state.soundEffectsOn) playSound('success');
    handleUpdateProfile({ type: 'COMMAND', value: command });
    switch (command) {
      case 'NAVIGATE': 
          const targetView = AppView[payload as keyof typeof AppView]; 
          // --- SECURE NAVIGATION TO ADMIN ---
          if (targetView === AppView.ADMIN_GENESIS) {
              if (state.masterProfile.licenseKey !== MASTER_KEY) {
                  if(state.soundEffectsOn) playSound('alert');
                  setState(prev => ({...prev, messages: [...prev.messages, {
                      id: Date.now().toString(),
                      role: 'system',
                      content: 'ACCESS DENIED: MASTER CLEARANCE REQUIRED.',
                      timestamp: Date.now(),
                      isCommandResult: true
                  }]}));
                  return;
              }
          }
          if (targetView) setState(prev => ({ ...prev, view: targetView })); 
          break;
      
      // --- ROBUST THEME SWITCHING WITH FUZZY MATCH ---
      case 'THEME': 
          const rawPayload = payload.trim().toUpperCase().replace(/\s+/g, '_');
          let targetTheme = ThemeName[rawPayload as keyof typeof ThemeName];
          
          if (!targetTheme) {
              // Fuzzy match: Look for the command value inside valid keys
              const validKeys = Object.keys(ThemeName) as ThemeName[];
              // e.g. "RED" -> matches "RED_HACKER"
              targetTheme = validKeys.find(k => k.includes(rawPayload) || rawPayload.includes(k));
          }

          if (targetTheme) { 
              setState(prev => ({ ...prev, theme: targetTheme })); 
              handleUpdateProfile({ type: 'THEME', value: targetTheme }); 
          } 
          break;

      case 'OVERLAY': setState(prev => ({ ...prev, activeOverlay: payload as OverlayType })); break;
      case 'TODO': if(payload) await saveTodo({ id: Date.now().toString(), text: payload, completed: false }); break;
      case 'MEMORY': if(payload) await saveMemory({ id: Date.now().toString(), content: payload, type: 'fact', tags: ['ai-memory'], createdAt: Date.now() }); break;
      case 'ALARM': if (payload) { const parts = payload.split(';;'); const time = parts[0]?.trim(); const label = parts[1]?.trim() || 'AI ALARM'; if (time && time.match(/^\d{2}:\d{2}$/)) { const newAlarm: Alarm = { id: Date.now().toString(), time, label, isActive: true, days: [], sound: 'SIREN' }; await saveAlarm(newAlarm); setState(prev => ({ ...prev, alarms: [...prev.alarms, newAlarm].sort((a,b) => a.time.localeCompare(b.time)) })); } } break;
      case 'FOCUS': if (payload === 'STOP') handleToggleFocus(); else { const mins = parseInt(payload); if (!isNaN(mins)) handleToggleFocus(mins); } break;
      case 'NOTE': if (payload) { const current = localStorage.getItem('MARCO_SCRATCHPAD') || ''; saveScratchpad(current + '\n' + payload); } break;
      case 'SOUND': if (payload === 'ON') setState(prev => ({ ...prev, soundEffectsOn: true })); if (payload === 'OFF') setState(prev => ({ ...prev, soundEffectsOn: false })); break;
      case 'MTRACKER': if (payload === 'RELAPSE') { const now = Date.now(); const streak = Math.floor((now - state.noFapData.lastRelapseDate) / (1000*60*60)); const newBest = Math.max(state.noFapData.bestStreakHours, streak); const newData: NoFapState = { ...state.noFapData, lastRelapseDate: now, currentStreakHours: 0, bestStreakHours: newBest, status: 'RELAPSED', history: [...state.noFapData.history, { date: now, streakHours: streak }] }; handleUpdateNoFap(newData); } else if (payload === 'CHECKIN') { const newData: NoFapState = { ...state.noFapData, status: 'CLEAN' }; handleUpdateNoFap(newData); } break;
      case 'OPEN_URL': if (payload) { let url = payload.trim(); if (!url.startsWith('http')) { url = 'https://' + url; } window.open(url, '_blank'); } break;
      case 'EMAIL': if (payload) { const parts = payload.split(';;'); const to = parts[0]?.trim() || ''; const subject = encodeURIComponent(parts[1]?.trim() || 'No Subject'); const body = encodeURIComponent(parts[2]?.trim() || ''); const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`; setTimeout(() => { window.location.href = mailtoLink; }, 500); } break;
      // NEW MUSIC HANDLER
      case 'MUSIC':
          if (payload) {
              const allTracks = await getMusicTracks();
              const track = allTracks.find(t => t.name.toLowerCase() === payload.toLowerCase());
              if (track) {
                  const url = URL.createObjectURL(track.blob);
                  setState(prev => ({
                      ...prev,
                      musicState: { isPlaying: true, trackName: track.name, url: url }
                  }));
              } else {
                  setState(prev => ({...prev, messages: [...prev.messages, {
                      id: Date.now().toString(),
                      role: 'system',
                      content: `ERROR: Track '${payload}' not found in Sonic Vault.`,
                      timestamp: Date.now(),
                      isCommandResult: true
                  }]}));
              }
          }
          break;
      default: console.warn('Unknown AI Command:', command);
    }
  };

  const handleAuthentication = (role: UserRole) => {
     setState(prev => ({ ...prev, userRole: role }));
     setIsAuthenticated(true);
  };

  const renderView = () => {
    switch (state.view) {
      case AppView.ADMIN_GENESIS:
          // Security is handled inside the component too, but navigation is restricted above.
          return <AdminKeyGen theme={currentTheme} onClose={() => changeView(AppView.CHAT)} />;
      case AppView.CHAT:
        return (
          <ChatInterface 
            messages={state.messages} 
            setMessages={(msgs) => setState(prev => ({ ...prev, messages: typeof msgs === 'function' ? msgs(prev.messages) : msgs }))} 
            theme={currentTheme}
            isSpeaking={state.isSpeaking}
            setIsSpeaking={(v) => setState(prev => ({ ...prev, isSpeaking: v }))}
            isListening={state.isListening}
            setIsListening={(v) => setState(prev => ({ ...prev, isListening: v }))}
            saveMemory={(text) => {
              saveMemory({ id: Date.now().toString(), content: text, type: 'note', createdAt: Date.now(), tags: ['chat'] });
            }}
            soundEnabled={state.soundEffectsOn}
            voiceEnabled={state.voiceEnabled}
            wakeWordEnabled={state.wakeWordEnabled} 
            voiceSkin={state.voiceSkin}
            voiceCalibration={state.voiceCalibration}
            onAICommand={handleAICommand}
            learningProfile={state.learningProfile}
            onUpdateProfile={handleUpdateProfile}
            customCommands={state.customCommands}
            avatar={state.avatar}
            onRandomAvatar={handleRandomAvatar}
            isFullScreen={state.isFullScreenChat}
            toggleFullScreen={() => setState(prev => ({ ...prev, isFullScreenChat: !prev.isFullScreenChat }))}
            currentView={state.view}
            userRole={state.userRole}
            personality={state.personality}
            masterName={state.masterProfile.name} // Pass Dynamic Name
            musicState={state.musicState} // NEW PROP
          />
        );
      case AppView.MEMORY:
        if (state.userRole !== 'MASTER') {
            return (
                <div className="h-full flex flex-col items-center justify-center p-6 bg-black">
                    <div className="text-red-500 font-black text-4xl mb-4 tracking-widest animate-pulse">ACCESS DENIED</div>
                    <div className="text-gray-500 font-mono">RESTRICTED TO MASTER USER</div>
                </div>
            );
        }
        return <MemoryVault theme={currentTheme} />;
      case AppView.PRODUCTIVITY:
        return <Dashboard theme={currentTheme} soundEnabled={state.soundEffectsOn} focusMode={state.focusMode} onToggleFocus={handleToggleFocus} />;
      case AppView.DEV_TOOLS:
        return <DevTools theme={currentTheme} />;
      case AppView.M_TRACKER:
         if (state.userRole !== 'MASTER') {
            return (
                <div className="h-full flex flex-col items-center justify-center p-6 bg-black">
                    <div className="text-red-500 font-black text-4xl mb-4 tracking-widest animate-pulse">LOCKED</div>
                    <div className="text-gray-500 font-mono">PRIVATE MODULE</div>
                </div>
            );
        }
        return <MTracker theme={currentTheme} data={state.noFapData} onUpdate={handleUpdateNoFap} onBack={() => changeView(AppView.CHAT)} soundEnabled={state.soundEffectsOn} />;
      case AppView.SETTINGS:
        return (
          <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar bg-black/40">
            <div className={`border-b border-${currentTheme.border} pb-4 mb-8 flex justify-between items-end`}>
               <div>
                   <h2 className={`text-2xl md:text-3xl font-bold text-${currentTheme.primary} font-orbitron tracking-widest`}>CONFIGURATION</h2>
                   <div className="text-[10px] font-mono text-gray-500 mt-1">MASTER CONTROL PANEL // v3.3</div>
               </div>
               <div className="text-right hidden md:block">
                   <div className="text-[10px] text-gray-600 font-mono">UPTIME: {(performance.now()/60000).toFixed(0)}m</div>
                   <div className="text-[10px] text-gray-600 font-mono">MEMORY: {(state.learningProfile.totalInteractions/1024).toFixed(2)}kb</div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                
                {/* --- LEFT COLUMN: VISUALS --- */}
                <div className="space-y-8">
                    <section>
                       <h3 className="text-xs font-bold font-mono text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                           <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full`}></span>VISUAL CORTEX
                       </h3>
                       
                       <div className={`mb-6 p-4 border border-${currentTheme.border} rounded glass-panel flex items-center justify-between`}>
                            <div>
                                <div className={`font-mono font-bold text-${currentTheme.accent} text-sm`}>HOLOGRAPHIC 3D MODE</div>
                                <div className="text-[10px] text-gray-500 mt-1">Experimental perspective rendering engine.</div>
                            </div>
                            <button onClick={() => setState(prev => ({...prev, is3DMode: !prev.is3DMode}))} className={`px-4 py-1.5 rounded font-mono text-xs font-bold border transition-all duration-300 ${state.is3DMode ? `bg-${currentTheme.primary} text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]` : 'border-gray-700 text-gray-500 hover:border-white hover:text-white'}`}>
                                {state.is3DMode ? 'ACTIVE' : 'DISABLED'}
                            </button>
                        </div>

                        {/* Themes */}
                        <div className="mb-6">
                            <label className="text-[10px] text-gray-500 font-mono mb-3 block">INTERFACE THEME</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                {Object.keys(THEMES).map((themeKey) => (
                                    <button key={themeKey} onClick={() => { if(state.soundEffectsOn) playSound('click'); setState(prev => ({ ...prev, theme: themeKey as ThemeName })); handleUpdateProfile({ type: 'THEME', value: themeKey }); }} className={`group p-2 border rounded glass-panel hover:bg-white/5 transition-all relative overflow-hidden ${state.theme === themeKey ? `border-${currentTheme.accent} ring-1 ring-${currentTheme.accent} bg-white/5` : 'border-gray-800'}`}>
                                        <div className={`w-full h-4 rounded mb-2 bg-gradient-to-r from-${THEMES[themeKey as ThemeName].primary} to-${THEMES[themeKey as ThemeName].secondary}`}></div>
                                        <div className="text-[8px] font-mono font-bold tracking-tight group-hover:text-white transition-colors truncate">{themeKey.replace(/_/g, ' ')}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Avatar Selection & Preview */}
                        <div className="bg-black/30 border border-gray-800 rounded p-4 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] text-gray-500 font-mono">AVATAR SELECTION</span>
                                <div className="flex gap-1">
                                    <button onClick={handlePrevAvatar} className={`p-1.5 rounded hover:bg-white/10 text-${currentTheme.primary} border border-gray-800`}><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                                    <button onClick={handleNextAvatar} className={`p-1.5 rounded hover:bg-white/10 text-${currentTheme.primary} border border-gray-800`}><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                {/* Live Preview Hologram */}
                                <div className={`w-32 h-32 flex-none border border-${currentTheme.border} rounded-lg bg-black/60 relative flex items-center justify-center`}>
                                    <div className="absolute top-1 left-1 text-[8px] font-mono text-gray-500">LIVE_RENDER</div>
                                    <Hologram isActive={true} isSpeaking={false} isListening={false} themeColors={currentTheme} avatar={state.avatar} />
                                </div>

                                {/* Carousel List */}
                                <div className="flex-1 grid grid-cols-1 gap-2">
                                    {getVisibleAvatars().map((av) => (
                                        <button key={av} onClick={() => { if(state.soundEffectsOn) playSound('click'); setState(prev => ({ ...prev, avatar: av })); }} 
                                            className={`flex items-center gap-3 p-2 rounded border transition-all text-left ${state.avatar === av ? `border-${currentTheme.accent} bg-${currentTheme.primary}/10` : 'border-gray-800 hover:bg-white/5'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-black border border-gray-700 flex items-center justify-center text-[8px] font-mono text-gray-500 shrink-0">{av.substring(0,2)}</div>
                                            <span className={`text-[9px] font-mono font-bold truncate ${state.avatar === av ? `text-${currentTheme.accent}` : 'text-gray-400'}`}>{av.replace(/_/g, ' ')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* --- RIGHT COLUMN: AUDIO & INTEL --- */}
                <div className="space-y-8">
                    <section>
                       <h3 className="text-xs font-bold font-mono text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                           <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full`}></span>AUDIO SUBSYSTEMS
                       </h3>
                       
                       {/* Global Toggles */}
                       <div className="grid grid-cols-3 gap-2 mb-6">
                           {[
                               { label: 'INTERFACE SFX', active: state.soundEffectsOn, toggle: () => setState(prev => ({...prev, soundEffectsOn: !prev.soundEffectsOn})), icon: (active: boolean) => active ? '🔊' : '🔇' },
                               { label: 'VOCAL SYNTH', active: state.voiceEnabled, toggle: () => setState(prev => ({...prev, voiceEnabled: !prev.voiceEnabled})), icon: (active: boolean) => active ? '🗣️' : '😶' },
                               { label: 'WAKE WORD', active: state.wakeWordEnabled, toggle: () => setState(prev => ({...prev, wakeWordEnabled: !prev.wakeWordEnabled})), icon: (active: boolean) => active ? '👂' : '🚫' }
                           ].map((item, i) => (
                               <button key={i} onClick={item.toggle} className={`p-3 rounded border flex flex-col items-center justify-center gap-2 transition-all ${item.active ? `bg-${currentTheme.primary}/10 border-${currentTheme.primary} text-${currentTheme.primary}` : 'bg-black/20 border-gray-800 text-gray-600'}`}>
                                   <div className="text-xl">{item.icon(item.active)}</div>
                                   <div className="text-[8px] font-bold font-mono">{item.label}</div>
                               </button>
                           ))}
                       </div>

                       {/* Sound Pack */}
                       <div className="mb-6">
                           <label className="text-[10px] text-gray-500 font-mono mb-2 block">AUDIO ENVIRONMENT PACK</label>
                           <div className="flex bg-black border border-gray-800 rounded overflow-hidden">
                               {(['CLASSIC_SCI_FI', 'AMBIENT_TECH', 'MINIMALIST'] as SoundPack[]).map(pack => (
                                   <button key={pack} onClick={() => { if(state.soundEffectsOn) playSound('click'); setState(prev => ({ ...prev, soundPack: pack })); }} 
                                      className={`flex-1 py-2 text-[9px] font-mono transition-all hover:bg-white/5 border-r border-gray-800 last:border-0
                                         ${state.soundPack === pack ? `bg-${currentTheme.primary}/20 text-${currentTheme.accent} font-bold` : 'text-gray-500'}
                                      `}
                                   >
                                       {pack.split('_')[0]}
                                   </button>
                               ))}
                           </div>
                       </div>

                       {/* Voice Skins */}
                       <div className="mb-6">
                           <label className="text-[10px] text-gray-500 font-mono mb-2 block">VOICE MODULE SELECTION</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                               {Object.keys(VOICE_CONFIGS).map((skinKey) => {
                                   const skin = skinKey as VoiceSkin;
                                   const config = VOICE_CONFIGS[skin];
                                   const isPersonalized = skin === VoiceSkin.PERSONALIZED;
                                   const isDisabled = isPersonalized && !state.voiceCalibration.isCalibrated;
                                   const isActive = state.voiceSkin === skin;
                                   
                                   return (
                                       <div key={skin} className={`flex items-center p-2 border rounded transition-all ${isActive ? `border-${currentTheme.accent} bg-${currentTheme.primary}/5` : 'border-gray-800 bg-black/20'} ${isDisabled ? 'opacity-50' : ''}`}>
                                           <button 
                                              disabled={isDisabled || !state.voiceEnabled} 
                                              onClick={() => { if(state.soundEffectsOn) playSound('click'); setState(prev => ({ ...prev, voiceSkin: skin })); }}
                                              className="flex-1 text-left"
                                           >
                                               <div className={`text-[10px] font-bold font-mono ${isActive ? `text-${currentTheme.accent}` : 'text-gray-400'}`}>{skin.replace(/_/g, ' ')}</div>
                                               <div className="text-[8px] text-gray-600 font-mono">{isPersonalized ? 'BIOMETRIC MATCH' : `P:${config.pitch} R:${config.rate}`}</div>
                                           </button>
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); previewVoice(skin); }}
                                              disabled={!state.voiceEnabled}
                                              className={`p-2 rounded-full hover:bg-white/10 ${isActive ? `text-${currentTheme.primary}` : 'text-gray-500'}`}
                                              title="Preview Voice"
                                           >
                                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                           </button>
                                       </div>
                                   );
                               })}
                           </div>
                       </div>
                       
                       <VoiceCalibrator theme={currentTheme} currentCalibration={state.voiceCalibration} onCalibrationComplete={(cal) => { setState(prev => ({ ...prev, voiceCalibration: cal, voiceSkin: VoiceSkin.PERSONALIZED })); }} />
                    </section>

                    <section>
                        <h3 className="text-xs font-bold font-mono text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                           <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full`}></span>NEURAL MATRIX
                        </h3>
                        <div className="mb-4">
                            <label className="text-[10px] text-gray-500 font-mono mb-2 block">PERSONALITY CORE</label>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.keys(PersonalityMode).map((pm) => (
                                    <button 
                                        key={pm} 
                                        onClick={() => { if(state.soundEffectsOn) playSound('click'); setState(prev => ({ ...prev, personality: pm as PersonalityMode })); }} 
                                        className={`py-2 text-[9px] font-bold font-mono rounded border transition-all 
                                            ${state.personality === pm ? `border-${currentTheme.accent} bg-${currentTheme.primary}/20 text-${currentTheme.accent}` : 'border-gray-700 text-gray-500 hover:border-gray-500'}
                                        `}
                                    >
                                        {pm}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* --- BOTTOM SECTION: CUSTOM PROTOCOLS --- */}
            <section className="mb-20">
               <h3 className="text-xs font-bold font-mono text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                   <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full`}></span>CUSTOM COMMAND PROTOCOLS
               </h3>
               <div className="glass-panel p-4 md:p-6 rounded">
                   <div className="flex flex-col md:flex-row gap-4 mb-6 bg-black/40 p-4 rounded border border-gray-800">
                       <div className="flex-1">
                           <label className="text-[10px] text-gray-500 font-mono mb-1 block">TRIGGER PHRASE</label>
                           <div className="relative">
                               <span className="absolute left-3 top-2.5 text-gray-500 font-mono text-sm">/</span>
                               <input type="text" placeholder="command" value={newCmdTrigger.replace(/^\//, '')} onChange={(e) => setNewCmdTrigger(e.target.value)} className={`w-full bg-black/60 border border-gray-700 p-2 pl-6 rounded text-xs text-white font-mono focus:border-${currentTheme.primary} outline-none`} />
                           </div>
                       </div>
                       <div className="w-full md:w-32">
                           <label className="text-[10px] text-gray-500 font-mono mb-1 block">ACTION</label>
                           <select value={newCmdAction} onChange={(e) => setNewCmdAction(e.target.value as any)} className={`w-full bg-black/60 border border-gray-700 p-2 rounded text-xs text-white font-mono focus:border-${currentTheme.primary} outline-none appearance-none`}>
                               <option value="NAVIGATE">NAVIGATE</option><option value="THEME">THEME</option><option value="SOUND">SOUND</option><option value="OVERLAY">OVERLAY</option><option value="OPEN_URL">OPEN URL</option><option value="ALARM">ALARM</option><option value="MUSIC">PLAY MUSIC</option>
                           </select>
                       </div>
                       <div className="flex-[2]">
                           <label className="text-[10px] text-gray-500 font-mono mb-1 block">PAYLOAD</label>
                           <input type="text" placeholder="Parameter (e.g., M_TRACKER, Battle Theme)" value={newCmdPayload} onChange={(e) => setNewCmdPayload(e.target.value)} className={`w-full bg-black/60 border border-gray-700 p-2 rounded text-xs text-white font-mono focus:border-${currentTheme.primary} outline-none`} />
                       </div>
                       <div className="flex items-end">
                           <button onClick={handleRegisterCommand} className={`h-9 px-4 bg-${currentTheme.primary} text-black font-bold font-mono text-[10px] rounded hover:opacity-90 transition-opacity whitespace-nowrap`}>ADD PROTOCOL</button>
                       </div>
                   </div>
                   <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                       {state.customCommands.map(cmd => (
                           <div key={cmd.id} className="flex justify-between items-center bg-white/5 p-2 rounded border border-gray-800 hover:border-gray-600 transition-colors group">
                               <div className="flex gap-3 items-center">
                                   <div className={`px-2 py-0.5 bg-${currentTheme.primary}/10 border border-${currentTheme.primary}/30 rounded text-${currentTheme.primary} font-mono text-[10px] font-bold`}>{cmd.trigger}</div>
                                   <span className="text-gray-600 text-[10px]">➜</span>
                                   <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                       <span className="text-gray-300 font-mono text-[10px] font-bold">{cmd.action}</span>
                                       <span className="text-gray-500 font-mono text-[9px] truncate max-w-[150px]">{cmd.payload}</span>
                                   </div>
                               </div>
                               <button onClick={() => handleDeleteCommand(cmd.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                           </div>
                       ))}
                       {state.customCommands.length === 0 && (<div className="text-center text-[10px] text-gray-600 font-mono py-4 border-2 border-dashed border-gray-800/50 rounded">NO CUSTOM PROTOCOLS ACTIVE</div>)}
                   </div>
               </div>
            </section>
          </div>
        );
      default: return ( <ChatInterface messages={state.messages} setMessages={(msgs) => setState(prev => ({ ...prev, messages: typeof msgs === 'function' ? msgs(prev.messages) : msgs }))} theme={currentTheme} isSpeaking={state.isSpeaking} setIsSpeaking={(v) => setState(prev => ({ ...prev, isSpeaking: v }))} isListening={state.isListening} setIsListening={(v) => setState(prev => ({ ...prev, isListening: v }))} saveMemory={(text) => { saveMemory({ id: Date.now().toString(), content: text, type: 'note', createdAt: Date.now(), tags: ['chat'] }); }} soundEnabled={state.soundEffectsOn} voiceEnabled={state.voiceEnabled} wakeWordEnabled={state.wakeWordEnabled} voiceSkin={state.voiceSkin} voiceCalibration={state.voiceCalibration} onAICommand={handleAICommand} learningProfile={state.learningProfile} onUpdateProfile={handleUpdateProfile} customCommands={state.customCommands} avatar={state.avatar} onRandomAvatar={handleRandomAvatar} isFullScreen={state.isFullScreenChat} toggleFullScreen={() => setState(prev => ({ ...prev, isFullScreenChat: !prev.isFullScreenChat }))} currentView={state.view} userRole={state.userRole} personality={state.personality} masterName={state.masterProfile.name} musicState={state.musicState} /> );
    }
  };

  const NAV_ITEMS = [ { view: AppView.CHAT, label: 'COMM_LINK', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.466.037.893.281 1.153.671L12 21l2.652-4.178c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>) }, { view: AppView.MEMORY, label: 'MEMORY_CORE', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>) }, { view: AppView.PRODUCTIVITY, label: 'TASK_HUD', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>) }, { view: AppView.DEV_TOOLS, label: 'DEV_CONSOLE', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>) }, { view: AppView.SETTINGS, label: 'SYS_CONFIG', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.42 24.42 0 010 3.46" /></svg>) } ];

  // --- FLOW CONTROL ---
  
  // 1. Check License
  if (!isLicensed) {
      return (
          <>
            <ParticleBackground theme={currentTheme} />
            <LicenseGate theme={currentTheme} onSuccess={handleLicenseSuccess} />
            <InstallPrompt theme={currentTheme} />
          </>
      );
  }

  // 2. Check Setup
  if (!isSetupComplete) {
      return (
          <>
            <ParticleBackground theme={currentTheme} />
            <SetupWizard 
                theme={currentTheme} 
                licenseKey={state.masterProfile.licenseKey} // Pass stored key
                onComplete={handleSetupComplete} 
            />
            <InstallPrompt theme={currentTheme} />
          </>
      );
  }

  // 3. Security Check
  if (!isAuthenticated) {
     return (
        <>
            <SecurityGate theme={currentTheme} masterProfile={state.masterProfile} onAuthenticate={handleAuthentication} />
            <InstallPrompt theme={currentTheme} />
        </>
     );
  }

  // 4. Main App
  return (
    <div className={`relative h-screen w-screen overflow-hidden flex flex-col md:flex-row font-sans perspective-1000`}>
      <InstallPrompt theme={currentTheme} />
      <ParticleBackground theme={currentTheme} />
      <SystemOverlay type={state.activeOverlay} theme={currentTheme} onClose={handleAlarmClose} />
      <nav className={`hidden md:flex flex-col w-20 bg-black/80 border-r border-gray-800 backdrop-blur-xl z-50`}>
        <div className="p-4 flex justify-center mb-6"><div className={`w-10 h-10 rounded-full bg-${currentTheme.primary}/20 border border-${currentTheme.primary} flex items-center justify-center animate-pulse-glow`}><div className={`w-4 h-4 rounded-full bg-${currentTheme.primary}`}></div></div></div>
        <div className="flex-1 flex flex-col items-center gap-6">{NAV_ITEMS.map(item => (<button key={item.label} onClick={() => changeView(item.view)} className={`group relative p-3 rounded-xl transition-all duration-300 ${state.view === item.view ? `bg-${currentTheme.primary}/20 text-${currentTheme.primary} shadow-[0_0_15px_rgba(0,0,0,0.5)]` : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title={item.label}>{item.icon}<span className={`absolute left-full ml-4 px-2 py-1 bg-black border border-${currentTheme.border} text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50`}>{item.label}</span>{state.view === item.view && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-${currentTheme.primary} rounded-r`}></div>}</button>))}</div>
        <div className="p-4 flex flex-col items-center text-[10px] text-gray-600 font-mono"><div>v3.3</div><div>SYS</div></div>
      </nav>
      <main className={`flex-1 relative flex flex-col min-h-0 z-10 transition-transform duration-500 ease-out origin-center ${state.is3DMode ? 'transform scale-[0.95] rotate-x-2' : ''}`} style={state.is3DMode ? { transform: 'perspective(1500px) rotateX(2deg) scale(0.95)', boxShadow: `0 0 100px ${currentTheme.bg === 'black' ? '#000' : 'rgba(0,0,0,0.5)'} inset` } : {}}>
        <div className={`flex-none h-1 bg-gradient-to-r from-transparent via-${currentTheme.primary} to-transparent opacity-50`}></div>
        <div className="flex-1 overflow-hidden relative">{renderView()}</div>
        <nav className={`md:hidden flex-none flex justify-around items-center p-2 bg-black/90 border-t border-gray-800 backdrop-blur-xl z-50 pb-safe`}>{NAV_ITEMS.map(item => (<button key={item.label} onClick={() => changeView(item.view)} className={`flex flex-col items-center gap-1 p-2 rounded transition-all ${state.view === item.view ? `text-${currentTheme.primary}` : 'text-gray-500'}`}>{item.icon}<span className="text-[9px] font-mono tracking-wider">{item.label}</span>{state.view === item.view && <div className={`w-1 h-1 rounded-full bg-${currentTheme.primary} mt-1`}></div>}</button>))}</nav>
      </main>
    </div>
  );
};

export default App;
