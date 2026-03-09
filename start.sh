#!/bin/bash

# VibeCanvas Quick Start Script

echo "🎨 VibeCanvas - 快速启动脚本"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，从模板创建..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo "⚠️  请编辑 .env 文件，填写必要的 API Keys："
    echo "   - ARCHITECT_API_KEY"
    echo "   - CODER_API_KEY"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "按回车键继续配置，或 Ctrl+C 退出..."
    read
    ${EDITOR:-nano} .env
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败！"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# Check API keys
source .env 2>/dev/null
if [ -z "$ARCHITECT_API_KEY" ] || [ -z "$CODER_API_KEY" ]; then
    echo "⚠️  警告：未配置 AI API Keys"
    echo "   项目可以启动，但 AI 功能将无法使用"
    echo "   请在 .env 中配置 ARCHITECT_API_KEY 和 CODER_API_KEY"
    echo ""
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  警告：未配置 Supabase"
    echo "   项目可以启动，但保存功能将无法使用"
    echo "   请在 .env 中配置 Supabase 相关变量"
    echo ""
fi

echo "================================"
echo "🚀 启动开发服务器..."
echo ""
echo "访问地址："
echo "  - 首页: http://localhost:3000"
echo "  - 创作: http://localhost:3000/create"
echo "  - 探索: http://localhost:3000/explore"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"
echo ""

npm run dev
