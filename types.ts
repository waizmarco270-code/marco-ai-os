
export enum AppView {
  CHAT = 'CHAT',
  MEMORY = 'MEMORY',
  PRODUCTIVITY = 'PRODUCTIVITY',
  DEV_TOOLS = 'DEV_TOOLS',
  SETTINGS = 'SETTINGS',
  M_TRACKER = 'M_TRACKER',
  ADMIN_GENESIS = 'ADMIN_GENESIS' // NEW: Secret Admin View
}

export enum ThemeName {
  NEON_BLUE = 'NEON_BLUE',
  RED_HACKER = 'RED_HACKER',
  GREEN_MATRIX = 'GREEN_MATRIX',
  PURPLE_CYBERPUNK = 'PURPLE_CYBERPUNK',
  MINIMAL_WHITE = 'MINIMAL_WHITE',
  AMOLED_BLACK = 'AMOLED_BLACK',
  // New Legendary Themes
  GOLD_LUXURY = 'GOLD_LUXURY',
  CYBER_ORANGE = 'CYBER_ORANGE',
  ICE_BERG = 'ICE_BERG',
  MIDNIGHT_PURPLE = 'MIDNIGHT_PURPLE'
}

export enum VoiceSkin {
  CLASSIC_AI = 'CLASSIC_AI',
  ROBOTIC_GRUNT = 'ROBOTIC_GRUNT',
  SOFT_ASSISTANT = 'SOFT_ASSISTANT',
  CYBER_HACKER = 'CYBER_HACKER',
  DEEP_PROTOCOL = 'DEEP_PROTOCOL',
  PERSONALIZED = 'PERSONALIZED_ADAPTIVE',
  // NEW LEGENDARY VOICES
  GLITCH_ENTITY = 'GLITCH_ENTITY',
  HYPER_VELOCITY = 'HYPER_VELOCITY',
  VOID_WALKER = 'VOID_WALKER',
  ROYAL_GUARD = 'ROYAL_GUARD',
  SYSTEM_PRIME = 'SYSTEM_PRIME',
  IRON_MODULATION = 'IRON_MODULATION' // LEGENDARY JARVIS VOICE
}

export enum AvatarType {
  CLASSIC = 'CLASSIC',
  MARCO_OFFICIAL = 'MARCO_OFFICIAL', 
  MARCO_2_0 = 'MARCO_2_0', 
  MARCO_3_0 = 'MARCO_3_0', // NEW LEGENDARY JARVIS-STYLE AVATAR
  CYBER_SKULL = 'CYBER_SKULL',
  ZEN_ORB = 'ZEN_ORB',
  REACTOR_CORE = 'REACTOR_CORE',
  FLUX_ENTITY = 'FLUX_ENTITY',
  ECHO_PULSE = 'ECHO_PULSE',
  CYBER_FOX = 'CYBER_FOX',
  VOXEL_GRID = 'VOXEL_GRID',
  CELESTIAL = 'CELESTIAL',
  SPIRAL_NEXUS = 'SPIRAL_NEXUS',
  // New Legendary Avatars
  NEBULA_WHISPER = 'NEBULA_WHISPER',
  QUANTUM_SHIFT = 'QUANTUM_SHIFT',
  OBSIDIAN_GUARDIAN = 'OBSIDIAN_GUARDIAN',
  CHROME_SERAPH = 'CHROME_SERAPH',
  ARCANE_SENTINEL = 'ARCANE_SENTINEL'
}

export enum PersonalityMode {
  LOGICAL = 'LOGICAL',
  CREATIVE = 'CREATIVE',
  EMPATHETIC = 'EMPATHETIC',
  HUMOROUS = 'HUMOROUS'
}

export type OverlayType = 'NONE' | 'HACK_SIMULATION' | 'MATRIX_RAIN' | 'SYSTEM_REBOOT' | 'ALARM_TRIGGER';

export type SoundPack = 'CLASSIC_SCI_FI' | 'AMBIENT_TECH' | 'MINIMALIST';

export type UserRole = 'MASTER' | 'GUEST' | 'INTRUDER';

export interface VoiceCalibration {
  pitch: number;
  rate: number;
  isCalibrated: boolean;
}

export interface MasterProfile {
  isRegistered: boolean;
  name: string;
  voicePhrase: string; // The phrase to unlock (e.g., "Protocol Alpha")
  pin: string; // Backup numeric pin
  licenseKey: string;
  registeredAt: number;
}

export interface LearningProfile {
  topCommands: Record<string, number>;
  preferredThemes: Record<string, number>;
  topics: Record<string, number>;
  totalInteractions: number;
  lastActive: number;
}

export interface CustomCommand {
  id: string;
  trigger: string; // e.g. "/mytheme"
  action: 'NAVIGATE' | 'THEME' | 'SOUND' | 'OVERLAY' | 'OPEN_URL' | 'ALARM' | 'FOCUS' | 'NOTE' | 'MUSIC';
  payload: string;
}

export interface Alarm {
  id: string;
  time: string; // "HH:MM" 24h format
  label: string;
  isActive: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty = Once.
  sound: 'SIREN' | 'PULSE' | 'ETHEREAL'; 
  snoozedUntil?: number; // Timestamp
}

export interface NoFapState {
  currentStreakHours: number; // Calculated dynamically usually, but stored for snapshots
  lastRelapseDate: number; // Timestamp
  bestStreakHours: number;
  history: { date: number; streakHours: number }[];
  status: 'CLEAN' | 'RELAPSED' | 'WARZONE';
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  border: string;
  shadow: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isCommandResult?: boolean; // To style command outputs differently
  attachment?: string; // Base64 image string
}

export interface MemoryItem {
  id: string;
  content: string;
  tags: string[];
  createdAt: number;
  type: 'note' | 'fact' | 'summary' | 'directive';
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: number;
  priority?: 'HIGH' | 'MED' | 'LOW';
}

export interface FocusState {
  isActive: boolean;
  durationMinutes: number;
  startTime: number | null; // Timestamp
  label: string;
}

// --- NEW MUSIC TYPES ---
export interface MusicTrack {
    id: string;
    name: string; // The trigger name (e.g. "Battle Theme")
    blob: Blob;   // The actual audio file
    type: string; // MIME type
    size: number;
    createdAt: number;
}

export interface ActiveMusic {
    isPlaying: boolean;
    trackName: string;
    url: string | null; // Object URL for the audio element
}

export interface AppState {
  view: AppView;
  theme: ThemeName;
  voiceSkin: VoiceSkin;
  avatar: AvatarType;
  personality: PersonalityMode; // NEW: AI Personality
  voiceCalibration: VoiceCalibration;
  messages: Message[];
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean; // Global voice toggle
  wakeWordEnabled: boolean; // Detection toggle
  soundEffectsOn: boolean;
  soundPack: SoundPack;
  activeOverlay: OverlayType;
  learningProfile: LearningProfile;
  masterProfile: MasterProfile; // NEW: Stores user identity
  customCommands: CustomCommand[];
  noFapData: NoFapState;
  alarms: Alarm[];
  focusMode: FocusState;
  musicState: ActiveMusic; // NEW: Active Music Player
  is3DMode: boolean;
  isFullScreenChat: boolean;
  userRole: UserRole; // SECURITY STATE
}