
import React, { useEffect, useState, useRef } from 'react';
import { MemoryItem, ThemeColors, MusicTrack } from '../types';
import { getMemories, deleteMemory, saveMemory, getVaultPassword, setVaultPassword, getMusicTracks, saveMusicTrack, deleteMusicTrack } from '../services/storageService';
import { playSound } from '../services/audioService';

interface MemoryVaultProps {
  theme: ThemeColors;
}

const MemoryVault: React.FC<MemoryVaultProps> = ({ theme }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [filter, setFilter] = useState('');
  
  // View Mode: LIST, NEURAL, or MUSIC
  const [viewMode, setViewMode] = useState<'LIST' | 'NEURAL' | 'MUSIC'>('LIST');

  // Security State
  const [isLocked, setIsLocked] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  // Adding New Memory State
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newType, setNewType] = useState<MemoryItem['type']>('note');

  // Music Upload State
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicName, setMusicName] = useState('');

  // Neural Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkSecurity();
  }, []);

  useEffect(() => {
      if (viewMode === 'NEURAL') {
          initNeuralWeb();
      }
  }, [viewMode, memories, theme]);

  const checkSecurity = () => {
    const storedPass = getVaultPassword();
    if (storedPass) {
      setHasPassword(true);
      setIsLocked(true);
    } else {
      setHasPassword(false);
      setIsLocked(false);
      loadMemories();
      loadMusic();
    }
  };

  const loadMemories = async () => {
    const data = await getMemories();
    setMemories(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  const loadMusic = async () => {
      const data = await getMusicTracks();
      setMusicTracks(data.sort((a,b) => b.createdAt - a.createdAt));
  };

  // --- NEURAL WEB VISUALIZATION ENGINE ---
  const initNeuralWeb = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;

      // Extract nodes (memories) and edges (shared tags)
      const nodes = memories.map(m => ({
          ...m,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 5 + Math.min(m.tags.length * 2, 10)
      }));

      // Mouse interaction
      let mouse = { x: 0, y: 0, active: false };
      canvas.onmousemove = (e) => {
          const rect = canvas.getBoundingClientRect();
          mouse.x = e.clientX - rect.left;
          mouse.y = e.clientY - rect.top;
          mouse.active = true;
      };
      canvas.onmouseleave = () => { mouse.active = false; };

      let animationId: number;

      const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Helper for colors
          const getColor = (twClass: string) => {
             // simplified mapping
             if (twClass.includes('cyan')) return '#06b6d4';
             if (twClass.includes('red')) return '#ef4444';
             if (twClass.includes('green')) return '#22c55e';
             if (twClass.includes('purple')) return '#a855f7';
             return '#ffffff';
          };
          const mainColor = getColor(theme.primary);
          const accentColor = getColor(theme.accent);

          // Draw Edges First
          ctx.lineWidth = 0.5;
          for (let i = 0; i < nodes.length; i++) {
              for (let j = i + 1; j < nodes.length; j++) {
                  const n1 = nodes[i];
                  const n2 = nodes[j];
                  
                  // Connect if they share at least one tag
                  const shared = n1.tags.filter(t => n2.tags.includes(t));
                  if (shared.length > 0) {
                      const dx = n1.x - n2.x;
                      const dy = n1.y - n2.y;
                      const dist = Math.sqrt(dx*dx + dy*dy);
                      if (dist < 300) {
                          ctx.strokeStyle = mainColor;
                          ctx.globalAlpha = (1 - dist/300) * 0.4;
                          ctx.beginPath();
                          ctx.moveTo(n1.x, n1.y);
                          ctx.lineTo(n2.x, n2.y);
                          ctx.stroke();
                      }
                      
                      // Attraction force (spring)
                      if (dist > 100) {
                          n1.vx -= dx * 0.0001;
                          n1.vy -= dy * 0.0001;
                          n2.vx += dx * 0.0001;
                          n2.vy += dy * 0.0001;
                      }
                  }
              }
          }
          ctx.globalAlpha = 1;

          // Draw Nodes
          nodes.forEach(node => {
              // Physics
              node.x += node.vx;
              node.y += node.vy;

              // Boundaries
              if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
              if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

              // Mouse Repulsion
              if (mouse.active) {
                  const dx = mouse.x - node.x;
                  const dy = mouse.y - node.y;
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  if (dist < 150) {
                      const force = (150 - dist) / 150;
                      node.vx -= (dx / dist) * force * 0.5;
                      node.vy -= (dy / dist) * force * 0.5;
                  }
              }

              // Draw
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
              ctx.fillStyle = node.type === 'directive' ? accentColor : mainColor;
              ctx.shadowBlur = 10;
              ctx.shadowColor = node.type === 'directive' ? accentColor : mainColor;
              ctx.fill();
              ctx.shadowBlur = 0;

              // Label on hover
              if (mouse.active) {
                   const dx = mouse.x - node.x;
                   const dy = mouse.y - node.y;
                   if (Math.sqrt(dx*dx + dy*dy) < node.radius + 10) {
                       ctx.fillStyle = '#fff';
                       ctx.font = '10px monospace';
                       ctx.fillText(node.content.substring(0, 20) + '...', node.x + 15, node.y);
                       ctx.fillStyle = '#888';
                       ctx.fillText(`[${node.tags.join(',')}]`, node.x + 15, node.y + 12);
                   }
              }
          });

          animationId = requestAnimationFrame(draw);
      };
      draw();
      
      return () => cancelAnimationFrame(animationId);
  };
  // -------------------------------------

  const handleUnlock = (e?: React.FormEvent) => {
    e?.preventDefault();
    const storedPass = getVaultPassword();
    if (passwordInput === storedPass) {
      playSound('success');
      setIsLocked(false);
      setPasswordInput('');
      setErrorMsg('');
      loadMemories();
      loadMusic();
    } else {
      playSound('alert');
      setErrorMsg('ACCESS DENIED // INVALID CREDENTIALS');
      setPasswordInput('');
    }
  };

  const handleSetPassword = () => {
    if (!newPassword.trim()) return;
    setVaultPassword(newPassword);
    playSound('success');
    setHasPassword(true);
    setIsSettingPassword(false);
    setNewPassword('');
    setIsLocked(false); 
  };

  const handleRemovePassword = () => {
    if (window.confirm("WARNING: DISABLING SECURITY PROTOCOL. VAULT WILL BE OPEN. CONFIRM?")) {
      setVaultPassword(null);
      setHasPassword(false);
      playSound('alert');
    }
  };

  const handleLockVault = () => {
    playSound('click');
    setIsLocked(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("PURGING MEMORY DATABANK. CONFIRM?")) {
        await deleteMemory(id);
        playSound('click');
        loadMemories();
    }
  };

  // --- ADDING MEMORY LOGIC ---
  const handleAddMemory = async () => {
    if (!newContent.trim()) {
        playSound('alert');
        return;
    }
    
    playSound('success');
    const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    await saveMemory({
        id: Date.now().toString(),
        content: newContent,
        tags: tagsArray,
        type: newType,
        createdAt: Date.now()
    });

    setNewContent('');
    setNewTags('');
    setIsAdding(false);
    loadMemories();
  };
  // ---------------------------

  // --- MUSIC UPLOAD LOGIC ---
  const handleMusicFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setMusicFile(file);
          // Auto fill name if empty
          if (!musicName) {
              setMusicName(file.name.replace(/\.[^/.]+$/, "")); // remove extension
          }
      }
  };

  const handleUploadMusic = async () => {
      if (!musicFile || !musicName) {
          playSound('alert');
          return;
      }
      setIsUploadingMusic(true);
      playSound('success');

      // Create Music Track
      const track: MusicTrack = {
          id: Date.now().toString(),
          name: musicName,
          blob: musicFile, // Store the blob directly
          type: musicFile.type,
          size: musicFile.size,
          createdAt: Date.now()
      };

      await saveMusicTrack(track);
      setMusicFile(null);
      setMusicName('');
      setIsUploadingMusic(false);
      loadMusic();
  };

  const handleDeleteMusic = async (id: string) => {
      if (confirm('DELETE AUDIO TRACK PERMANENTLY?')) {
          await deleteMusicTrack(id);
          playSound('click');
          loadMusic();
      }
  };
  // --------------------------

  const startEditing = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditTags(item.tags.join(', '));
    playSound('click');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
    setEditTags('');
  };

  const saveEdit = async (originalItem: MemoryItem) => {
    const updatedTags = editTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const updatedItem: MemoryItem = {
      ...originalItem,
      content: editContent,
      tags: updatedTags
    };
    await saveMemory(updatedItem);
    playSound('success');
    setEditingId(null);
    loadMemories();
  };

  const filtered = memories.filter(m => {
    const term = filter.toLowerCase();
    return m.content.toLowerCase().includes(term) || m.tags.some(t => t.toLowerCase().includes(term));
  });

  // LOCK SCREEN VIEW
  if (isLocked) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
         <div className={`absolute top-0 left-0 w-full h-1 bg-${theme.primary} animate-scanline opacity-50`}></div>
         
         <div className="z-10 w-full max-w-md p-8 border border-gray-800 bg-gray-900/80 backdrop-blur-xl rounded-lg shadow-2xl relative">
            <div className={`absolute top-0 left-0 w-full h-1 bg-${theme.primary}`}></div>
            <div className={`absolute bottom-0 right-0 w-full h-1 bg-${theme.primary}`}></div>
            
            <div className="text-center mb-8">
              <div className={`text-6xl text-${theme.primary} mb-4 flex justify-center`}>
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              </div>
              <h2 className={`text-2xl font-orbitron tracking-widest text-${theme.accent}`}>SECURE VAULT</h2>
              <p className="text-xs text-gray-500 font-mono mt-2">BIOMETRIC AUTHENTICATION REQUIRED</p>
            </div>

            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
               <input 
                 type="password" 
                 autoFocus
                 placeholder="ENTER ACCESS CODE"
                 value={passwordInput}
                 onChange={(e) => setPasswordInput(e.target.value)}
                 className={`bg-black/50 border border-gray-700 text-center text-xl text-white p-3 rounded focus:border-${theme.primary} outline-none tracking-widest font-mono placeholder-gray-700 transition-all focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]`}
               />
               
               {errorMsg && (
                 <div className="text-red-500 text-xs font-mono text-center animate-pulse">{errorMsg}</div>
               )}

               <button 
                 type="submit"
                 className={`bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} py-3 font-bold tracking-widest hover:bg-${theme.primary}/40 transition-all rounded uppercase`}
               >
                 UNLOCK DATABANKS
               </button>
            </form>
         </div>
      </div>
    );
  }

  // UNLOCKED VIEW
  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-gray-800 pb-2 gap-4">
        <div>
          <h2 className={`text-2xl font-bold text-${theme.primary} tracking-widest font-orbitron`}>
            MEMORY VAULT
          </h2>
          <span className="text-xs text-gray-500 font-mono">ENCRYPTED STORAGE // {memories.length} ENTRIES // {musicTracks.length} AUDIO TRACKS</span>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
            {/* View Toggles */}
           <button 
             onClick={() => { setViewMode('LIST'); playSound('click'); }}
             className={`px-3 py-1 text-xs border rounded font-mono transition-colors ${viewMode === 'LIST' ? `bg-${theme.primary}/20 border-${theme.primary} text-${theme.primary}` : `border-gray-700 text-gray-400 hover:text-white`}`}
           >
              📄 DATA
           </button>
           <button 
             onClick={() => { setViewMode('NEURAL'); playSound('click'); }}
             className={`px-3 py-1 text-xs border rounded font-mono transition-colors ${viewMode === 'NEURAL' ? `bg-${theme.primary}/20 border-${theme.primary} text-${theme.primary}` : `border-gray-700 text-gray-400 hover:text-white`}`}
           >
              🕸️ NEURAL
           </button>
           <button 
             onClick={() => { setViewMode('MUSIC'); playSound('click'); }}
             className={`px-3 py-1 text-xs border rounded font-mono transition-colors flex items-center gap-1 ${viewMode === 'MUSIC' ? `bg-${theme.accent}/20 border-${theme.accent} text-${theme.accent}` : `border-gray-700 text-gray-400 hover:text-white`}`}
           >
              🎵 SONIC CORE
           </button>

           <div className="w-px h-6 bg-gray-800 mx-2 hidden md:block"></div>

           <button 
             onClick={() => { setIsAdding(true); playSound('click'); }}
             className={`px-3 py-1 text-xs border border-${theme.accent} bg-${theme.accent}/20 text-white rounded font-mono transition-colors flex items-center gap-1 hover:border-${theme.primary} hover:bg-${theme.accent}/40`}
           >
             + ADD DATA
           </button>

           {hasPassword ? (
             <button 
                 onClick={handleLockVault}
                 className="p-2 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-500 rounded transition-colors"
                 title="Lock Vault"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               </button>
           ) : (
             !isSettingPassword && (
                <button 
                  onClick={() => setIsSettingPassword(true)}
                  className={`px-3 py-1 text-xs border border-${theme.border} text-${theme.secondary} hover:bg-${theme.primary}/10 rounded font-mono transition-colors`}
                >
                  SET PASS
                </button>
             )
           )}
        </div>
      </div>

      {/* --- MANUAL MEMORY ENTRY MODAL --- */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className={`w-full max-w-lg bg-black border border-${theme.primary} shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-lg flex flex-col overflow-hidden`}>
                
                {/* Modal Header */}
                <div className={`p-4 border-b border-gray-800 bg-${theme.primary}/10 flex justify-between items-center`}>
                   <h3 className={`text-sm font-mono text-${theme.primary} font-bold tracking-wider`}>NEURAL INTERFACE // INPUT MODE</h3>
                   <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="text-xs text-gray-500 font-mono mb-2 block">DATA TYPE</label>
                        <div className="flex gap-2">
                           {(['note', 'fact', 'directive'] as const).map(t => (
                              <button
                                key={t}
                                onClick={() => { setNewType(t); playSound('click'); }}
                                className={`flex-1 py-2 text-xs rounded border uppercase transition-all font-mono
                                  ${newType === t 
                                     ? `bg-${theme.primary}/20 border-${theme.primary} text-${theme.primary}` 
                                     : 'border-gray-800 text-gray-500 hover:border-gray-600'}
                                `}
                              >
                                  {t}
                              </button>
                           ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-mono mb-2 block">CONTENT</label>
                        <textarea
                           placeholder="ENTER MEMORY CONTENT..."
                           value={newContent}
                           onChange={(e) => setNewContent(e.target.value)}
                           className={`w-full bg-gray-900/50 border border-gray-700 p-4 text-sm font-mono text-white focus:border-${theme.primary} outline-none rounded h-40 resize-none leading-relaxed`}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-mono mb-2 block">TAGS</label>
                        <input
                          type="text"
                          placeholder="#project, #urgent"
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                          className={`w-full bg-gray-900/50 border border-gray-700 p-3 text-sm font-mono text-gray-300 focus:border-${theme.primary} outline-none rounded`}
                        />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-black">
                    <button
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 text-xs border border-gray-700 text-gray-400 rounded hover:bg-gray-900 font-mono"
                    >
                      ABORT
                    </button>
                    <button
                      onClick={handleAddMemory}
                      className={`px-6 py-2 bg-${theme.primary} text-black font-bold text-xs tracking-widest hover:bg-${theme.accent} transition-colors rounded`}
                    >
                      UPLOAD TO VAULT
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* PASSWORD SETTING UI */}
      {isSettingPassword && (
        <div className="mb-6 p-4 border border-gray-700 bg-gray-900/50 rounded flex flex-col gap-3 animate-fade-in-down">
           <h3 className={`text-sm font-mono text-${theme.accent}`}>CONFIGURE SECURITY ACCESS</h3>
           <div className="flex gap-2">
             <input 
               type="password"
               placeholder="NEW PASSCODE"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               className={`flex-1 bg-black border border-gray-600 p-2 text-white font-mono rounded focus:border-${theme.primary} outline-none`}
             />
             <button onClick={handleSetPassword} className={`px-4 bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} rounded hover:bg-${theme.primary}/40`}>
               CONFIRM
             </button>
             <button onClick={() => setIsSettingPassword(false)} className="px-4 border border-gray-700 text-gray-400 rounded hover:bg-gray-800">
               CANCEL
             </button>
           </div>
        </div>
      )}
      
      {/* SEARCH BAR (Only visible in LIST mode) */}
      {viewMode === 'LIST' && (
          <div className="mb-6 relative">
            <input 
              type="text" 
              placeholder="SEARCH MEMORIES OR TAGS..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`w-full bg-black/30 border border-${theme.border} p-3 rounded text-sm focus:outline-none focus:border-${theme.accent} transition-colors text-white font-mono`}
            />
            <div className={`absolute right-3 top-3 text-${theme.primary}`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
            </div>
          </div>
      )}

      {/* --- NEURAL VIEW --- */}
      {viewMode === 'NEURAL' && (
          <div className="flex-1 rounded border border-gray-800 bg-black/50 relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-500 z-10 pointer-events-none">
                 NEURAL WEB VISUALIZATION // INTERACTIVE
              </div>
              <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          </div>
      )}

      {/* --- MUSIC VAULT VIEW --- */}
      {viewMode === 'MUSIC' && (
          <div className="flex-1 flex flex-col gap-6 animate-fade-in">
              {/* Upload Section */}
              <div className="glass-panel p-4 rounded border border-gray-800">
                  <h3 className={`text-sm font-bold text-${theme.accent} font-orbitron mb-4`}>UPLOAD AUDIO DATA</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                          <label className="text-[10px] text-gray-500 font-mono mb-1 block">TRACK IDENTIFIER (NAME)</label>
                          <input 
                            type="text"
                            placeholder="e.g. Battle Theme, Rainfall"
                            value={musicName}
                            onChange={(e) => setMusicName(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 p-2 rounded text-xs text-white font-mono outline-none focus:border-white"
                          />
                      </div>
                      <div className="w-full md:w-auto">
                          <input 
                            type="file" 
                            ref={musicInputRef}
                            onChange={handleMusicFileSelect}
                            accept="audio/*"
                            className="hidden" 
                          />
                          <button 
                            onClick={() => musicInputRef.current?.click()}
                            className="w-full px-4 py-2 border border-gray-600 rounded text-xs text-gray-300 hover:bg-white/5 flex items-center justify-center gap-2"
                          >
                              {musicFile ? musicFile.name : 'SELECT AUDIO FILE'}
                          </button>
                      </div>
                      <button 
                        onClick={handleUploadMusic}
                        disabled={isUploadingMusic || !musicFile}
                        className={`w-full md:w-auto px-6 py-2 rounded text-xs font-bold font-mono transition-all ${isUploadingMusic ? 'bg-gray-800 text-gray-500' : `bg-${theme.primary}/20 border border-${theme.primary} text-${theme.primary} hover:bg-${theme.primary}/40`}`}
                      >
                          {isUploadingMusic ? 'UPLOADING...' : 'SAVE TO VAULT'}
                      </button>
                  </div>
              </div>

              {/* Track List */}
              <div className="grid grid-cols-1 gap-2">
                  <h3 className="text-xs text-gray-500 font-mono mb-2">STORED TRACKS ({musicTracks.length})</h3>
                  {musicTracks.map(track => (
                      <div key={track.id} className="flex items-center justify-between p-3 rounded bg-white/5 border border-gray-800 hover:border-gray-600 group">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-${theme.primary}/10 text-${theme.primary}`}>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                              </div>
                              <div>
                                  <div className={`text-sm font-bold text-gray-200`}>{track.name}</div>
                                  <div className="text-[10px] text-gray-600 font-mono">{(track.size / 1024 / 1024).toFixed(2)} MB • {new Date(track.createdAt).toLocaleDateString()}</div>
                              </div>
                          </div>
                          <button onClick={() => handleDeleteMusic(track.id)} className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                  ))}
                  {musicTracks.length === 0 && (
                      <div className="text-center text-gray-600 font-mono py-10 border-2 border-dashed border-gray-800 rounded">
                          NO AUDIO DATA FOUND. UPLOAD FILES TO ENABLE MUSIC PLAYBACK.
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'LIST' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
            {filtered.map(item => (
              <div key={item.id} className={`glass-panel p-4 rounded hover:border-${theme.accent} transition-all group relative flex flex-col ${item.type === 'directive' ? `border-l-4 border-l-${theme.accent}` : ''}`}>
                
                {editingId === item.id ? (
                    // EDIT MODE
                    <div className="flex flex-col gap-3 flex-1">
                       <div className={`text-xs text-${theme.secondary} font-mono mb-1`}>EDITING DATA_ID: {item.id.slice(-6)}</div>
                       <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className={`w-full h-32 bg-black/50 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-${theme.primary} outline-none resize-none leading-relaxed`}
                       />
                       <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-500 font-mono">TAGS (COMMA SEPARATED)</label>
                          <input 
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            className={`w-full bg-black/50 border border-gray-600 rounded p-2 text-xs text-gray-300 focus:border-${theme.primary} outline-none`}
                          />
                       </div>
                       <div className="flex justify-end gap-2 mt-2">
                          <button onClick={cancelEditing} className="px-3 py-1 text-xs border border-gray-700 text-gray-400 rounded hover:bg-gray-800">CANCEL</button>
                          <button onClick={() => saveEdit(item)} className={`px-3 py-1 text-xs border border-${theme.primary} text-${theme.primary} bg-${theme.primary}/10 rounded hover:bg-${theme.primary}/30`}>SAVE CHANGES</button>
                       </div>
                    </div>
                ) : (
                    // VIEW MODE
                    <>
                        <div className={`absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/50 md:bg-transparent rounded px-1`}>
                            <button onClick={() => startEditing(item)} className="p-1 text-gray-400 hover:text-white" title="Edit">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        <div className={`text-xs text-${theme.secondary} mb-2 font-mono flex items-center gap-2`}>
                            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${item.type === 'directive' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'} uppercase`}>
                               {item.type}
                            </span>
                            <span>ID:{item.id.slice(-4)}</span>
                            <span className="opacity-30">|</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-gray-200 leading-relaxed font-light whitespace-pre-wrap mb-4 flex-1 text-sm md:text-base">
                            {item.content}
                        </p>
                        
                        <div className="mt-auto flex flex-wrap gap-2">
                            {item.tags.map(tag => (
                                <span key={tag} className={`text-[10px] px-2 py-0.5 border border-${theme.border} rounded-full text-${theme.primary} bg-${theme.primary}/5 uppercase tracking-wide`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </>
                )}
              </div>
            ))}
             {filtered.length === 0 && (
                 <div className="text-center mt-20 opacity-50 font-mono col-span-2">
                   NO DATA FOUND IN LOCAL STORAGE.
                 </div>
              )}
          </div>
      )}
    </div>
  );
};

export default MemoryVault;
