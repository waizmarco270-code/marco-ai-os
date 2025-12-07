
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE, PERSONALITY_PROMPTS } from "../constants";
import { LearningProfile, UserRole, PersonalityMode } from "../types";
import { getTopInterests } from "./learningService";
import { getMemories, getMusicTracks } from "./storageService";

let ai: GoogleGenAI | null = null;

const initializeAI = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

const generateUserProfileContext = (profile: LearningProfile): string => {
  const topTopics = getTopInterests(profile);
  const preferredThemeEntry = Object.entries(profile.preferredThemes).sort((a,b) => b[1] - a[1])[0];
  const preferredTheme = preferredThemeEntry ? preferredThemeEntry[0] : 'None';
  
  if (profile.totalInteractions < 5) return "";

  return `
[USER LEARNING PROFILE]
- Interaction Level: ${profile.totalInteractions} (Level ${Math.floor(profile.totalInteractions / 10)})
- Top Interests: ${topTopics.join(', ') || 'General'}
- Preferred Visual Theme: ${preferredTheme}
- Tailor your responses to align with these interests.
`;
};

const generateRealTimeContext = (currentView: string): string => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() >= 23 || now.getHours() < 5;
    
    return `
[REAL-TIME CONTEXT]
- Current Interface View: ${currentView}
- Local System Time: ${timeString}
- Late Night Status: ${isLate ? 'YES (User might be tired)' : 'NO'}
- Date: ${now.toLocaleDateString()}
`;
};

const generateMemoryContext = async (userRole: UserRole): Promise<string> => {
  // CRITICAL SECURITY: ONLY MASTER GETS MEMORY ACCESS
  if (userRole !== 'MASTER') {
      return `
[LONG TERM MEMORY DATABANK]
STATUS: LOCKED.
REASON: UNAUTHORIZED USER ROLE ('${userRole}').
INSTRUCTION: If the user asks for personal data, stored memories, or secrets, YOU MUST REFUSE. State that access is restricted to the Master only.
`;
  }

  try {
    const memories = await getMemories();
    const musicTracks = await getMusicTracks(); // Fetch music list

    let memoryContext = "";
    if (memories.length > 0) {
        // Sort by type priority: directive > fact > summary > note
        const sortedMemories = memories.sort((a, b) => {
           const priority = { directive: 4, fact: 3, summary: 2, note: 1 };
           return (priority[b.type] || 0) - (priority[a.type] || 0);
        });

        // Take top 30 most relevant/recent memories to fit context
        const contextMemories = sortedMemories.slice(0, 30);

        const memoryString = contextMemories.map(m => {
           return `- [${m.type.toUpperCase()}] ${m.content} (Tags: ${m.tags.join(', ')})`;
        }).join('\n');
        
        memoryContext = `
[LONG TERM MEMORY DATABANK]
Use the following stored data to answer questions or follow instructions. 
'DIRECTIVE' type memories are permanent instructions you must obey.
'FACT' type memories are absolute truths about the user.
------------------------------------------------
${memoryString}
------------------------------------------------`;
    }

    let musicContext = "";
    if (musicTracks.length > 0) {
        const trackNames = musicTracks.map(t => `"${t.name}"`).join(', ');
        musicContext = `
[SONIC VAULT - AVAILABLE MUSIC]
The user has stored the following music tracks. You can play them using the [[EXEC:MUSIC|Track Name]] command.
Available Tracks: ${trackNames}
`;
    }

    return `
ACCESS GRANTED: MASTER IDENTIFIED.
${memoryContext}
${musicContext}
`;
  } catch (e) {
    console.error("Failed to load memories for AI context", e);
    return "";
  }
};

export const generateMarcoResponse = async (
  prompt: string,
  history: string,
  learningProfile: LearningProfile,
  currentView: string,
  userRole: UserRole,
  masterName: string, 
  personality: PersonalityMode, // NEW PARAM
  imageBase64?: string
): Promise<string> => {
  initializeAI();
  if (!ai) return "Error: API Key missing or client not initialized.";

  try {
    const userContext = generateUserProfileContext(learningProfile);
    const memoryContext = await generateMemoryContext(userRole);
    const realTimeContext = generateRealTimeContext(currentView);
    const personalityInstruction = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS[PersonalityMode.LOGICAL];
    
    // Inject correct role, Master Name AND Personality into base system prompt
    // We use Replace All to ensure all placeholders are filled
    const baseWithRole = SYSTEM_INSTRUCTION_BASE
        .replace(/\[USER_ROLE_PLACEHOLDER\]/g, userRole)
        .replace(/\[MASTER_NAME_PLACEHOLDER\]/g, masterName)
        .replace(/\[PERSONALITY_INSTRUCTION\]/g, personalityInstruction); 
    
    const fullSystemInstruction = `${baseWithRole}\n${realTimeContext}\n${userContext}\n${memoryContext}`;
    
    // Construct content parts
    const parts: any[] = [];
    
    // 1. Add History context
    let finalPrompt = `History:\n${history}\n\nUser: ${prompt}`;
    
    if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        });
        finalPrompt = `[VISUAL INPUT DETECTED]\nUser: ${prompt}\n(Analyze the attached visual data)`;
    }

    parts.push({ text: finalPrompt });

    // Using flash for speed in a chat interface
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
          parts: parts
      },
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.85, 
        maxOutputTokens: 500,
      },
    });

    return response.text || "Systems offline. No response data.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Communication with neural network failed.";
  }
};
