# VibeCanvas - AI 互动创作平台

用自然语言创作互动体验的 AI 原生平台。通过"Vibe Coding"理念，让用户描述想法，AI 负责设计与实现。

## 🎯 项目特性

- **双 AI Agent 架构**：Architect（意图解析） + Builder（代码生成）
- **多模态输入**：支持文本描述 + 图片灵感
- **实时预览**：iframe 沙箱 + 自愈循环（Self-Healing Loop）
- **强大渲染**：PixiJS (2D) + Three.js (3D) + GSAP + Howler.js
- **项目谱系**：Remix 功能 + Supabase 存储
- **微信集成**：WeChat JSSDK Bridge（分享/震动/保存）

## 🏗️ 技术栈

### 前端
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI** (移动端优化)
- **Zustand** (状态管理)

### 渲染引擎 (VibeEngine v3.0)
- **PixiJS v8** - 高性能 2D 渲染
- **Three.js r128** - WebGL 3D 渲染
- **GSAP** - 动画系统
- **Howler.js** - 音频管理

### AI 模型
- **Architect Agent**: GLM-4V / Claude 3.5
- **Builder Agent**: Claude 3.5 Sonnet

### 后端
- **Supabase** (PostgreSQL + 实时订阅)

## 📂 项目结构

```
vibecanvas/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 首页
│   ├── create/page.tsx          # 创作页面
│   ├── explore/page.tsx         # 探索页面
│   ├── project/[id]/page.tsx    # 项目详情
│   └── api/                     # API 路由
│       └── projects/            # 项目 CRUD
├── components/
│   ├── PreviewSandbox.tsx       # iframe 预览沙箱
│   └── ui/                      # Shadcn 组件
├── lib/
│   ├── ai/
│   │   ├── translator.ts        # Architect Agent
│   │   └── coder.ts             # Builder Agent
│   └── supabase/
│       └── client.ts            # Supabase 客户端
├── types/
│   └── vibeblueprint.ts         # TypeScript 类型定义
├── public/
│   ├── vibe-engine.js           # VibeEngine SDK
│   └── assets/                  # 静态资源
└── supabase/
    └── migrations/              # 数据库迁移
        └── 001_initial_schema.sql
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量配置

复制 `.env.example` 为 `.env` 并填写：

```env
# AI Agent API Keys
ARCHITECT_API_KEY=your_glm_or_claude_api_key_here
CODER_API_KEY=your_claude_sonnet_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 数据库初始化

在 Supabase Dashboard 中执行 `supabase/migrations/001_initial_schema.sql`。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

## 🎨 VibeBlueprint 协议

核心数据结构，定义了 Architect 和 Builder 之间的契约：

```typescript
interface VibeBlueprint {
  meta: {
    title: string;
    type: "game" | "interactive_book" | "visual_toy";
    view_mode: "2d" | "3d";
    vibe_tags: string[];
    version: string;
    parent_id?: string;
  };
  visual_spec: {
    palette: string[];
    background: string;
    font_style: "pixel" | "serif" | "sans-serif";
  };
  assets: Array<{
    id: string;
    type: "image" | "3d_primitive";
    source: string;
    role: "player" | "enemy" | "background" | "item";
    physics: { mass: number; friction: number; is_static: boolean };
    initial_transform: { scale: number; x_align: string; y_align: string };
  }>;
  audio_manifest: {
    bgm_prompt: string;
    sfx_events: Record<string, string>;
  };
  interaction_logic: {
    global_state: Record<string, any>;
    events: Array<{
      trigger: "tap" | "swipe" | "collision" | "timer";
      target: string;
      action: string;
    }>;
  };
  juiciness: {
    animation_speed: number;
    elasticity: number;
  };
}
```

## 🔒 安全特性

### 内容安全检查 (`safetyCheck`)
所有用户输入在进入 AI Agent 前都会经过安全检查：
- NSFW 内容过滤
- 暴力内容检测
- 政治敏感词过滤

### 自愈循环 (Self-Healing Loop)
1. **捕获**：iframe 监听 `window.onerror`
2. **报告**：通过 `postMessage` 发送错误到 Host
3. **修复**：调用 Builder Agent 修复代码
4. **重载**：自动刷新 iframe（最多 2 次尝试）

## 🎮 VibeEngine SDK 快速参考

### 初始化
```javascript
Vibe.init({ mode: '2d', bgColor: '#000000' });
```

### 2D 示例
```javascript
const player = Vibe.spawnCircle(100, 100, 30, 0xff0000);
Vibe.moveTo2D(player, 300, 300, 2);
Vibe.fxPopIn(player);
```

### 3D 示例
```javascript
const box = Vibe.spawn3DBox(0, 0, 0, 1, 0x00ff00);
Vibe.add3DSpin(box, 0.01, 0.01);
Vibe.fx3DFloat(box);
```

### 叙事系统
```javascript
await Vibe.showDialog('侦探', '这个案子不简单...');
const choice = await Vibe.showChoices([
  { id: 'a', text: '继续调查' },
  { id: 'b', text: '放弃案子' }
]);
```

## 📱 微信小程序集成

### WeChat JSSDK Bridge
```javascript
window.wxBridge.share(title, desc, imageUrl);
window.wxBridge.vibrate();
window.wxBridge.saveImage(dataUrl);
```

## 🔄 Remix 功能

用户可以基于现有项目创建新版本，系统自动追踪项目谱系：
- `parent_id` 字段记录原始项目
- `remix_count` 自动递增
- 支持跨代追溯

## 🧪 开发指南

### 添加新的 2D/3D 功能

在 `public/vibe-engine.js` 中扩展 `window.Vibe` 对象。

### 修改 Blueprint Schema

更新 `types/vibeblueprint.ts` 并同步更新 Architect/Builder 提示词。

### 调试 AI Agent

在 `.env` 中设置不同的模型：
```env
ARCHITECT_MODEL=claude-3-5-sonnet-20241022
CODER_MODEL=claude-3-5-sonnet-20241022
```

## 📊 数据库 Schema

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  blueprint JSONB NOT NULL,
  code_artifact TEXT NOT NULL,
  parent_id UUID REFERENCES projects(id),
  remix_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 常见问题

### Q: 生成的代码报错怎么办？
A: 自愈循环会自动尝试修复（最多 2 次）。如果仍然失败，检查 Browser Console。

### Q: 如何更换 AI 模型？
A: 修改 `.env` 中的 `ARCHITECT_API_KEY` 和 `CODER_API_KEY`。

### Q: 如何部署到生产环境？
A: 推荐使用 Vercel + Supabase：
```bash
vercel --prod
```

## 📄 License

MIT License

## 🙏 致谢

- [PixiJS](https://pixijs.com/)
- [Three.js](https://threejs.org/)
- [GSAP](https://greensock.com/gsap/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Supabase](https://supabase.com/)

---

**VibeCanvas** - 让创意自由流动 ✨
