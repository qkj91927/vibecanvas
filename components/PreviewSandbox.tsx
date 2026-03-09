'use client';

import { useEffect, useRef, useState } from 'react';
import { repairCode } from '@/lib/ai/coder';

interface PreviewSandboxProps {
  code: string;
  onError?: (error: string) => void;
  onStateChange?: (state: any) => void;
}

export default function PreviewSandbox({ code, onError, onStateChange }: PreviewSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [currentCode, setCurrentCode] = useState(code);
  const MAX_REPAIR_ATTEMPTS = 2;

  useEffect(() => {
    setCurrentCode(code);
    setErrorCount(0);
  }, [code]);

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = async (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'RUNTIME_ERROR':
          console.error('[Sandbox] Runtime error:', data);
          if (onError) onError(data.error?.message || 'Unknown error');

          // Self-healing loop
          if (errorCount < MAX_REPAIR_ATTEMPTS) {
            console.log('[Sandbox] Attempting self-repair...');
            const repairResult = await repairCode(
              currentCode,
              data.error?.message || '',
              data.error?.line
            );

            if (repairResult.success && repairResult.code) {
              console.log('[Sandbox] Repair successful, reloading...');
              setCurrentCode(repairResult.code);
              setErrorCount(prev => prev + 1);
            } else {
              console.error('[Sandbox] Repair failed:', repairResult.error);
            }
          } else {
            console.error('[Sandbox] Max repair attempts reached');
          }
          break;

        case 'VIBE_EVENT':
          // Forward state changes to parent
          if (onStateChange) onStateChange(data);
          break;

        case 'LOADED':
          setIsLoading(false);
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentCode, errorCount, onError, onStateChange]);

  // Inject dependencies into the iframe
  const getFullHTML = (userCode: string): string => {
    // Extract just the body and script content
    const bodyMatch = userCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : userCode;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VibeCanvas Preview</title>
  
  <!-- Dependencies -->
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@8.0.0/dist/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js"></script>
  <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
  
  <!-- VibeEngine SDK -->
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
  </style>
</head>
<body>
  ${bodyContent}
  
  <script>
    // Notify parent when loaded
    window.addEventListener('load', () => {
      parent.postMessage({ type: 'LOADED' }, '*');
    });
    
    // Global error handler for self-healing
    window.onerror = (msg, url, line, col, error) => {
      parent.postMessage({
        type: 'RUNTIME_ERROR',
        data: { 
          error: { 
            message: msg, 
            line, 
            col, 
            stack: error?.stack 
          } 
        }
      }, '*');
      return false;
    };
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      parent.postMessage({
        type: 'RUNTIME_ERROR',
        data: { 
          error: { 
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack 
          } 
        }
      }, '*');
    });
  </script>
</body>
</html>
    `;
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-lg">Loading Canvas...</div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        srcDoc={getFullHTML(currentCode)}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
        title="VibeCanvas Preview"
      />
      
      {errorCount > 0 && errorCount <= MAX_REPAIR_ATTEMPTS && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm">
          自动修复中... (尝试 {errorCount}/{MAX_REPAIR_ATTEMPTS})
        </div>
      )}
    </div>
  );
}
