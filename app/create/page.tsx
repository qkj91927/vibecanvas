'use client';

import { useState } from 'react';
import { translateVibeToBlueprint } from '@/lib/ai/translator';
import { generateCode } from '@/lib/ai/coder';
import PreviewSandbox from '@/components/PreviewSandbox';
import { VibeBlueprint } from '@/types/vibeblueprint';

export default function CreatePage() {
  const [vibe, setVibe] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'architect' | 'builder' | 'preview'>('input');
  const [blueprint, setBlueprint] = useState<VibeBlueprint | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!vibe.trim()) {
      setError('请输入你的创意描述');
      return;
    }

    setIsProcessing(true);
    setError('');
    setCurrentStep('architect');

    try {
      // Step 1: Architect Agent - Translate vibe to blueprint
      console.log('[Create] Calling Architect Agent...');
      const architectResult = await translateVibeToBlueprint(vibe);

      if (!architectResult.success || !architectResult.blueprint) {
        throw new Error(architectResult.error || 'Architect failed');
      }

      if (architectResult.safety_violation) {
        setError('内容包含敏感信息，请修改后重试');
        setIsProcessing(false);
        setCurrentStep('input');
        return;
      }

      console.log('[Create] Blueprint generated:', architectResult.blueprint);
      setBlueprint(architectResult.blueprint);
      setCurrentStep('builder');

      // Step 2: Builder Agent - Generate code from blueprint
      console.log('[Create] Calling Builder Agent...');
      const builderResult = await generateCode(architectResult.blueprint);

      if (!builderResult.success || !builderResult.code) {
        throw new Error(builderResult.error || 'Builder failed');
      }

      console.log('[Create] Code generated successfully');
      setCode(builderResult.code);
      setCurrentStep('preview');

    } catch (err) {
      console.error('[Create] Error:', err);
      setError(err instanceof Error ? err.message : '创建失败，请重试');
      setCurrentStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!blueprint || !code) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user', // TODO: Replace with actual user ID from auth
          blueprint,
          code_artifact: code
        })
      });

      if (response.ok) {
        alert('项目已保存！');
      } else {
        throw new Error('保存失败');
      }
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎨 VibeCanvas 创作台
        </h1>

        {currentStep === 'input' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <label className="block text-lg mb-4 font-medium">
                描述你的创意 ✨
              </label>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="例如：一个赛博朋克风格的跑酷游戏，角色是发光的方块，背景有霓虹灯效果..."
                className="w-full h-48 bg-black/30 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
                disabled={isProcessing}
              />

              {error && (
                <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isProcessing}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105"
              >
                {isProcessing ? '创作中...' : '开始创作 🚀'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'architect' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-2xl">
              <div className="animate-pulse mb-4 text-6xl">🎨</div>
              <h2 className="text-2xl font-bold mb-2">Architect 正在设计蓝图...</h2>
              <p className="text-white/70">解析你的创意，生成技术方案</p>
            </div>
          </div>
        )}

        {currentStep === 'builder' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-2xl">
              <div className="animate-pulse mb-4 text-6xl">⚙️</div>
              <h2 className="text-2xl font-bold mb-2">Builder 正在编写代码...</h2>
              <p className="text-white/70">将蓝图转化为可运行的作品</p>
            </div>
          </div>
        )}

        {currentStep === 'preview' && code && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">预览你的作品 🎉</h2>
              <div className="space-x-4">
                <button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  保存项目
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('input');
                    setCode('');
                    setBlueprint(null);
                    setVibe('');
                  }}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  重新创作
                </button>
              </div>
            </div>

            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ height: '80vh' }}>
              <PreviewSandbox
                code={code}
                onError={(err) => console.error('Preview error:', err)}
                onStateChange={(state) => console.log('State change:', state)}
              />
            </div>

            {blueprint && (
              <details className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
                <summary className="cursor-pointer font-medium">查看技术蓝图</summary>
                <pre className="mt-4 bg-black/50 p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(blueprint, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
