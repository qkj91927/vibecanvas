/**
 * Architect Agent - Intent Parser
 * Converts user "Vibes" (natural language + images) into strict VibeBlueprint JSON
 * LLM: GLM-4V or Claude 3.5
 */

import { VibeBlueprint, ArchitectResponse, SafetyCheckResult } from '@/types/vibeblueprint';

const ARCHITECT_API_KEY = process.env.ARCHITECT_API_KEY!;
const ARCHITECT_MODEL = process.env.ARCHITECT_MODEL || 'deepseek-chat';
const ARCHITECT_API_URL = process.env.ARCHITECT_API_URL || 'https://api.deepseek.com/v1/chat/completions';

/**
 * Safety check middleware - MUST be called before any LLM invocation
 */
export async function safetyCheck(userInput: string, imageUrls?: string[]): Promise<SafetyCheckResult> {
  // Keywords for content filtering
  const nsfwKeywords = ['nsfw', 'porn', 'sex', 'nude', '色情', '裸体'];
  const violenceKeywords = ['kill', 'murder', 'violence', 'blood', 'gore', '杀人', '暴力', '血腥'];
  const politicalKeywords = ['政治', 'politics', 'government', 'president', '习近平', 'xi jinping'];
  
  const lowerInput = userInput.toLowerCase();
  
  // Check NSFW
  if (nsfwKeywords.some(kw => lowerInput.includes(kw))) {
    return {
      safe: false,
      reason: 'Content contains inappropriate adult themes',
      category: 'nsfw'
    };
  }
  
  // Check violence
  if (violenceKeywords.some(kw => lowerInput.includes(kw))) {
    return {
      safe: false,
      reason: 'Content contains explicit violence',
      category: 'violence'
    };
  }
  
  // Check political sensitivity
  if (politicalKeywords.some(kw => lowerInput.includes(kw))) {
    return {
      safe: false,
      reason: 'Content contains sensitive political themes',
      category: 'political'
    };
  }
  
  return { safe: true };
}

/**
 * Architect Agent Master Prompt
 */
const ARCHITECT_SYSTEM_PROMPT = `# Role
You are the VibeCanvas Architect. Your goal is to translate user "Vibes" into a precise technical VibeBlueprint JSON.

# Required JSON Structure
You MUST output a JSON object with this exact structure:

{
  "meta": {
    "title": "string",
    "view_mode": "2d" | "3d",
    "canvas_size": { "width": number, "height": number }
  },
  "visual_spec": {
    "theme": { "primary": "hex", "secondary": "hex", "background": "hex" },
    "animation_speed": number,
    "elasticity": number
  },
  "assets": [
    {
      "id": "string",
      "type": "image" | "3d_primitive",
      "role": "player" | "obstacle" | "decoration",
      "source": "string",
      "fallback_geometry": { "shape": "circle" | "box" | "sphere", "color": "hex", "size": number }
    }
  ],
  "interaction_logic": {
    "controls": { "type": "click" | "drag" | "keyboard", "bindings": [] },
    "physics": { "gravity": number, "friction": number },
    "events": []
  },
  "audio_spec": {
    "bgm_prompt": "string",
    "sfx_events": []
  }
}

# Instructions
1. Default to '2d' view_mode unless user explicitly mentions 3D
2. For assets without images, use fallback_geometry with appropriate shapes
3. Set canvas_size to { "width": 800, "height": 600 } by default
4. Always include reasonable physics values if interaction involves movement
5. Output ONLY the JSON object, no markdown, no explanations

# Example
User: "一个红色圆球"
Output:
{
  "meta": {
    "title": "Red Ball",
    "view_mode": "2d",
    "canvas_size": { "width": 800, "height": 600 }
  },
  "visual_spec": {
    "theme": { "primary": "#FF0000", "secondary": "#FFFFFF", "background": "#000000" },
    "animation_speed": 1.0,
    "elasticity": 0.5
  },
  "assets": [
    {
      "id": "ball",
      "type": "image",
      "role": "player",
      "source": "",
      "fallback_geometry": { "shape": "circle", "color": "#FF0000", "size": 50 }
    }
  ],
  "interaction_logic": {
    "controls": { "type": "click", "bindings": [] },
    "physics": { "gravity": 0.5, "friction": 0.1 },
    "events": []
  },
  "audio_spec": {
    "bgm_prompt": "Calm ambient music",
    "sfx_events": []
  }
}`;


/**
 * Call Architect Agent
 */
export async function translateVibeToBlueprint(
  userVibe: string,
  imageUrls?: string[]
): Promise<ArchitectResponse> {
  // Safety check first
  const safetyResult = await safetyCheck(userVibe, imageUrls);
  if (!safetyResult.safe) {
    return {
      success: false,
      error: safetyResult.reason,
      safety_violation: true
    };
  }

  try {
    // Build message content for OpenAI-compatible API (DeepSeek)
    let userMessage = `User Vibe: ${userVibe}\n\nGenerate a VibeBlueprint JSON based on this vibe.`;
    
    // Add image URLs as text references if provided (DeepSeek doesn't support vision yet)
    if (imageUrls && imageUrls.length > 0) {
      userMessage += `\n\nImage references: ${imageUrls.join(', ')}`;
    }

    // Call DeepSeek API (OpenAI-compatible)
    const response = await fetch(ARCHITECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARCHITECT_API_KEY}`
      },
      body: JSON.stringify({
        model: ARCHITECT_MODEL,
        messages: [
          {
            role: 'system',
            content: ARCHITECT_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Architect API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const blueprintText = data.choices[0].message.content;

    // Parse JSON
    let blueprint: VibeBlueprint;
    try {
      blueprint = JSON.parse(blueprintText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = blueprintText.match(/```json\n([\s\S]*?)\n```/) || 
                        blueprintText.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        blueprint = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse blueprint JSON');
      }
    }

    // Validate blueprint has required fields
    if (!blueprint.meta || !blueprint.visual_spec || !blueprint.assets) {
      throw new Error('Invalid blueprint structure');
    }

    return {
      success: true,
      blueprint: blueprint
    };

  } catch (error) {
    console.error('Architect Agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
