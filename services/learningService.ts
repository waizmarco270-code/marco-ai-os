
import { LearningProfile } from '../types';

export const INITIAL_PROFILE: LearningProfile = {
  topCommands: {},
  preferredThemes: {},
  topics: {},
  totalInteractions: 0,
  lastActive: Date.now()
};

const TOPIC_KEYWORDS = [
  'react', 'javascript', 'typescript', 'python', 'code', 'bug', 'deploy', // Dev
  'hack', 'security', 'bypass', 'override', 'matrix', 'terminal', // Sci-fi/Hacking
  'weather', 'time', 'status', 'battery', 'network', // System
  'story', 'joke', 'poem', 'philosoph', // Creative
  'memory', 'remember', 'vault', 'save', // Memory
  'task', 'todo', 'plan', 'schedule' // Productivity
];

export const extractTopics = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  return TOPIC_KEYWORDS.filter(keyword => lowerText.includes(keyword));
};

export const updateProfile = (
  currentProfile: LearningProfile,
  action: { 
    type: 'COMMAND' | 'THEME' | 'TOPIC' | 'INTERACTION'; 
    value?: string;
    values?: string[];
  }
): LearningProfile => {
  const newProfile = { ...currentProfile };
  newProfile.lastActive = Date.now();

  if (action.type === 'INTERACTION') {
    newProfile.totalInteractions++;
  }

  if (action.type === 'COMMAND' && action.value) {
    newProfile.topCommands[action.value] = (newProfile.topCommands[action.value] || 0) + 1;
  }

  if (action.type === 'THEME' && action.value) {
    newProfile.preferredThemes[action.value] = (newProfile.preferredThemes[action.value] || 0) + 1;
  }

  if (action.type === 'TOPIC') {
    if (action.value) {
       newProfile.topics[action.value] = (newProfile.topics[action.value] || 0) + 1;
    }
    if (action.values) {
       action.values.forEach(v => {
          newProfile.topics[v] = (newProfile.topics[v] || 0) + 1;
       });
    }
  }

  return newProfile;
};

export const getTopInterests = (profile: LearningProfile, limit = 5): string[] => {
  return Object.entries(profile.topics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([topic]) => topic);
};
