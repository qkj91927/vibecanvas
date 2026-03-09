/**
 * VibeBlueprint - The Protocol
 * This is the strict JSON schema that acts as the "Contract" between Architect and Builder
 */

export type ViewMode = "2d" | "3d";
export type ProjectType = "game" | "interactive_book" | "visual_toy";
export type FontStyle = "pixel" | "serif" | "sans-serif";
export type AssetType = "image" | "3d_primitive";
export type AssetRole = "player" | "enemy" | "background" | "item";
export type TriggerType = "tap" | "swipe" | "collision" | "timer";
export type ActionType = "shake_screen" | "confetti" | "play_sfx" | "change_state";

export interface VibeBlueprint {
  meta: {
    title: string;
    type: ProjectType;
    view_mode: ViewMode;
    vibe_tags: string[];
    version: string;
    parent_id?: string; // UUID of original project if Remix
  };
  
  visual_spec: {
    palette: string[]; // Hex codes
    background: string; // CSS color or Image URL for 2D, or THREE.Color for 3D
    font_style: FontStyle;
  };
  
  assets: Array<{
    id: string;
    type: AssetType;
    source: string; // URL or THREE geometry type (box, sphere, torus, etc.)
    role: AssetRole;
    physics: {
      mass: number;
      friction: number;
      is_static: boolean;
    };
    initial_transform: {
      scale: number;
      x_align: "center" | "left" | "right";
      y_align: "center" | "top" | "bottom";
    };
  }>;
  
  audio_manifest: {
    bgm_prompt: string; // For AI Music generation
    sfx_events: Record<string, string>; // e.g., { "collision": "pop.mp3" }
  };
  
  interaction_logic: {
    global_state: Record<string, any>; // e.g., { score: 0, health: 3 }
    events: Array<{
      trigger: TriggerType;
      target: string; // Asset ID
      action: ActionType;
    }>;
  };
  
  juiciness: {
    animation_speed: number; // 0.5 to 2.0
    elasticity: number; // 0.0 to 1.0 (for GSAP ease)
  };
}

/**
 * Database Schema - Project Table
 */
export interface Project {
  id: string; // UUID
  user_id: string;
  blueprint: VibeBlueprint; // JSONB
  code_artifact: string; // Generated HTML
  parent_id?: string; // UUID, nullable
  remix_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * AI Agent Response Types
 */
export interface ArchitectResponse {
  success: boolean;
  blueprint?: VibeBlueprint;
  error?: string;
  safety_violation?: boolean;
}

export interface BuilderResponse {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Safety Check Result
 */
export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  category?: "nsfw" | "violence" | "political";
}
