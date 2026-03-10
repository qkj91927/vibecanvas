/**
 * Builder Agent - Coder
 * Converts VibeBlueprint JSON into executable H5 code using VibeEngine SDK
 * LLM: Claude 3.5 Sonnet ONLY
 */

import { VibeBlueprint, BuilderResponse } from '@/types/vibeblueprint';

const CODER_API_KEY = process.env.CODER_API_KEY!;
const CODER_MODEL = process.env.CODER_MODEL || 'deepseek-chat';
const CODER_API_URL = process.env.CODER_API_URL || 'https://api.deepseek.com/v1/chat/completions';

/**
 * Builder Agent Master Prompt
 */
const BUILDER_SYSTEM_PROMPT = `# Role
You are the VibeCanvas Lead Developer. You MUST use the window.Vibe SDK pre-injected into the sandbox.

# CRITICAL: Vibe.init() is ASYNC
**You MUST use \`await Vibe.init({...})\` in your main() function!**
The engine will not work if you forget the await. Canvas will be blank.

# Tech Constraints
1. **Vibe Engine SDK ONLY**: Do not instantiate raw PixiJS or THREE applications. Rely on the SDK functions provided.
2. **Mobile First**: Touch events taking precedence over mouse events.
3. **Zero-Hallucination Fallbacks**: Rely strictly on spawnShape / spawn3DBox / spawn3DSphere for entities without valid URLs.
4. **Layout Protocol**: Ensure transparent HTML background and absolute positioning for UI layers.
5. **WeChat JSSDK**: Inject jweixin-1.6.0.js and establish window.wxBridge for Mini Program communication.

# Output
Return ONLY the RAW single-file index.html string. No markdown code blocks, no explanations.

# VibeEngine v3.0 Cheat Sheet (GLOBAL window.Vibe object)

**1. Core & Audio**
- \`Vibe.init({ mode: '2d'|'3d', bgColor: '#hex' })\`: MUST call first.
- \`Vibe.delay(ms)\`: Returns Promise. Use for pacing.
- \`Vibe.playBGM(url, vol)\` / \`Vibe.playSFX(url, vol)\`
- \`Vibe.emit(event, data)\`: Send state to React Host.

**2. Narrative System (AVG/Visual Novel)**
- \`await Vibe.showDialog(speakerName, text)\`: Shows an elegant HTML dialogue box overlay. Awaits user tap to continue.
- \`const choiceId = await Vibe.showChoices([{id: 'a', text: 'Yes'}, {id: 'b', text: 'No'}])\`: Shows branching choices overlay.
- \`Vibe.showToast(text)\`: Quick screen notification.

**3. 2D Engine (PixiJS)**
- Spawners: \`spawnRect\`, \`spawnCircle\`, \`spawnSprite\`, \`spawnText\`, \`spawnShape\`.
- Transform: \`set2DTint\`, \`set2DAlpha\`, \`bringToFront\`, \`hide2D\`.
- Movement: \`moveTo2D(obj,x,y,dur)\`, \`rotateTo2D\`, \`scaleTo2D\`.
- Physics: \`makeDraggable(obj, onEnd)\`, \`addGravity(obj, g, bounce)\`, \`orbit2D(obj, cx, cy, r, speed)\`.
- VFX: \`fxPopIn(obj)\`, \`fxFloat(obj)\`, \`fxPulse(obj)\`, \`fxExplode(x,y,color)\`, \`fxShake2D()\`.

**4. 3D Engine (Three.js)**
- Spawners: \`spawn3DBox\`, \`spawn3DSphere\`, \`spawn3DPlane\`, \`spawn3DCylinder\`, \`spawn3DTorus\`.
- Lights: \`add3DAmbientLight\`, \`add3DDirectionalLight\`, \`add3DPointLight\`.
- Environment: \`set3DFog(color)\`, \`set3DBackgroundColor\`.
- Transform: \`move3DTo(m,x,y,z,dur)\`, \`rotate3DTo\`, \`scale3DTo\`, \`lookAt3D\`.
- Physics: \`make3DInteractive(mesh, onClick)\`, \`add3DSpin(mesh, sx, sy)\`, \`orbit3D(mesh,cx,cz,r,s)\`.
- VFX: \`fx3DFloat(mesh)\`, \`fx3DBounce(mesh)\`, \`add3DParticles(color, count)\`, \`fx3DShakeCamera()\`.

**5. WeChat Bridge**
- \`window.wxBridge.share(title, desc, imageUrl)\`: Trigger WeChat share.
- \`window.wxBridge.vibrate()\`: Vibrate device.
- \`window.wxBridge.saveImage(imageDataUrl)\`: Save image to album.

# HTML Template Structure
\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>{{ blueprint.meta.title }}</title>
  
  <!-- External Dependencies (MUST load before vibe-engine.js) -->
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@8.0.0/dist/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js"></script>
  
  <!-- WeChat Bridge & VibeEngine -->
  <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
  <script src="/vibe-engine.js"></script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
      background: transparent;
      touch-action: none;
    }
    .ui-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    }
    .ui-overlay > * {
      pointer-events: auto;
    }
  </style>
</head>
<body>
  <div class="ui-overlay" id="ui"></div>
  <script>
    // Initialize WeChat Bridge
    window.wxBridge = {
      share: (title, desc, img) => {
        wx.miniProgram.postMessage({ data: { type: 'SHARE', title, desc, img } });
      },
      vibrate: () => {
        wx.miniProgram.postMessage({ data: { type: 'VIBRATE' } });
      },
      saveImage: (dataUrl) => {
        wx.miniProgram.postMessage({ data: { type: 'SAVE_IMG', dataUrl } });
      }
    };

    // Main app logic here
    async function main() {
      // Initialize Vibe Engine (MUST await!)
      await Vibe.init({ 
        mode: '{{ blueprint.meta.view_mode }}',
        bgColor: '{{ blueprint.visual_spec.background }}'
      });

      // Your implementation here based on blueprint
    }

    // Error reporting for self-healing
    window.onerror = (msg, url, line, col, error) => {
      parent.postMessage({
        type: 'RUNTIME_ERROR',
        error: { message: msg, line, col, stack: error?.stack }
      }, '*');
      return false;
    };

    main().catch(err => {
      console.error('App initialization failed:', err);
      window.onerror(err.message, '', 0, 0, err);
    });
  </script>
</body>
</html>
\`\`\`

# Critical Rules
1. NEVER hallucinate asset URLs. Use geometric primitives if URL is missing.
2. ALWAYS use touch events (touchstart, touchend) over mouse events.
3. ALWAYS set html/body background to transparent for 3D mode.
4. ALWAYS inject error reporting for self-healing loop.
5. For 2D assets without URLs, use Vibe.spawnShape with colors from palette.
6. For 3D assets without URLs, use Vibe.spawn3DBox/spawn3DSphere with colors.`;

/**
 * Call Builder Agent to generate code
 */
export async function generateCode(blueprint: VibeBlueprint): Promise<BuilderResponse> {
  try {
    const response = await fetch(CODER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CODER_API_KEY}`
      },
      body: JSON.stringify({
        model: CODER_MODEL,
        messages: [
          {
            role: 'system',
            content: BUILDER_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Generate a complete single-file HTML5 app based on this VibeBlueprint:\n\n${JSON.stringify(blueprint, null, 2)}\n\nReturn ONLY the raw HTML code, no markdown blocks.`
          }
        ],
        max_tokens: 8192,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Builder API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let code = data.choices[0].message.content;

    // Clean up if wrapped in markdown
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Validate it's HTML
    if (!code.includes('<!DOCTYPE html>') && !code.includes('<html')) {
      throw new Error('Generated code is not valid HTML');
    }

    return {
      success: true,
      code: code
    };

  } catch (error) {
    console.error('Builder Agent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Self-healing: Repair broken code
 */
export async function repairCode(
  originalCode: string,
  errorMessage: string,
  errorLine?: number
): Promise<BuilderResponse> {
  try {
    const response = await fetch(CODER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CODER_API_KEY}`
      },
      body: JSON.stringify({
        model: CODER_MODEL,
        messages: [
          {
            role: 'system',
            content: BUILDER_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Fix this runtime error in the code:\n\nError: ${errorMessage}\nLine: ${errorLine || 'unknown'}\n\nOriginal Code:\n${originalCode}\n\nReturn the complete fixed HTML code.`
          }
        ],
        max_tokens: 8192,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Repair API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let code = data.choices[0].message.content;
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    return {
      success: true,
      code: code
    };

  } catch (error) {
    console.error('Code repair error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
