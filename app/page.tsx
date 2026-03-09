import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            VibeCanvas
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            用自然语言创作互动体验 · AI 原生的创作平台
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/create"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
            >
              开始创作 ✨
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all border border-white/20"
            >
              探索作品 🎨
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <FeatureCard
            icon="🎮"
            title="游戏"
            description="用几句话创建互动游戏，从跑酷到解谜，想象即现实"
          />
          <FeatureCard
            icon="📖"
            title="互动书"
            description="构建分支叙事，让每个选择都通向不同的结局"
          />
          <FeatureCard
            icon="🎭"
            title="视觉玩具"
            description="创造令人惊叹的视觉效果和交互动画"
          />
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">工作原理</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <StepCard
              number="1"
              title="描述你的想法"
              description="用自然语言描述你想要的体验，可以加上图片灵感"
            />
            <StepCard
              number="2"
              title="AI 设计蓝图"
              description="Architect Agent 将你的想法转化为技术蓝图"
            />
            <StepCard
              number="3"
              title="AI 生成代码"
              description="Builder Agent 根据蓝图生成可运行的代码"
            />
            <StepCard
              number="4"
              title="实时预览"
              description="立即在沙盒中预览、调试、分享你的作品"
            />
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <p className="text-white/60 text-sm mb-4">技术栈</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <TechBadge>Next.js 14</TechBadge>
            <TechBadge>PixiJS</TechBadge>
            <TechBadge>Three.js</TechBadge>
            <TechBadge>GSAP</TechBadge>
            <TechBadge>Claude 3.5</TechBadge>
            <TechBadge>Supabase</TechBadge>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/70">{description}</p>
      </div>
    </div>
  );
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
      {children}
    </span>
  );
}
