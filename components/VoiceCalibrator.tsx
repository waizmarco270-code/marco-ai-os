import React, { useState, useRef, useEffect } from 'react';
import { ThemeColors, VoiceCalibration } from '../types';
import { playSound } from '../services/audioService';

interface VoiceCalibratorProps {
  theme: ThemeColors;
  onCalibrationComplete: (calibration: VoiceCalibration) => void;
  currentCalibration: VoiceCalibration;
}

const VoiceCalibrator: React.FC<VoiceCalibratorProps> = ({ theme, onCalibrationComplete, currentCalibration }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Data collection for analysis
  const frequencyDataRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    // Do not close AudioContext if it's shared, but here we likely created it or can suspend it
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      playSound('click');
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsRecording(true);
      setProgress(0);
      setAnalysisResult(null);
      frequencyDataRef.current = [];
      startTimeRef.current = Date.now();

      drawVisualizer();
      
      // Auto-stop after 3 seconds
      const duration = 3000;
      const interval = 50;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;
        setProgress((elapsed / duration) * 100);
        
        // Collect pitch/frequency data periodically
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average frequency magnitude for this frame
        let sum = 0;
        for(let i=0; i<bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        frequencyDataRef.current.push(avg);

        if (elapsed >= duration) {
          clearInterval(timer);
          stopRecording();
        }
      }, interval);

    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required for voice calibration.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopRecordingCleanup();
    playSound('success');
    analyzeData();
  };

  const analyzeData = () => {
    const data = frequencyDataRef.current;
    if (data.length === 0) return;

    // 1. Calculate Average Energy/Frequency (Proxy for Pitch/Tone)
    const avgEnergy = data.reduce((a, b) => a + b, 0) / data.length;
    
    // Heuristic: Higher energy in high bins often correlates with higher perceived pitch/clarity in simple FFT
    // Note: This is a "sci-fi" simulation of analysis, not a perfect pitch detector.
    
    // Map avgEnergy (0-255 range typically) to Pitch (0.5 to 1.5)
    // Low energy/deep voice -> Lower pitch setting
    // High energy/higher voice -> Higher pitch setting
    // We normalize around 1.0 (approx energy 30-50 for speech)
    let calculatedPitch = 0.8 + (avgEnergy / 100);
    calculatedPitch = Math.max(0.5, Math.min(1.5, calculatedPitch));

    // 2. Calculate Rate based on "density" of speech
    // If the user spoke continuously (high energy consistently), they might be speaking fast?
    // Let's assume a standard speaking rate. If we simply randomize slightly based on energy flux, it feels adaptive.
    // Real implementation: Rate is hard to determine without transcription duration vs text length.
    // We will use a stylistic mapping: Higher energy -> slightly faster (excited).
    let calculatedRate = 0.9 + (avgEnergy / 200);
    calculatedRate = Math.max(0.8, Math.min(1.2, calculatedRate));

    const result: VoiceCalibration = {
      pitch: Number(calculatedPitch.toFixed(2)),
      rate: Number(calculatedRate.toFixed(2)),
      isCalibrated: true
    };

    onCalibrationComplete(result);
    setAnalysisResult(`ANALYSIS COMPLETE: PITCH_MOD[${result.pitch}] // RATE_MOD[${result.rate}]`);
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isRecording) return;
      animationRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        // Dynamic color based on height
        const r = barHeight + (25 * (i/bufferLength));
        const g = 250 * (i/bufferLength);
        const b = 50;
        
        // Use theme color if possible, else fallback
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        
        // Draw mirrored bars for HUD look
        ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };
    render();
  };

  return (
    <div className={`p-4 border border-${theme.border} rounded glass-panel bg-black/40`}>
      <h3 className={`text-md font-bold mb-2 text-${theme.accent} flex items-center gap-2`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
        </svg>
        BIOMETRIC VOICE CALIBRATION
      </h3>
      
      <p className="text-xs text-gray-400 mb-4 font-mono leading-relaxed">
        Record a sample to fine-tune MARCO's vocal parameters. The system will analyze your vocal frequency and cadence to generate a personalized harmonic response profile.
      </p>

      {/* Visualizer Area */}
      <div className="relative h-24 bg-black/50 border border-gray-800 rounded mb-4 overflow-hidden flex items-center justify-center">
         <canvas ref={canvasRef} width={300} height={100} className="w-full h-full absolute inset-0 z-10" />
         {!isRecording && !analysisResult && <span className="text-xs text-gray-600 font-mono z-0">WAITING FOR INPUT STREAM...</span>}
         {analysisResult && !isRecording && (
             <div className={`z-20 text-${theme.primary} font-mono text-xs text-center animate-pulse`}>
                {analysisResult}
             </div>
         )}
         
         {/* Progress Line */}
         {isRecording && (
             <div className="absolute bottom-0 left-0 h-1 bg-red-500 z-30 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
         )}
      </div>

      <div className="flex justify-between items-center">
         <button 
           onClick={isRecording ? stopRecording : startRecording}
           className={`
             flex-1 py-3 rounded font-bold font-mono text-sm tracking-wider transition-all
             ${isRecording 
                ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse' 
                : `bg-${theme.primary}/20 text-${theme.primary} border border-${theme.primary} hover:bg-${theme.primary}/40`}
           `}
         >
           {isRecording ? 'ANALYZING...' : (currentCalibration.isCalibrated ? 'RE-CALIBRATE VOICE' : 'INITIATE RECORDING')}
         </button>
      </div>
      
      {/* Privacy Notice */}
      <div className="mt-4 flex items-start gap-2 p-2 bg-yellow-900/10 border border-yellow-700/30 rounded">
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0">
           <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 01-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
         </svg>
         <p className="text-[10px] text-yellow-500/80 leading-tight">
           PRIVACY PROTOCOL: Audio data is processed locally in the client sandbox (browser memory). No biometric data is uploaded to external servers.
         </p>
      </div>

    </div>
  );
};

export default VoiceCalibrator;