

import { SoundPack } from '../types';

// Simple synth for sci-fi UI sounds
let audioCtx: AudioContext | null = null;
let currentPack: SoundPack = 'CLASSIC_SCI_FI';

// Alarm Refs
let alarmOsc: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let alarmTimer: any = null;

const initAudio = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
};

export const setGlobalSoundPack = (pack: SoundPack) => {
  currentPack = pack;
};

type SoundType = 'click' | 'hover' | 'send' | 'receive' | 'success' | 'alert' | 'startup';

interface SoundParams {
  type: OscillatorType;
  freqStart: number;
  freqEnd?: number;
  duration: number;
  volMax: number;
  volRamp?: 'linear' | 'exponential';
  freqRamp?: 'linear' | 'exponential';
}

const PACKS: Record<SoundPack, Record<SoundType, SoundParams | SoundParams[]>> = {
  CLASSIC_SCI_FI: {
    click: { type: 'sine', freqStart: 800, freqEnd: 1200, duration: 0.05, volMax: 0.1, freqRamp: 'exponential', volRamp: 'exponential' },
    hover: { type: 'triangle', freqStart: 400, duration: 0.03, volMax: 0.02, volRamp: 'linear' },
    send: { type: 'sine', freqStart: 200, freqEnd: 600, duration: 0.2, volMax: 0.1, freqRamp: 'exponential', volRamp: 'linear' },
    receive: { type: 'square', freqStart: 800, duration: 0.15, volMax: 0.05, volRamp: 'linear' },
    success: [
      { type: 'sine', freqStart: 440, duration: 0.1, volMax: 0.1 },
      { type: 'sine', freqStart: 554, duration: 0.1, volMax: 0.1 },
      { type: 'sine', freqStart: 659, duration: 0.2, volMax: 0.1 }
    ],
    alert: { type: 'sawtooth', freqStart: 150, freqEnd: 100, duration: 0.3, volMax: 0.1, freqRamp: 'linear', volRamp: 'linear' },
    startup: { type: 'sine', freqStart: 100, freqEnd: 1000, duration: 1.5, volMax: 0.2, freqRamp: 'exponential', volRamp: 'linear' }
  },
  AMBIENT_TECH: {
    click: { type: 'sine', freqStart: 400, freqEnd: 400, duration: 0.1, volMax: 0.05 },
    hover: { type: 'sine', freqStart: 200, duration: 0.05, volMax: 0.02 },
    send: { type: 'triangle', freqStart: 300, freqEnd: 500, duration: 0.4, volMax: 0.08, freqRamp: 'linear' },
    receive: { type: 'triangle', freqStart: 500, freqEnd: 300, duration: 0.4, volMax: 0.08, freqRamp: 'linear' },
    success: [
      { type: 'sine', freqStart: 300, duration: 0.3, volMax: 0.05 },
      { type: 'sine', freqStart: 400, duration: 0.3, volMax: 0.05 },
      { type: 'sine', freqStart: 500, duration: 0.5, volMax: 0.05 }
    ],
    alert: { type: 'square', freqStart: 100, freqEnd: 80, duration: 0.5, volMax: 0.05 },
    startup: { type: 'triangle', freqStart: 50, freqEnd: 200, duration: 2.0, volMax: 0.1 }
  },
  MINIMALIST: {
    click: { type: 'square', freqStart: 1000, duration: 0.01, volMax: 0.02 },
    hover: { type: 'sine', freqStart: 800, duration: 0.01, volMax: 0.01 },
    send: { type: 'sine', freqStart: 600, duration: 0.1, volMax: 0.05 },
    receive: { type: 'sine', freqStart: 800, duration: 0.1, volMax: 0.05 },
    success: { type: 'sine', freqStart: 1200, duration: 0.1, volMax: 0.05 },
    alert: { type: 'sawtooth', freqStart: 200, duration: 0.1, volMax: 0.05 },
    startup: { type: 'sine', freqStart: 440, duration: 0.2, volMax: 0.05 }
  }
};

export const playSound = (type: SoundType) => {
  const ctx = initAudio();
  if (!ctx) return;

  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const config = PACKS[currentPack][type];

  if (Array.isArray(config)) {
    config.forEach((c, index) => {
      playTone(ctx, c, now + index * 0.1);
    });
  } else {
    playTone(ctx, config, now);
  }
};

const playTone = (ctx: AudioContext, params: SoundParams, startTime: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = params.type;
  osc.frequency.setValueAtTime(params.freqStart, startTime);
  if (params.freqEnd) {
    if (params.freqRamp === 'linear') {
       osc.frequency.linearRampToValueAtTime(params.freqEnd, startTime + params.duration);
    } else {
       osc.frequency.exponentialRampToValueAtTime(params.freqEnd, startTime + params.duration);
    }
  }

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(params.volMax, startTime + 0.01); 
  
  if (params.volRamp === 'linear') {
    gain.gain.linearRampToValueAtTime(0, startTime + params.duration);
  } else {
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + params.duration);
  }

  osc.start(startTime);
  osc.stop(startTime + params.duration);
};

// HEAVY ALARM SYSTEM
export const playAlarmSound = (type: 'SIREN' | 'PULSE' | 'ETHEREAL' = 'SIREN') => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    // Stop any existing
    stopAlarmSound();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Initial Vol
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    const now = ctx.currentTime;

    if (type === 'SIREN') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.5);
        let toggle = false;
        alarmOsc = osc;
        alarmGain = gain;
        osc.start();
        alarmTimer = setInterval(() => {
           const t = ctx.currentTime;
           if (toggle) osc.frequency.linearRampToValueAtTime(1000, t + 0.5);
           else osc.frequency.linearRampToValueAtTime(400, t + 0.5);
           toggle = !toggle;
        }, 500);
    } 
    else if (type === 'PULSE') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        alarmOsc = osc;
        alarmGain = gain;
        osc.start();
        let on = true;
        alarmTimer = setInterval(() => {
            const t = ctx.currentTime;
            gain.gain.setValueAtTime(on ? 0.3 : 0, t);
            on = !on;
        }, 200);
    }
    else { // ETHEREAL
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        alarmOsc = osc;
        alarmGain = gain;
        osc.start();
        // Gentle Arpeggio Effect
        const notes = [440, 554, 659, 880];
        let idx = 0;
        alarmTimer = setInterval(() => {
            const t = ctx.currentTime;
            osc.frequency.exponentialRampToValueAtTime(notes[idx % notes.length], t + 0.1);
            idx++;
        }, 300);
    }
};

export const stopAlarmSound = () => {
    if (alarmOsc) {
        alarmOsc.stop();
        alarmOsc.disconnect();
        alarmOsc = null;
    }
    if (alarmGain) {
        alarmGain.disconnect();
        alarmGain = null;
    }
    if (alarmTimer) {
        clearInterval(alarmTimer);
        alarmTimer = null;
    }
};