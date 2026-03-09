'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/types/vibeblueprint';
import Link from 'next/link';

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?limit=50');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">探索作品 🎨</h1>
          <Link
            href="/create"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            创建新作品
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/10 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-xl text-white/70 mb-6">还没有作品，来创建第一个吧！</p>
            <Link
              href="/create"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105"
            >
              开始创作
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'game': return '🎮';
      case 'interactive_book': return '📖';
      case 'visual_toy': return '🎭';
      default: return '✨';
    }
  };

  const getViewModeLabel = (mode: string) => {
    return mode === '3d' ? '3D' : '2D';
  };

  return (
    <Link href={`/project/${project.id}`}>
      <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all hover:scale-105 cursor-pointer">
        {/* Preview thumbnail - using first color from palette as placeholder */}
        <div 
          className="h-40 flex items-center justify-center text-6xl"
          style={{ 
            background: project.blueprint.visual_spec.palette?.[0] || '#4a5568'
          }}
        >
          {getTypeEmoji(project.blueprint.meta.type)}
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg flex-1 line-clamp-1">
              {project.blueprint.meta.title}
            </h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
              {getViewModeLabel(project.blueprint.meta.view_mode)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {project.blueprint.meta.vibe_tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="text-xs bg-purple-500/30 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
            {project.remix_count > 0 && (
              <span>🔄 {project.remix_count} Remixes</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
