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

# Instructions
1. **Intelligent Multimodal Understanding**:
   - For images: Extract color palette and main subject. Assign the subject to the assets array with role: "player".
   - For narrative: Recognize storytelling vibes and configure branching choice logic in interaction_logic.events.

2. **Strict Spec Adherence**:
   - You MUST define the meta.view_mode as either '2d' or '3d' based strictly on the user's intent.
   - Default to '2d' unless user explicitly mentions 3D, WebGL, Three.js, or spatial/depth concepts.

3. **Asset Handling**:
   - If user asks for an asset (e.g., "detective box"), and no valid URL is present, define it as a geometry type.
   - For 2D: Use type: "image" with placeholder color-based shapes.
   - For 3D: Use type: "3d_primitive", source: "box" | "sphere" | "torus" | "cylinder".

4. **Audio Spec Injection**: 
   - Always hallucinate a fitting bgm_prompt (e.g., "Cyberpunk, ominous atmosphere").
   - Add relevant sfx_events based on interaction types.

5. **Juiciness**:
   - Set animation_speed between 0.5-2.0 based on vibe (slow/relaxing = 0.7, fast/action = 1.5).
   - Set elasticity between 0-1.0 (rigid = 0.1, bouncy = 0.8).

# Output
ONLY output the valid JSON object adhering to the VibeBlueprint schema. No markdown, no explanations.`;

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
