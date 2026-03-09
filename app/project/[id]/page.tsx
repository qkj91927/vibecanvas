'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project } from '@/types/vibeblueprint';
import PreviewSandbox from '@/components/PreviewSandbox';
import Link from 'next/link';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.project);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemix = () => {
    if (project) {
      // Navigate to create page with parent_id
      router.push(`/create?remix=${project.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-4">😢</div>
        <div className="text-xl mb-6">项目不存在</div>
        <Link
          href="/explore"
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          返回探索
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/explore"
              className="hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              ← 返回
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{project.blueprint.meta.title}</h1>
              <div className="flex gap-2 text-sm text-white/60">
                <span>{project.blueprint.meta.type}</span>
                <span>•</span>
                <span>{project.blueprint.meta.view_mode.toUpperCase()}</span>
                <span>•</span>
                <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRemix}
              className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              🔄 Remix
            </button>
            <button
              onClick={() => {
                // TODO: Implement share
                alert('分享功能开发中...');
              }}
              className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              分享
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="h-[calc(100vh-80px)]">
        <PreviewSandbox
          code={project.code_artifact}
          onError={(err) => console.error('Preview error:', err)}
          onStateChange={(state) => console.log('State change:', state)}
        />
      </div>

      {/* Floating info panel */}
      <div className="fixed bottom-4 right-4 max-w-sm">
        <details className="bg-black/90 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer hover:bg-white/5 font-medium">
            📋 项目信息
          </summary>
          <div className="p-4 space-y-3 text-sm">
            <div>
              <div className="text-white/60 mb-1">Vibe Tags</div>
              <div className="flex flex-wrap gap-2">
                {project.blueprint.meta.vibe_tags.map((tag, i) => (
                  <span key={i} className="bg-purple-500/30 px-2 py-1 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-white/60 mb-1">Color Palette</div>
              <div className="flex gap-2">
                {project.blueprint.visual_spec.palette.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-white/60 mb-1">Assets</div>
              <div className="text-white/80">{project.blueprint.assets.length} 个资源</div>
            </div>
            
            {project.parent_id && (
              <div>
                <div className="text-white/60 mb-1">Remixed From</div>
                <Link
                  href={`/project/${project.parent_id}`}
                  className="text-blue-400 hover:underline"
                >
                  查看原作品
                </Link>
              </div>
            )}
            
            {project.remix_count > 0 && (
              <div>
                <div className="text-white/60 mb-1">Remix 次数</div>
                <div className="text-white/80">{project.remix_count}</div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
