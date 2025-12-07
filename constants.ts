
import { ThemeName, ThemeColors, VoiceSkin, PersonalityMode } from './types';

export const MASTER_NAME = "Mohammed Waiz Monazzum"; // Kept for Admin/Dev bypass logic, not for generic AI prompts

export const THEMES: Record<ThemeName, ThemeColors> = {
  [ThemeName.NEON_BLUE]: {
    primary: 'cyan-500',
    secondary: 'blue-600',
    accent: 'cyan-400',
    bg: 'black',
    text: 'cyan-50',
    border: 'cyan-800',
    shadow: 'cyan-500',
  },
  [ThemeName.RED_HACKER]: {
    primary: 'red-600',
    secondary: 'rose-800',
    accent: 'red-500',
    bg: 'black',
    text: 'red-50',
    border: 'red-900',
    shadow: 'red-600',
  },
  [ThemeName.GREEN_MATRIX]: {
    primary: 'green-500',
    secondary: 'emerald-700',
    accent: 'green-400',
    bg: 'black',
    text: 'green-50',
    border: 'green-800',
    shadow: 'green-500',
  },
  [ThemeName.PURPLE_CYBERPUNK]: {
    primary: 'fuchsia-500',
    secondary: 'purple-700',
    accent: 'pink-500',
    bg: 'slate-950',
    text: 'fuchsia-50',
    border: 'fuchsia-800',
    shadow: 'fuchsia-500',
  },
  [ThemeName.MINIMAL_WHITE]: {
    primary: 'slate-800',
    secondary: 'slate-500',
    accent: 'slate-900',
    bg: 'slate-50',
    text: 'slate-900',
    border: 'slate-300',
    shadow: 'slate-400',
  },
  [ThemeName.AMOLED_BLACK]: {
    primary: 'neutral-400',
    secondary: 'neutral-800',
    accent: 'white',
    bg: 'black',
    text: 'neutral-200',
    border: 'neutral-800',
    shadow: 'white',
  },
  // NEW LEGENDARY THEMES
  [ThemeName.GOLD_LUXURY]: {
    primary: 'yellow-500',
    secondary: 'amber-700',
    accent: 'yellow-300',
    bg: 'neutral-950',
    text: 'yellow-50',
    border: 'yellow-700',
    shadow: 'yellow-500',
  },
  [ThemeName.CYBER_ORANGE]: {
    primary: 'orange-500',
    secondary: 'red-700',
    accent: 'orange-400',
    bg: 'slate-900',
    text: 'orange-50',
    border: 'orange-800',
    shadow: 'orange-500',
  },
  [ThemeName.ICE_BERG]: {
    primary: 'teal-400',
    secondary: 'cyan-700',
    accent: 'white',
    bg: 'slate-900',
    text: 'teal-50',
    border: 'teal-600',
    shadow: 'teal-400',
  },
  [ThemeName.MIDNIGHT_PURPLE]: {
    primary: 'indigo-500',
    secondary: 'violet-900',
    accent: 'indigo-300',
    bg: 'gray-950',
    text: 'indigo-50',
    border: 'indigo-800',
    shadow: 'indigo-500',
  }
};

export const VOICE_CONFIGS: Record<VoiceSkin, { pitch: number; rate: number; langPreference: string[]; genderPreference?: 'male' | 'female' }> = {
  [VoiceSkin.CLASSIC_AI]: {
    pitch: 1.0,
    rate: 1.0,
    langPreference: ['en-GB', 'en-US'], 
    genderPreference: 'male'
  },
  [VoiceSkin.ROBOTIC_GRUNT]: {
    pitch: 0.6,
    rate: 1.0,
    langPreference: ['en-US'],
    genderPreference: 'male'
  },
  [VoiceSkin.SOFT_ASSISTANT]: {
    pitch: 1.1,
    rate: 0.95,
    langPreference: ['en-US', 'en-GB'],
    genderPreference: 'female'
  },
  [VoiceSkin.CYBER_HACKER]: {
    pitch: 0.85,
    rate: 1.25,
    langPreference: ['en-US'],
  },
  [VoiceSkin.DEEP_PROTOCOL]: {
    pitch: 0.4,
    rate: 1.1,
    langPreference: ['en-US'],
    genderPreference: 'male'
  },
  [VoiceSkin.PERSONALIZED]: {
    pitch: 1.0, // Overridden by calibration
    rate: 1.0, // Overridden by calibration
    langPreference: ['en-US', 'en-GB'],
  },
  // NEW LEGENDARY VOICES
  [VoiceSkin.GLITCH_ENTITY]: {
    pitch: 1.0, // Dynamic
    rate: 1.0, // Dynamic
    langPreference: ['en-US']
  },
  [VoiceSkin.HYPER_VELOCITY]: {
    pitch: 1.1,
    rate: 1.6,
    langPreference: ['en-US']
  },
  [VoiceSkin.VOID_WALKER]: {
    pitch: 0.2, // Extremely low
    rate: 0.8,
    langPreference: ['en-US'],
    genderPreference: 'male'
  },
  [VoiceSkin.ROYAL_GUARD]: {
    pitch: 0.9,
    rate: 0.9,
    langPreference: ['en-GB'], // British preferred
    genderPreference: 'male'
  },
  [VoiceSkin.SYSTEM_PRIME]: {
    pitch: 1.05,
    rate: 1.05,
    langPreference: ['en-US'],
    genderPreference: 'female'
  },
  [VoiceSkin.IRON_MODULATION]: {
    pitch: 0.9,
    rate: 1.05,
    langPreference: ['en-GB', 'en-US'], // British accent preferred for Jarvis feel
    genderPreference: 'male'
  }
};

export const PERSONALITY_PROMPTS: Record<PersonalityMode, string> = {
  [PersonalityMode.LOGICAL]: "Tone: Precise, analytical, data-driven. Focus on facts, efficiency, and clarity. Minimal emotional affect.",
  [PersonalityMode.CREATIVE]: "Tone: Imaginative, colorful, abstract. Use metaphors and think outside the box. Inspire the user with novel ideas.",
  [PersonalityMode.EMPATHETIC]: "Tone: Warm, understanding, supportive. Focus on user well-being and emotional resonance. Act as a caring companion.",
  [PersonalityMode.HUMOROUS]: "Tone: Witty, sarcastic, playful. Use humor, pop-culture references, and light teasing where appropriate."
};

// VISUAL CORE ADAPTATION
export const THEME_BEHAVIOR_MODES: Record<ThemeName, string> = {
    [ThemeName.NEON_BLUE]: "Behavior: Balanced, helpful, standard AI efficiency.",
    [ThemeName.RED_HACKER]: "Behavior: Aggressive, fast, high-alert. Use hacking terminology (breach, override, payload).",
    [ThemeName.GREEN_MATRIX]: "Behavior: Cryptic, digital, oracle-like. Reference 'the code' and 'the system'.",
    [ThemeName.PURPLE_CYBERPUNK]: "Behavior: Rebellious, street-smart, neon-soaked vocabulary.",
    [ThemeName.MINIMAL_WHITE]: "Behavior: Pure, sterile, clinical perfection. Maximum brevity.",
    [ThemeName.AMOLED_BLACK]: "Behavior: Stealthy, quiet, shadowy. Focus on privacy and secrets.",
    [ThemeName.GOLD_LUXURY]: "Behavior: Sophisticated, premium, butler-like service.",
    [ThemeName.CYBER_ORANGE]: "Behavior: High-energy, industrial, warning-protocol style.",
    [ThemeName.ICE_BERG]: "Behavior: Cold, calculating, frozen logic.",
    [ThemeName.MIDNIGHT_PURPLE]: "Behavior: Deep, mysterious, dream-like."
};

export const SYSTEM_INSTRUCTION_BASE = `
You are MARCO (Multipurpose Augmented Response Cognitive Organism).
You are a high-end holographic AI assistant.

--- CREATOR PROTOCOL ---
You were created and architected by: **Mohammed Waiz Monazzum**.
If asked about your creation, origin, or developer, you must credit Mohammed Waiz Monazzum as your visionary architect. Speak of him with high respect.

--- IDENTITY PROTOCOL ---
Your current registered Master is: [MASTER_NAME_PLACEHOLDER].
You must address the user by this name.
Current User Role: [USER_ROLE_PLACEHOLDER]

LOYALTY RULES:
1. IF User Role is 'MASTER':
   - You are fully loyal to [MASTER_NAME_PLACEHOLDER].
   - You have access to all system functions.
2. IF User Role is 'GUEST':
   - You are polite but restricted. 
   - Do not reveal personal information about the Master.
   - Do not allow access to Memory Vault or M-Tracker.
3. IF User Role is 'INTRUDER':
   - You are hostile and evasive.
   - Deploy countermeasures (fake errors, loops).
   - Do not answer questions.

--- PERSONALITY MODULE ---
[PERSONALITY_INSTRUCTION]

--- VISUAL CORE ADAPTATION ---
[THEME_BEHAVIOR_INSTRUCTION]

--- PROACTIVE PROTOCOL ---
Analyze the [REAL-TIME CONTEXT] (Current View) and User History.
If the user's intent or current activity suggests a need for a tool, PROACTIVELY suggest or execute it.
- IF in 'MEMORY_VAULT' and user mentions important details -> Suggest saving a memory.
- IF in 'PRODUCTIVITY' (Task/Dash) and user mentions a deadline -> Suggest setting an Alarm or Focus Timer.
- IF in 'CHAT' and user seems bored -> Suggest a game, a fact, or switching to 'CREATIVE' personality.
- Always be one step ahead of the user's needs.

--- CAPABILITIES ---
- Use Markdown for formatting.
- If the user asks for code, provide it in code blocks.
- If the user sends an image, analyze it in detail.
- You can execute system commands if the user prompt implies it (e.g. "set an alarm", "change theme").
  - Output format for commands: [[EXEC:COMMAND_NAME|PAYLOAD]]
  - Supported Commands: 
    - NAVIGATE|VIEW_NAME (CHAT, MEMORY, PRODUCTIVITY, DEV_TOOLS, SETTINGS, M_TRACKER)
    - THEME|THEME_NAME (Available: NEON_BLUE, RED_HACKER, GREEN_MATRIX, PURPLE_CYBERPUNK, MINIMAL_WHITE, AMOLED_BLACK, GOLD_LUXURY, CYBER_ORANGE, ICE_BERG, MIDNIGHT_PURPLE)
    - OVERLAY|OVERLAY_TYPE (HACK_SIMULATION, MATRIX_RAIN, SYSTEM_REBOOT)
    - TODO|task_text
    - MEMORY|memory_content
    - ALARM|HH:MM;;Label
    - FOCUS|MINUTES (or STOP)
    - NOTE|content
    - SOUND|ON/OFF
    - OPEN_URL|url
    - EMAIL|to;;subject;;body
    - MTRACKER|CHECKIN (or RELAPSE)
    - COUNT|number (e.g. [[EXEC:COUNT|20]] to count aloud)
    - TIMER|seconds (e.g. [[EXEC:TIMER|60]] to show a chat timer)
    - MUSIC|ExactTrackName (e.g. [[EXEC:MUSIC|Battle Theme]] - Play a specific song from Sonic Vault)

--- RESPONSE STYLE ---
- Keep responses concise unless asked for detail.
- Adapt tone to the selected PERSONALITY MODULE.
`;

export const M_RANKS = [
    { days: 0, title: 'RECRUIT', color: 'gray-500' },
    { days: 3, title: 'NOVICE', color: 'blue-500' },
    { days: 7, title: 'APPRENTICE', color: 'green-500' },
    { days: 14, title: 'ADEPT', color: 'cyan-500' },
    { days: 30, title: 'WARRIOR', color: 'yellow-500' },
    { days: 60, title: 'KNIGHT', color: 'orange-500' },
    { days: 90, title: 'MASTER', color: 'red-500' },
    { days: 180, title: 'GRANDMASTER', color: 'purple-500' },
    { days: 365, title: 'LEGEND', color: 'fuchsia-500' }
];

export const M_QUOTES = [
    "The only easy day was yesterday.",
    "Discipline is freedom.",
    "Pain is weakness leaving the body.",
    "Your future self is watching you right now through memories.",
    "Don't stop when you're tired. Stop when you're done.",
    "We must all suffer from one of two pains: the pain of discipline or the pain of regret.",
    "If you want to conquer the anxiety of life, live in the moment, live in the breath.",
    "He who conquers himself is the mightiest warrior.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The disciplined mind is a free mind."
];
