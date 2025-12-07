
import React, { useEffect, useRef } from 'react';
import { AvatarType, ThemeColors } from '../types';

interface HologramProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean; 
  themeColors: ThemeColors;
  avatar: AvatarType;
  onClick?: () => void;
}

const Hologram: React.FC<HologramProps> = ({ isActive, isSpeaking, isListening, themeColors, avatar, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Analysis State
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Microphone for Listening Visuals
  useEffect(() => {
    if (isListening) {
      const initMic = async () => {
        try {
          if (streamRef.current?.active) return;

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256; // Higher resolution for better visuals
          analyser.smoothingTimeConstant = 0.6;
          analyserRef.current = analyser;
          
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
        } catch (e) {
          console.warn("Hologram Mic Access Failed (might be used by SpeechRecognition):", e);
        }
      };
      initMic();
    } else {
      // Cleanup Mic
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
         streamRef.current = null;
      }
      if (audioContextRef.current?.state === 'running') {
         audioContextRef.current.suspend();
      }
    }
  }, [isListening]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;
    
    // Avatar Specific State
    let blinkTimer = 0;
    let nextBlinkTime = 150 + Math.random() * 300;
    let eyeOpenness = 1; 
    let isBlinking = false;
    let blinkPhase: 'closing' | 'opening' = 'closing';

    let particles: {x:number, y:number, vx:number, vy:number, life:number, size:number}[] = [];

    const render = () => {
      tick++;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Determine Base Color from Theme
      let baseColor = '#06b6d4'; // Cyan default
      if (themeColors.primary.includes('red')) baseColor = '#ef4444';
      if (themeColors.primary.includes('green')) baseColor = '#22c55e';
      if (themeColors.primary.includes('fuchsia')) baseColor = '#d946ef';
      if (themeColors.primary.includes('slate')) baseColor = '#94a3b8';
      if (themeColors.primary.includes('neutral')) baseColor = '#a3a3a3';
      if (themeColors.primary.includes('yellow')) baseColor = '#eab308';
      if (themeColors.primary.includes('orange')) baseColor = '#f97316';
      if (themeColors.primary.includes('teal')) baseColor = '#14b8a6';
      if (themeColors.primary.includes('indigo')) baseColor = '#6366f1';

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = baseColor;
      ctx.fillStyle = baseColor;
      ctx.shadowColor = baseColor;

      // --- CALCULATE DYNAMICS ---
      
      // 1. Listening Volume (Real)
      let listenVol = 0;
      let freqData = new Uint8Array(0);
      
      if (isListening && analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          freqData = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(freqData);
          let sum = 0;
          for(let i=0; i<bufferLength; i++) sum += freqData[i];
          listenVol = (sum / bufferLength) / 255; // 0 to 1
      } else if (isListening) {
          // Fallback simulation
          listenVol = 0.1 + Math.random() * 0.1; 
      }

      // 2. Speaking Intensity (Simulated)
      let speechInt = 0;
      if (isSpeaking) {
          // Use Perlin-ish noise for organic speech movement
          const time = Date.now() * 0.015;
          speechInt = (Math.sin(time) + Math.sin(time * 2.5) + Math.sin(time * 0.5)) / 3; 
          speechInt = 0.2 + Math.abs(speechInt) * 0.8; // Normalize
      }

      // Global Rotation / Jitter
      const activityLevel = Math.max(listenVol, speechInt);
      const rot = (tick * 0.02) + (activityLevel * 0.1);

      // --- RENDERERS ---

      const drawMarco3_0 = () => {
          // MARCO 3.0: THE LEGENDARY JARVIS CONSTRUCT
          // "Pure Data, Pure Power"
          const scale = 1.4;
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.05);
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);

          // 1. THE HALO (Orbits)
          // Multiple concentric rings rotating on different axes to create a sphere-like HUD volume
          ctx.lineWidth = 1;
          const rings = 4;
          for (let i = 0; i < rings; i++) {
              ctx.save();
              // Complex 3D-ish rotation
              const rx = Math.sin(tick * 0.01 + i) * 0.2;
              const ry = Math.cos(tick * 0.01 + i) * 0.2;
              ctx.transform(1, rx, ry, 1, 0, 0); 
              
              ctx.rotate(rot * (i % 2 === 0 ? 1 : -1) * (0.5 + i * 0.2));
              const r = 80 + (i * 15) + (energy * 10);
              
              ctx.beginPath();
              // Segmented rings (Jarvis style)
              const segments = 6 + i * 2;
              for (let j = 0; j < segments; j++) {
                  const angle = (j / segments) * Math.PI * 2;
                  const gap = 0.1;
                  ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                  ctx.arc(0, 0, r, angle, angle + (Math.PI*2/segments) - gap);
              }
              
              ctx.strokeStyle = i === 2 ? '#ffffff' : baseColor;
              ctx.globalAlpha = 0.3 + (energy * 0.2);
              ctx.stroke();
              
              // Data Nodes on rings
              if (i === 1 || i === 3) {
                  const nodeAngle = tick * 0.05 * (i % 2 === 0 ? 1 : -1);
                  const nx = Math.cos(nodeAngle) * r;
                  const ny = Math.sin(nodeAngle) * r;
                  ctx.fillStyle = '#fff';
                  ctx.shadowBlur = 10;
                  ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI*2); ctx.fill();
                  ctx.shadowBlur = 0;
              }
              ctx.restore();
          }

          // 2. THE FACE CONSTRUCT (Fragmented Geometry)
          // We draw the face not as skin, but as interlocking metallic plates
          const jawOpen = isSpeaking ? speechInt * 10 : 0;
          
          // Face Gradient (Metallic)
          const faceGrad = ctx.createLinearGradient(-30, -50, 30, 50);
          faceGrad.addColorStop(0, '#1a1a1a');
          faceGrad.addColorStop(0.5, '#0a0a0a');
          faceGrad.addColorStop(1, '#111111');
          
          ctx.fillStyle = faceGrad;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 15; // Glowy edges

          // -- HELMET / FOREHEAD --
          ctx.beginPath();
          ctx.moveTo(-35, -20);
          ctx.lineTo(-45, -50);
          ctx.lineTo(0, -60);
          ctx.lineTo(45, -50);
          ctx.lineTo(35, -20);
          ctx.lineTo(0, -10); // Brow center
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          // -- CHEEK PLATES --
          // Left
          ctx.beginPath();
          ctx.moveTo(-38, -15);
          ctx.lineTo(-50, 0);
          ctx.lineTo(-45, 40);
          ctx.lineTo(-20, 50);
          ctx.lineTo(-15, 20); // Inner cheek
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          // Right
          ctx.beginPath();
          ctx.moveTo(38, -15);
          ctx.lineTo(50, 0);
          ctx.lineTo(45, 40);
          ctx.lineTo(20, 50);
          ctx.lineTo(15, 20);
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          // -- JAW (MOVABLE) --
          ctx.save();
          ctx.translate(0, jawOpen * 0.5); // Slide down
          
          ctx.beginPath();
          ctx.moveTo(-18, 52);
          ctx.lineTo(-25, 75); // Chin L
          ctx.lineTo(0, 85);   // Chin Pt
          ctx.lineTo(25, 75);  // Chin R
          ctx.lineTo(18, 52);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
          
          // Mouth Vent (Speaker)
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.moveTo(-10, 65);
          ctx.lineTo(10, 65);
          ctx.lineTo(8, 75);
          ctx.lineTo(-8, 75);
          ctx.fill();
          // Vent lines
          ctx.strokeStyle = '#333';
          ctx.beginPath(); ctx.moveTo(0, 65); ctx.lineTo(0, 75); ctx.stroke();
          
          ctx.restore();

          // 3. THE EYES (PURE ENERGY)
          // Sharp, angled, aggressive
          const squint = isListening ? 0.6 : 1;
          const eyeH = 8 * squint;
          
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 20;
          
          // L Eye
          ctx.beginPath();
          ctx.moveTo(-10, 5);
          ctx.lineTo(-35, 0);
          ctx.lineTo(-40, -8);
          ctx.lineTo(-15, -5);
          ctx.closePath();
          ctx.fill();
          // R Eye
          ctx.beginPath();
          ctx.moveTo(10, 5);
          ctx.lineTo(35, 0);
          ctx.lineTo(40, -8);
          ctx.lineTo(15, -5);
          ctx.closePath();
          ctx.fill();
          
          ctx.shadowBlur = 0;

          // 4. DATA STREAMS (Connecting Face parts)
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.6;
          
          // Network lines
          ctx.beginPath();
          ctx.moveTo(-45, -50); ctx.lineTo(-60, -70);
          ctx.moveTo(45, -50); ctx.lineTo(60, -70);
          ctx.moveTo(-50, 0); ctx.lineTo(-80, 0);
          ctx.moveTo(50, 0); ctx.lineTo(80, 0);
          ctx.stroke();
          
          // 5. FOREHEAD "ARC REACTOR" CORE
          // The brain of the system
          const coreGlow = 0.5 + (energy * 0.5);
          const coreY = -35;
          
          ctx.shadowBlur = 20 * coreGlow;
          ctx.fillStyle = baseColor;
          ctx.beginPath();
          ctx.moveTo(0, coreY - 10);
          ctx.lineTo(8, coreY);
          ctx.lineTo(0, coreY + 10);
          ctx.lineTo(-8, coreY);
          ctx.fill();
          
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(0, coreY - 5);
          ctx.lineTo(4, coreY);
          ctx.lineTo(0, coreY + 5);
          ctx.lineTo(-4, coreY);
          ctx.fill();
          ctx.shadowBlur = 0;

          // 6. AUDIO-REACTIVE WAVES (When Speaking)
          if (isSpeaking) {
             const waveCnt = 5;
             ctx.strokeStyle = baseColor;
             ctx.lineWidth = 1;
             for(let k=0; k<waveCnt; k++) {
                 const waveR = 50 + (k * 10) + (tick % 20);
                 ctx.globalAlpha = 1 - (k/waveCnt);
                 ctx.beginPath();
                 ctx.arc(0, 40, waveR, 0, Math.PI, false); // Half circle downwards
                 ctx.stroke();
             }
          }

          // 7. SCANNING BEAM (When Listening)
          if (isListening) {
             const scanY = -60 + (tick % 120);
             if (scanY < 80) {
                 ctx.strokeStyle = '#fff';
                 ctx.lineWidth = 2;
                 ctx.shadowBlur = 10;
                 ctx.globalAlpha = 0.5;
                 ctx.beginPath();
                 ctx.moveTo(-60, scanY);
                 ctx.lineTo(60, scanY);
                 ctx.stroke();
                 ctx.shadowBlur = 0;
             }
          }

          ctx.restore();
      };

      const drawMarcoRealist = () => {
          // LEGENDARY AVATAR: MARCO 2.0 (The Agent)
          // Features: Realistic Suit/Armor, Tactical Visor, Alive Movement
          
          // Organic "Alive" Movement (Lissajous figure for non-repetitive motion)
          const t = tick * 0.015;
          const headX = Math.sin(t) * 3 + Math.sin(t * 2.2) * 2;
          const headY = Math.cos(t * 0.8) * 3 + (isSpeaking ? speechInt * 2 : 0);
          
          // Tilt head when listening (like a human focusing)
          const listenTilt = isListening ? 0.1 : 0;
          const currentRot = (Math.sin(t * 0.5) * 0.05) + listenTilt;

          const scale = 1.3;
          
          ctx.save();
          ctx.translate(cx + headX, cy + headY);
          ctx.scale(scale, scale);
          ctx.rotate(currentRot);

          // 1. HOLO-AURA / DATA CLOUD
          // Background interference
          const auraGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 100);
          auraGrad.addColorStop(0, 'rgba(0,0,0,0)');
          auraGrad.addColorStop(0.6, `${baseColor}11`);
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.fill();

          // 2. NECK / COLLAR (The Suit)
          ctx.fillStyle = '#0a0a0a';
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          ctx.moveTo(-35, 70);
          ctx.lineTo(-45, 100);
          ctx.lineTo(45, 100);
          ctx.lineTo(35, 70);
          ctx.quadraticCurveTo(0, 85, -35, 70);
          ctx.fill();
          ctx.stroke();
          
          // Collar Light
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(-10, 90); ctx.lineTo(10, 90);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // 3. FACE SHAPE (Chiseled Jawline)
          const skinGrad = ctx.createLinearGradient(-40, -50, 40, 80);
          skinGrad.addColorStop(0, '#1a1a1a');
          skinGrad.addColorStop(0.5, '#262626');
          skinGrad.addColorStop(1, '#111');
          
          ctx.beginPath();
          ctx.moveTo(-40, -30); // L Temple
          ctx.lineTo(-42, 10);  // L Cheekbone
          ctx.lineTo(-35, 55 + (isSpeaking ? speechInt * 5 : 0)); // L Jaw
          ctx.lineTo(0, 75 + (isSpeaking ? speechInt * 8 : 0));  // Chin
          ctx.lineTo(35, 55 + (isSpeaking ? speechInt * 5 : 0));  // R Jaw
          ctx.lineTo(42, 10);   // R Cheekbone
          ctx.lineTo(40, -30);  // R Temple
          
          // Hairline
          ctx.quadraticCurveTo(30, -55, 0, -55);
          ctx.quadraticCurveTo(-30, -55, -40, -30);
          
          ctx.fillStyle = skinGrad;
          ctx.fill();
          
          // Cybernetic Seams (Glowing lines on face)
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = baseColor;
          ctx.globalAlpha = 0.4;
          ctx.beginPath(); ctx.moveTo(-41, 10); ctx.lineTo(-30, 20); ctx.lineTo(-25, 18); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(41, 10); ctx.lineTo(30, 20); ctx.lineTo(25, 18); ctx.stroke();
          ctx.globalAlpha = 1;

          // 4. EARS / COMMS
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.ellipse(-45, 0, 8, 15, 0, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(45, 0, 8, 15, 0, 0, Math.PI*2); ctx.fill();
          
          // Comm Link Active?
          if (isListening || isSpeaking) {
              ctx.shadowBlur = 15;
              ctx.fillStyle = baseColor;
              ctx.beginPath(); ctx.arc(-48, 0, 2, 0, Math.PI*2); ctx.fill();
              ctx.shadowBlur = 0;
          }

          // 5. HAIR (Slicked Back / High Tech)
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.moveTo(-40, -30);
          ctx.quadraticCurveTo(-50, -60, 0, -65); // Top
          ctx.quadraticCurveTo(50, -60, 40, -30);
          ctx.quadraticCurveTo(30, -55, 0, -55); // Hairline
          ctx.quadraticCurveTo(-30, -55, -40, -30);
          ctx.fill();
          
          // Hair Highlights
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-20, -55); ctx.quadraticCurveTo(-10, -60, 0, -58); ctx.stroke();
          
          // 6. VISOR / SUNGLASSES (The Agent Look)
          // Reflective Gradient
          const visorGrad = ctx.createLinearGradient(-30, -20, 30, 20);
          visorGrad.addColorStop(0, baseColor);
          visorGrad.addColorStop(0.5, '#000');
          visorGrad.addColorStop(1, baseColor);

          ctx.fillStyle = visorGrad;
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#333'; // Frame
          
          // Frames
          ctx.beginPath();
          // L Lens
          ctx.moveTo(-5, -10); // Bridge center
          ctx.lineTo(-15, -12); // Top L
          ctx.lineTo(-40, -15); // Outer Top L
          ctx.lineTo(-42, -5); 
          ctx.lineTo(-35, 10); // Cheek L
          ctx.lineTo(-10, 5); // Inner Bottom L
          ctx.closePath();
          ctx.fill(); ctx.stroke();
          
          // R Lens
          ctx.beginPath();
          ctx.moveTo(5, -10); 
          ctx.lineTo(15, -12); 
          ctx.lineTo(40, -15); 
          ctx.lineTo(42, -5); 
          ctx.lineTo(35, 10); 
          ctx.lineTo(10, 5);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
          
          // Bridge
          ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(5, -10); ctx.stroke();

          // VISOR DIGITAL EYES (Appear when processing/scanning)
          if (Math.random() > 0.95 || isListening) {
             // Scanning beam
             const scanY = -10 + Math.sin(tick * 0.2) * 10;
             ctx.strokeStyle = baseColor;
             ctx.lineWidth = 1;
             ctx.shadowBlur = 5;
             ctx.beginPath(); ctx.moveTo(-35, scanY); ctx.lineTo(-10, scanY); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(10, scanY); ctx.lineTo(35, scanY); ctx.stroke();
             ctx.shadowBlur = 0;
          }
          
          // Digital Pupils
          const eyeLookX = (Math.random() - 0.5) * 5;
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 10;
          ctx.globalAlpha = 0.8;
          ctx.beginPath(); ctx.arc(-25 + eyeLookX, -2, 1.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(25 + eyeLookX, -2, 1.5, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;


          // 7. MOUTH (Complex Lip Sync)
          const mouthY = 45;
          const jawOffset = isSpeaking ? speechInt * 10 : 0;
          
          // Upper Lip (Static)
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-12, mouthY);
          ctx.quadraticCurveTo(0, mouthY + 3, 12, mouthY);
          ctx.stroke();
          
          // Lower Lip (Dynamic)
          ctx.beginPath();
          ctx.moveTo(-10, mouthY + 1);
          ctx.quadraticCurveTo(0, mouthY + 3 + jawOffset, 10, mouthY + 1);
          ctx.stroke();

          // 8. HUD ELEMENTS (Floating Tech)
          if (isActive) {
              const ringR = 60;
              ctx.strokeStyle = baseColor;
              ctx.lineWidth = 1;
              ctx.globalAlpha = 0.3;
              
              // Rotating data ring
              ctx.beginPath();
              ctx.ellipse(0, 0, ringR, ringR * 0.3, tick * 0.01, 0, Math.PI*2);
              ctx.stroke();
              
              // Floating Hex Data
              if (tick % 10 === 0) {
                  ctx.fillStyle = baseColor;
                  ctx.font = "6px monospace";
                  ctx.fillText(Math.random().toString(16).substr(2, 4).toUpperCase(), 50, -50);
              }
              ctx.globalAlpha = 1;
          }

          ctx.restore();
      };

      const drawMarcoOfficial = () => {
          // LEGENDARY AVATAR: MARCO OFFICIAL
          // A stylized, realistic cybernetic human face
          const scale = 1.2;
          const driftX = Math.sin(tick * 0.02) * 2;
          const driftY = Math.cos(tick * 0.02) * 2;
          
          ctx.save();
          ctx.translate(cx + driftX, cy + driftY);
          ctx.scale(scale, scale);

          // 1. AURA & BACKGROUND
          // Pulsating neural halo
          const auraSize = 90 + (isSpeaking ? speechInt * 20 : 0) + (isListening ? listenVol * 40 : 5);
          const auraGrad = ctx.createRadialGradient(0, 0, 60, 0, 0, auraSize);
          auraGrad.addColorStop(0, 'rgba(0,0,0,0)');
          auraGrad.addColorStop(0.8, `${baseColor}22`); // Low opacity
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
          ctx.fill();

          // 2. FACE CONTOUR (Sharp, Cybernetic)
          const jawOpen = isSpeaking ? speechInt * 15 : 0;
          
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 10;
          
          // Head Shape
          ctx.beginPath();
          // Forehead/Cranium
          ctx.arc(0, -20, 55, Math.PI, 0); 
          // Right Cheek
          ctx.quadraticCurveTo(60, 20, 45, 60 + jawOpen * 0.2); 
          // Jaw/Chin
          ctx.lineTo(0, 85 + jawOpen * 0.5); 
          // Left Cheek
          ctx.lineTo(-45, 60 + jawOpen * 0.2);
          ctx.quadraticCurveTo(-60, 20, -55, -20);
          
          // Fill with subtle gradient for metallic look
          const skinGrad = ctx.createLinearGradient(-50, -50, 50, 100);
          skinGrad.addColorStop(0, `${baseColor}11`);
          skinGrad.addColorStop(0.5, 'rgba(0,0,0,0.8)');
          skinGrad.addColorStop(1, `${baseColor}22`);
          ctx.fillStyle = skinGrad;
          ctx.fill();
          ctx.stroke();

          // 3. EYES (Biometric)
          // Blink Logic
          blinkTimer++;
          if (!isBlinking) {
             if (blinkTimer > nextBlinkTime) { isBlinking = true; blinkPhase = 'closing'; }
          } else {
             if (blinkPhase === 'closing') {
               eyeOpenness -= 0.15;
               if (eyeOpenness <= 0) { eyeOpenness = 0; blinkPhase = 'opening'; }
             } else {
               eyeOpenness += 0.15;
               if (eyeOpenness >= 1) { eyeOpenness = 1; isBlinking = false; blinkTimer = 0; nextBlinkTime = 120 + Math.random() * 240; }
             }
          }
          
          // Focusing Squint (when listening intently)
          const squint = isListening && listenVol > 0.1 ? 0.7 : 1;
          const currentEyeH = 10 * eyeOpenness * squint;

          const drawEye = (ex: number) => {
              // Eye Socket
              ctx.beginPath();
              ctx.moveTo(ex - 15, -10);
              ctx.quadraticCurveTo(ex, -15, ex + 15, -10); // Upper lid arc
              ctx.quadraticCurveTo(ex + 18, 0, ex + 15, 5);
              ctx.quadraticCurveTo(ex, 8, ex - 15, 5);
              ctx.quadraticCurveTo(ex - 18, 0, ex - 15, -10);
              ctx.fillStyle = 'rgba(0,0,0,0.9)';
              ctx.fill();
              
              if(eyeOpenness > 0.1) {
                  // Sclera/Iris
                  ctx.save();
                  ctx.beginPath();
                  // Clip to eyelid
                  ctx.ellipse(ex, -2, 14, currentEyeH, 0, 0, Math.PI * 2); 
                  ctx.clip();
                  
                  // Iris
                  ctx.beginPath();
                  ctx.arc(ex, -2, 8, 0, Math.PI*2);
                  ctx.fillStyle = baseColor;
                  ctx.fill();
                  
                  // Pupil (Reacts to light/activity)
                  const pupilSize = 3 + (isSpeaking ? 1 : 0) + (Math.sin(tick*0.05)); 
                  ctx.beginPath();
                  ctx.arc(ex, -2, pupilSize, 0, Math.PI*2);
                  ctx.fillStyle = '#000';
                  ctx.fill();
                  
                  // Glint
                  ctx.beginPath();
                  ctx.arc(ex + 2, -5, 1.5, 0, Math.PI*2);
                  ctx.fillStyle = '#fff';
                  ctx.fill();
                  
                  ctx.restore();
                  
                  // Eyelid Lines
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.ellipse(ex, -2, 14, currentEyeH, 0, 0, Math.PI * 2);
                  ctx.stroke();
              }
          };

          drawEye(-25); // Left
          drawEye(25);  // Right

          // 4. NOSE (Subtle)
          ctx.beginPath();
          ctx.moveTo(-5, 20);
          ctx.lineTo(0, 25);
          ctx.lineTo(5, 20);
          ctx.stroke();
          // Breathing effect on nose
          const breath = Math.sin(tick * 0.05) * 2;
          ctx.beginPath();
          ctx.arc(-8 - breath*0.1, 22, 2, 0, Math.PI*2); // L Nostril
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(8 + breath*0.1, 22, 2, 0, Math.PI*2); // R Nostril
          ctx.stroke();

          // 5. MOUTH (Lip Sync)
          const mouthY = 45;
          const lipW = 20;
          
          ctx.fillStyle = baseColor;
          // Upper Lip
          ctx.beginPath();
          ctx.moveTo(-lipW, mouthY);
          ctx.quadraticCurveTo(0, mouthY - 5, lipW, mouthY); // Bow
          ctx.lineTo(lipW - 2, mouthY + 2);
          ctx.quadraticCurveTo(0, mouthY + 5, -lipW + 2, mouthY + 2);
          ctx.fill();

          // Lower Lip (Moves)
          const lowerLipY = mouthY + 2 + jawOpen;
          ctx.beginPath();
          ctx.moveTo(-lipW + 2, lowerLipY);
          ctx.quadraticCurveTo(0, lowerLipY + 5 + (jawOpen * 0.2), lipW - 2, lowerLipY);
          ctx.quadraticCurveTo(0, lowerLipY + 8 + (jawOpen * 0.5), -lipW + 2, lowerLipY);
          ctx.fill();
          
          // Mouth Interior (if open)
          if (jawOpen > 1) {
              ctx.beginPath();
              ctx.moveTo(-lipW + 5, mouthY + 2);
              ctx.lineTo(lipW - 5, mouthY + 2);
              ctx.lineTo(0, lowerLipY);
              ctx.fillStyle = '#000';
              ctx.fill();
          }

          // 6. AUDIO RECEPTORS (Ears)
          // Glows when listening
          const earGlow = isListening ? 10 + listenVol * 20 : 0;
          ctx.shadowBlur = earGlow;
          
          // L Ear
          ctx.beginPath();
          ctx.moveTo(-55, -10);
          ctx.lineTo(-65, 0);
          ctx.lineTo(-65, 20);
          ctx.lineTo(-58, 30);
          ctx.stroke();
          if (isListening) {
             ctx.fillStyle = baseColor;
             ctx.fillRect(-68, 5, 4, 15); // Meter
          }

          // R Ear
          ctx.beginPath();
          ctx.moveTo(55, -10);
          ctx.lineTo(65, 0);
          ctx.lineTo(65, 20);
          ctx.lineTo(58, 30);
          ctx.stroke();
          if (isListening) {
             ctx.fillStyle = baseColor;
             ctx.fillRect(64, 5, 4, 15); // Meter
          }
          
          ctx.shadowBlur = 10; // Reset

          // 7. TECH OVERLAY (Forehead)
          // Shows typing/processing state
          if (!isSpeaking && !isListening && isActive) {
              // Typing / Thinking
              ctx.fillStyle = baseColor;
              const scanX = Math.sin(tick * 0.1) * 20;
              ctx.fillRect(scanX - 2, -45, 4, 2);
              ctx.beginPath();
              ctx.moveTo(-20, -40);
              ctx.lineTo(20, -40);
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.lineWidth = 1.5;
          }

          ctx.restore();
      };

      const drawClassic = () => {
          // A highly detailed, HUD-style hexagonal face
          const headR = 70 + (speechInt * 5);
          
          // 1. Dual Rotating Hexagons
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          
          // Outer Hex
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const theta = (i * Math.PI * 2) / 6 + rot * 0.5;
            const px = cx + Math.cos(theta) * headR;
            const py = cy + Math.sin(theta) * headR;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          // Inner Hex (Counter-rotate)
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          for (let i = 0; i < 6; i++) {
            const theta = (i * Math.PI * 2) / 6 - rot * 0.8;
            const px = cx + Math.cos(theta) * (headR - 10);
            const py = cy + Math.sin(theta) * (headR - 10);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = 1;

          // 2. Data Bits (Orbiting)
          const bits = 4;
          for(let i=0; i<bits; i++) {
             const angle = rot * 2 + (i * Math.PI * 2 / bits);
             const bx = cx + Math.cos(angle) * (headR + 15 + listenVol * 20);
             const by = cy + Math.sin(angle) * (headR + 15 + listenVol * 20);
             ctx.fillRect(bx-2, by-2, 4, 4);
             ctx.beginPath();
             ctx.moveTo(cx, cy);
             ctx.lineTo(bx, by);
             ctx.globalAlpha = 0.1;
             ctx.stroke();
             ctx.globalAlpha = 1;
          }

          // 3. Eyes (Blinking & Squinting)
          blinkTimer++;
          if (!isBlinking) {
             if (blinkTimer > nextBlinkTime) { isBlinking = true; blinkPhase = 'closing'; }
          } else {
             if (blinkPhase === 'closing') {
               eyeOpenness -= 0.15;
               if (eyeOpenness <= 0) { eyeOpenness = 0; blinkPhase = 'opening'; }
             } else {
               eyeOpenness += 0.15;
               if (eyeOpenness >= 1) { eyeOpenness = 1; isBlinking = false; blinkTimer = 0; nextBlinkTime = 120 + Math.random() * 240; }
             }
          }
          
          // Squint on low volume listening (concentration)
          let squintFactor = isListening && listenVol < 0.1 ? 0.6 : 1;
          
          const eyeY = cy - 15;
          const eyeW = 24;
          const eyeH = 12 * eyeOpenness * squintFactor + (speechInt * 5); // Widen when shouting
          
          ctx.fillStyle = baseColor;
          ctx.shadowBlur = 15;
          
          // Left Eye (Tech Display style)
          ctx.beginPath();
          ctx.moveTo(cx - 50, eyeY);
          ctx.lineTo(cx - 50 + eyeW, eyeY);
          ctx.lineTo(cx - 50 + eyeW - 5, eyeY + eyeH);
          ctx.lineTo(cx - 50 + 5, eyeY + eyeH);
          ctx.fill();

          // Right Eye
          ctx.beginPath();
          ctx.moveTo(cx + 26, eyeY);
          ctx.lineTo(cx + 26 + eyeW, eyeY);
          ctx.lineTo(cx + 26 + eyeW - 5, eyeY + eyeH);
          ctx.lineTo(cx + 26 + 5, eyeY + eyeH);
          ctx.fill();
          
          // Eye Reticles (Spinning)
          if(eyeOpenness > 0.5) {
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.arc(cx - 38, eyeY + eyeH/2, 4, 0, Math.PI*2); ctx.stroke();
              ctx.beginPath(); ctx.arc(cx + 38, eyeY + eyeH/2, 4, 0, Math.PI*2); ctx.stroke();
          }

          // 4. Mouth (Frequency Bars / Waveform)
          const mouthY = cy + 35;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          
          if (isSpeaking) {
              const bars = 7;
              const spacing = 6;
              const startX = cx - (bars * spacing) / 2;
              
              for(let i=0; i<bars; i++) {
                 const h = 5 + Math.sin(tick * 0.5 + i) * 15 * speechInt;
                 ctx.beginPath();
                 ctx.moveTo(startX + i * spacing, mouthY - h);
                 ctx.lineTo(startX + i * spacing, mouthY + h);
                 ctx.stroke();
              }
          } else {
             ctx.beginPath();
             ctx.moveTo(cx - 20, mouthY);
             ctx.lineTo(cx - 10, mouthY + 5);
             ctx.lineTo(cx + 10, mouthY + 5);
             ctx.lineTo(cx + 20, mouthY);
             ctx.stroke();
          }
      };

      const drawCyberSkull = () => {
          const jawOffset = isSpeaking ? Math.min(25, speechInt * 30) : 0;
          const scale = 1 + listenVol * 0.2;
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          
          ctx.shadowBlur = 15;
          ctx.lineWidth = 2;

          // Skull Cap
          ctx.beginPath();
          ctx.moveTo(-40, -10);
          ctx.bezierCurveTo(-45, -60, 45, -60, 40, -10);
          ctx.lineTo(30, 0); // Cheek R
          ctx.lineTo(25, 25); // Upper Jaw R
          ctx.lineTo(-25, 25); // Upper Jaw L
          ctx.lineTo(-30, 0); // Cheek L
          ctx.closePath();
          ctx.stroke();
          
          // Tech Lines on Skull
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-20, -50); ctx.lineTo(-10, -30); ctx.lineTo(10, -30); ctx.lineTo(20, -50); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -10); ctx.stroke();

          // Jaw (Moving)
          ctx.save();
          ctx.translate(0, 25); // Pivot at jaw connection
          ctx.rotate(jawOffset * 0.01); // Slight rotation
          ctx.translate(0, jawOffset * 0.5); // And drop

          ctx.beginPath();
          ctx.moveTo(-25, 0);
          ctx.lineTo(-20, 20); // Chin L
          ctx.lineTo(20, 20); // Chin R
          ctx.lineTo(25, 0);
          ctx.stroke();
          
          // Teeth
          for(let i=-15; i<=15; i+=10) {
              ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 10); ctx.stroke();
          }
          ctx.restore();

          // Upper Teeth
          for(let i=-15; i<=15; i+=10) {
              ctx.beginPath(); ctx.moveTo(i, 25); ctx.lineTo(i, 18); ctx.stroke();
          }

          // Eyes (Glowing Sockets)
          const eyeGlow = 0.5 + (isListening ? listenVol : 0);
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = eyeGlow;
          
          // L Eye
          ctx.beginPath(); ctx.moveTo(-35, -5); ctx.lineTo(-15, -5); ctx.lineTo(-20, 10); ctx.lineTo(-30, 10); ctx.fill();
          // R Eye
          ctx.beginPath(); ctx.moveTo(35, -5); ctx.lineTo(15, -5); ctx.lineTo(20, 10); ctx.lineTo(30, 10); ctx.fill();
          
          // Digital Reticle in Eye
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff';
          if (Math.random() > 0.9) {
             ctx.fillRect(-27, 0, 4, 4); // Glitch/Scan
          }
          ctx.fillRect(23, 0, 4, 4);

          // Audio Reactive Halo
          if (isListening || isSpeaking) {
              ctx.beginPath();
              ctx.arc(0, 0, 60 + activityLevel * 20, 0, Math.PI * 2);
              ctx.setLineDash([2, 10]);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Spinning ring
              ctx.rotate(tick * 0.05);
              ctx.beginPath();
              ctx.arc(0, 0, 75, 0, Math.PI * 1.5);
              ctx.strokeStyle = baseColor;
              ctx.globalAlpha = 0.3;
              ctx.stroke();
          }

          ctx.restore();
      };

      const drawCyberFox = () => {
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.1);
          const earTwitch = Math.sin(tick * 0.2) * 0.1 * energy;
          
          ctx.save();
          ctx.translate(cx, cy);
          
          // Dynamic scaling based on shout
          const s = 1 + (isSpeaking ? speechInt * 0.1 : 0);
          ctx.scale(s, s);

          ctx.lineWidth = 2;
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 15;

          // Helper to draw filled poly
          const poly = (points: [number, number][], fill: boolean = false) => {
              ctx.beginPath();
              ctx.moveTo(points[0][0], points[0][1]);
              for(let i=1; i<points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
              ctx.closePath();
              if(fill) {
                  ctx.globalAlpha = 0.2;
                  ctx.fill();
                  ctx.globalAlpha = 1;
              }
              ctx.stroke();
          };

          // Head Shape
          const headPoints: [number, number][] = [
             [0, 50 + energy * 10], // Chin (moves down with energy)
             [40, 0], // R Cheek
             [30, -35], // R Ear Base
             [15, -45], // R Head Top
             [-15, -45], // L Head Top
             [-30, -35], // L Ear Base
             [-40, 0] // L Cheek
          ];
          poly(headPoints, true);

          // Ears (Twitching)
          ctx.save();
          ctx.translate(30, -35);
          ctx.rotate(earTwitch + (isListening ? Math.PI/12 : 0));
          poly([[0,0], [25, -50], [-10, -10]], true);
          ctx.restore();

          ctx.save();
          ctx.translate(-30, -35);
          ctx.rotate(-earTwitch - (isListening ? Math.PI/12 : 0));
          poly([[0,0], [-25, -50], [10, -10]], true);
          ctx.restore();

          // Eyes
          const blink = Math.abs(Math.sin(tick * 0.05)) > 0.95; // Random blink
          if (!blink) {
             ctx.fillStyle = '#fff';
             ctx.beginPath(); ctx.moveTo(10, -15); ctx.lineTo(30, -20); ctx.lineTo(25, -10); ctx.fill();
             ctx.beginPath(); ctx.moveTo(-10, -15); ctx.lineTo(-30, -20); ctx.lineTo(-25, -10); ctx.fill();
          }

          // Muzzle Flash / Voice
          if (isSpeaking) {
              ctx.beginPath();
              ctx.moveTo(0, 50 + energy * 10);
              for(let i=0; i<5; i++) {
                 ctx.lineTo(
                     (Math.random()-0.5) * 30 * energy, 
                     60 + Math.random() * 40 * energy
                 );
              }
              ctx.closePath();
              ctx.fillStyle = baseColor;
              ctx.globalAlpha = 0.6;
              ctx.fill();
          }

          // Whiskers (Holographic Lines)
          ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(70 + energy*20, 5 + Math.sin(tick)*5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(35, 15); ctx.lineTo(65 + energy*20, 20 + Math.cos(tick)*5); ctx.stroke();
          
          ctx.beginPath(); ctx.moveTo(-35, 10); ctx.lineTo(-70 - energy*20, 5 + Math.sin(tick)*5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-35, 15); ctx.lineTo(-65 - energy*20, 20 + Math.cos(tick)*5); ctx.stroke();

          ctx.restore();
      };

      // --- OTHER AVATARS ---

      const drawZenOrb = () => {
        const coreSize = 25 + (isSpeaking ? speechInt * 30 : 0) + (isListening ? listenVol * 40 : 0);
        ctx.beginPath(); ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
        grad.addColorStop(0, '#fff'); grad.addColorStop(0.5, baseColor); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fill();

        ctx.lineWidth = 2;
        const rings = 3;
        for(let i=0; i<rings; i++) {
             ctx.beginPath();
             const r = 40 + i * 20 + (isListening ? freqData[i*5] / 10 : 0);
             const angleOffset = rot * (i % 2 === 0 ? 1 : -1) * (i + 1);
             ctx.ellipse(cx, cy, r, r * (0.4 + Math.sin(tick*0.01)*0.2), angleOffset, 0, Math.PI * 2);
             ctx.strokeStyle = baseColor; ctx.stroke();
             const nx = cx + Math.cos(angleOffset) * r; const ny = cy + Math.sin(angleOffset) * (r * 0.4); 
             ctx.fillStyle = '#fff'; ctx.fillRect(nx-2, ny-2, 4, 4);
        }
      };

      const drawReactorCore = () => {
         ctx.lineWidth = 3; const r = 60;
         ctx.beginPath(); for(let i=0; i<3; i++) { const a = (i * Math.PI * 2 / 3) - Math.PI / 2 + rot; const px = cx + Math.cos(a) * r; const py = cy + Math.sin(a) * r; if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke();
         const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.2); const innerR = 30 * energy + 15;
         ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2); ctx.fillStyle = baseColor; ctx.shadowBlur = 30 * energy; ctx.fill();
         ctx.lineWidth = 2; const beams = 12; for(let i=0; i<beams; i++) { if (Math.random() > 0.5 + energy * 0.4) continue; const a = (i * Math.PI * 2 / beams) - rot * 3; const startR = innerR + 5; const endR = 90; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * startR, cy + Math.sin(a) * startR); ctx.lineTo(cx + Math.cos(a) * endR, cy + Math.sin(a) * endR); ctx.stroke(); }
      };

      const drawFluxEntity = () => {
         const targetCount = 60;
         if (particles.length < targetCount) { particles.push({ x: cx, y: cy, vx: (Math.random()-0.5) * 5, vy: (Math.random()-0.5) * 5, life: 1.0, size: Math.random() * 3 }); }
         const energy = isSpeaking ? speechInt * 8 : (isListening ? listenVol * 8 : 1.5);
         ctx.beginPath();
         particles.forEach((p, idx) => {
             p.x += p.vx * energy; p.y += p.vy * energy; p.life -= 0.02;
             ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
             particles.forEach(p2 => { const dx = p.x - p2.x; const dy = p.y - p2.y; const dist = Math.sqrt(dx*dx + dy*dy); if (dist < 40) { ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); } });
             if (p.life <= 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) { particles[idx] = { x: cx, y: cy, vx: (Math.random()-0.5) * 2, vy: (Math.random()-0.5) * 2, life: 1.0, size: Math.random() * 3 }; }
         });
         ctx.fillStyle = baseColor; ctx.strokeStyle = baseColor; ctx.globalAlpha = 0.6; ctx.lineWidth = 0.5; ctx.stroke(); ctx.fill(); ctx.globalAlpha = 1;
      };

      const drawEchoPulse = () => {
        const rings = 8; const maxR = 100; const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.1);
        for(let i=0; i<rings; i++) { const timeOffset = (tick / 20) + i * 0.5; const wave = (Math.sin(timeOffset) + 1) / 2; const r = (i * 12) + (wave * 30 * energy); if (r > 0) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 3 * wave; ctx.globalAlpha = 1 - (r / (maxR + 30)); ctx.stroke(); } } ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 15 + energy * 25, 0, Math.PI * 2); ctx.fillStyle = baseColor; ctx.fill();
        if (isListening) { ctx.beginPath(); ctx.moveTo(cx - 100, cy); for(let x=0; x<200; x+=5) { const idx = Math.floor((x/200) * freqData.length); const h = freqData[idx] ? freqData[idx] / 5 : 0; ctx.lineTo(cx - 100 + x, cy - h); } ctx.stroke(); }
      };

      const drawVoxelGrid = () => {
        const size = 12; const cols = 7; const rows = 7; const offsetX = (cols * size * 1.5) / 2; const offsetY = (rows * size * 1.5) / 2; const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.2);
        for(let r=0; r<rows; r++) { for(let c=0; c<cols; c++) { const x = cx - offsetX + c * size * 1.5; const y = cy - offsetY + r * size * 1.5; const d = Math.sqrt(Math.pow(c-3, 2) + Math.pow(r-3, 2)); let h = 5; if (isListening) { const idx = Math.floor((d/5) * freqData.length/2); h = 5 + (freqData[idx] || 0) / 4; } else { h = 5 + Math.sin(tick * 0.1 + d) * 10 * energy + (energy * 30); } ctx.fillStyle = baseColor; ctx.globalAlpha = 0.2 + (h / 60); ctx.fillRect(x, y - h, size, size); ctx.globalAlpha = 1; ctx.strokeRect(x, y - h, size, size); } }
      };

      const drawCelestial = () => {
         const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.2);
         ctx.beginPath(); ctx.arc(cx, cy, 20 + energy * 40, 0, Math.PI * 2); ctx.fillStyle = baseColor; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
         const orbits = 4; for(let i=0; i<orbits; i++) { ctx.beginPath(); const rx = 50 + i * 20; const ry = 15 + i * 8; const angle = rot * (i+1) + (i * Math.PI / 3); ctx.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1; const planetAngle = tick * (0.05 - i * 0.01); const px = cx + rx * Math.cos(planetAngle) * Math.cos(angle) - ry * Math.sin(planetAngle) * Math.sin(angle); const py = cy + rx * Math.cos(planetAngle) * Math.sin(angle) + ry * Math.sin(planetAngle) * Math.cos(angle); ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.shadowBlur = 5; ctx.fill(); ctx.shadowBlur = 0; }
      };

      const drawSpiralNexus = () => {
        const points = 100; const phi = 137.5 * (Math.PI / 180); const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.1); const zoom = 1 + energy * 2;
        for (let i = 0; i < points; i++) { const r = 4 * Math.sqrt(i) * zoom; const theta = i * phi + rot * 3; const x = cx + r * Math.cos(theta); const y = cy + r * Math.sin(theta); ctx.beginPath(); const pSize = 2 + (Math.sin(i + tick * 0.1) * 1) + (isListening && i < 20 ? 3 : 0); ctx.arc(x, y, pSize, 0, Math.PI * 2); ctx.fillStyle = baseColor; ctx.globalAlpha = 1 - (i / points); ctx.fill(); } ctx.globalAlpha = 1;
      };

      // --- LEGENDARY AVATARS ---

      const drawNebulaWhisper = () => {
          // Soft cloud-like particles
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.2);
          const count = 50;
          ctx.globalCompositeOperation = 'screen';
          
          for(let i=0; i<count; i++) {
              const angle = tick * 0.01 + (i * 0.5);
              const r = 20 + Math.sin(angle * 2) * 20 + (energy * 50);
              const px = cx + Math.cos(angle) * r;
              const py = cy + Math.sin(angle) * r * 0.5; // Flat cloud
              
              const size = 15 + Math.sin(i + tick * 0.05) * 10;
              
              const grad = ctx.createRadialGradient(px, py, 0, px, py, size);
              grad.addColorStop(0, baseColor);
              grad.addColorStop(1, 'transparent');
              
              ctx.fillStyle = grad;
              ctx.globalAlpha = 0.3;
              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          
          // Core
          ctx.beginPath();
          ctx.arc(cx, cy, 10 + energy * 20, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;
      };

      const drawQuantumShift = () => {
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.1);
          const size = 60 + energy * 40;
          
          // Glitch displacement
          const dx = (Math.random() - 0.5) * 10 * energy;
          const dy = (Math.random() - 0.5) * 10 * energy;
          
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          
          // Main Cube
          ctx.strokeRect(cx - size/2 + dx, cy - size/2 + dy, size, size);
          
          // Ghost Cubes
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = '#fff';
          if (Math.random() > 0.8) {
              ctx.strokeRect(cx - size/2 - 10, cy - size/2, size, size);
          }
          if (Math.random() > 0.8) {
              ctx.strokeRect(cx - size/2 + 10, cy - size/2, size, size);
          }
          ctx.globalAlpha = 1;

          // Quantum bits
          for(let i=0; i<5; i++) {
              if(Math.random() > 0.5) continue;
              const bx = cx + (Math.random()-0.5) * 150;
              const by = cy + (Math.random()-0.5) * 150;
              ctx.fillStyle = baseColor;
              ctx.fillRect(bx, by, 4, 4);
              
              // Teleport lines
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(bx, by);
              ctx.globalAlpha = 0.2;
              ctx.stroke();
              ctx.globalAlpha = 1;
          }
      };

      const drawObsidianGuardian = () => {
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.2);
          const spikes = 8;
          const r = 60 + energy * 20;

          // Central Gem
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.6, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.6, cy);
          ctx.closePath();
          ctx.fillStyle = '#111'; // Obsidian Black
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 3;
          ctx.fill();
          ctx.stroke();
          
          // Floating Spikes
          for(let i=0; i<spikes; i++) {
              const angle = (i * Math.PI * 2 / spikes) + rot;
              const dist = r + 20 + Math.sin(tick * 0.1 + i) * 10;
              
              ctx.save();
              ctx.translate(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
              ctx.rotate(angle + Math.PI/2);
              
              ctx.beginPath();
              ctx.moveTo(0, -20);
              ctx.lineTo(10, 10);
              ctx.lineTo(0, 5);
              ctx.lineTo(-10, 10);
              ctx.closePath();
              ctx.fillStyle = '#000';
              ctx.strokeStyle = baseColor;
              ctx.lineWidth = 1;
              ctx.fill();
              ctx.stroke();
              
              ctx.restore();
          }

          // Inner Power
          ctx.beginPath();
          ctx.moveTo(cx, cy - r*0.5);
          ctx.lineTo(cx + r * 0.3, cy);
          ctx.lineTo(cx, cy + r*0.5);
          ctx.lineTo(cx - r * 0.3, cy);
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = 0.5 + Math.sin(tick * 0.2) * 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
      };

      const drawChromeSeraph = () => {
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.1);
          
          // Wings (Arcs)
          ctx.strokeStyle = '#fff';
          const wings = 3;
          
          for(let side of [-1, 1]) {
              for(let i=0; i<wings; i++) {
                  const offset = i * 0.3;
                  const flap = Math.sin(tick * 0.1 + offset) * 0.2 * (1 + energy);
                  
                  ctx.beginPath();
                  ctx.ellipse(cx + (side * 40), cy - 20, 60, 20, (side * 0.5) + flap, 0, Math.PI * 2);
                  
                  // Metallic Gradient Simulation
                  const grad = ctx.createLinearGradient(cx, cy - 50, cx, cy + 50);
                  grad.addColorStop(0, '#fff');
                  grad.addColorStop(0.5, '#888');
                  grad.addColorStop(1, '#fff');
                  
                  ctx.strokeStyle = grad;
                  ctx.lineWidth = 2;
                  ctx.stroke();
              }
          }

          // Halo
          ctx.beginPath();
          ctx.ellipse(cx, cy - 60 - (energy * 20), 40, 5, 0, 0, Math.PI * 2);
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Face / Visor
          ctx.beginPath();
          ctx.moveTo(cx - 15, cy + 10);
          ctx.lineTo(cx + 15, cy + 10);
          ctx.lineTo(cx, cy + 40);
          ctx.fillStyle = '#ccc';
          ctx.fill();
          
          // Eye slit
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy + 15);
          ctx.lineTo(cx + 10, cy + 15);
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          ctx.stroke();
      };

      const drawArcaneSentinel = () => {
          const energy = isSpeaking ? speechInt : (isListening ? listenVol : 0.2);
          
          // Rotating Magic Circles
          const circles = 3;
          for(let i=0; i<circles; i++) {
              const r = 40 + i * 25;
              const dir = i % 2 === 0 ? 1 : -1;
              const angle = rot * dir * (1 + i*0.5);
              
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(angle);
              
              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.strokeStyle = baseColor;
              ctx.lineWidth = 1;
              ctx.setLineDash([10, 5]);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Runes on circle
              const runes = 8;
              for(let j=0; j<runes; j++) {
                  const ra = (j * Math.PI * 2 / runes);
                  const rx = Math.cos(ra) * r;
                  const ry = Math.sin(ra) * r;
                  ctx.fillStyle = '#fff';
                  ctx.fillRect(rx-2, ry-2, 4, 4);
              }
              
              ctx.restore();
          }
          
          // Eye of Knowledge
          const eyeSize = 15 + energy * 20;
          ctx.beginPath();
          ctx.moveTo(cx - 30, cy);
          ctx.quadraticCurveTo(cx, cy - eyeSize, cx + 30, cy);
          ctx.quadraticCurveTo(cx, cy + eyeSize, cx - 30, cy);
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
      };

      // --- DISPATCHER ---
      
      switch(avatar) {
          case AvatarType.MARCO_3_0: drawMarco3_0(); break;
          case AvatarType.MARCO_2_0: drawMarcoRealist(); break;
          case AvatarType.MARCO_OFFICIAL: drawMarcoOfficial(); break;
          case AvatarType.CYBER_SKULL: drawCyberSkull(); break;
          case AvatarType.ZEN_ORB: drawZenOrb(); break;
          case AvatarType.REACTOR_CORE: drawReactorCore(); break;
          case AvatarType.FLUX_ENTITY: drawFluxEntity(); break;
          case AvatarType.ECHO_PULSE: drawEchoPulse(); break;
          case AvatarType.CYBER_FOX: drawCyberFox(); break;
          case AvatarType.VOXEL_GRID: drawVoxelGrid(); break;
          case AvatarType.CELESTIAL: drawCelestial(); break;
          case AvatarType.SPIRAL_NEXUS: drawSpiralNexus(); break;
          // New Legendary
          case AvatarType.NEBULA_WHISPER: drawNebulaWhisper(); break;
          case AvatarType.QUANTUM_SHIFT: drawQuantumShift(); break;
          case AvatarType.OBSIDIAN_GUARDIAN: drawObsidianGuardian(); break;
          case AvatarType.CHROME_SERAPH: drawChromeSeraph(); break;
          case AvatarType.ARCANE_SENTINEL: drawArcaneSentinel(); break;
          case AvatarType.CLASSIC:
          default: drawClassic(); break;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, isSpeaking, isListening, themeColors, avatar]);

  return (
    <div 
      onClick={onClick}
      className={`relative w-64 h-64 mx-auto flex items-center justify-center transition-all duration-500 cursor-pointer`}
      title="Tap 3 times to switch avatar"
    >
      <canvas ref={canvasRef} className="w-full h-full z-10" />
      
      {/* Background Glow Overlay for "Hologram" feel */}
      <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none bg-${themeColors.primary}`}></div>
      
      {/* Decorative scanlines */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scanline opacity-10 pointer-events-none z-20"></div>
    </div>
  );
};

export default Hologram;
