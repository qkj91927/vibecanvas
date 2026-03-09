/**
 * API 验证测试脚本
 * 测试 Architect 和 Builder Agent 是否正常工作
 */

import { translateVibeToBlueprint } from './lib/ai/translator';
import { generateCode } from './lib/ai/coder';

async function testArchitect() {
  console.log('🧪 测试 Architect Agent...\n');
  
  const testVibe = '创建一个简单的弹跳球游戏，红色的圆形小球，点击屏幕会跳跃，有重力效果';
  
  try {
    const result = await translateVibeToBlueprint(testVibe);
    
    if (result.success && result.blueprint) {
      console.log('✅ Architect Agent 测试通过！');
      console.log('\n生成的 Blueprint:');
      console.log(JSON.stringify(result.blueprint, null, 2));
      return result.blueprint;
    } else {
      console.error('❌ Architect Agent 测试失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Architect Agent 异常:', error);
    return null;
  }
}

async function testBuilder(blueprint: any) {
  console.log('\n🧪 测试 Builder Agent...\n');
  
  try {
    const result = await generateCode(blueprint);
    
    if (result.success && result.code) {
      console.log('✅ Builder Agent 测试通过！');
      console.log('\n生成的代码长度:', result.code.length, '字符');
      console.log('\n代码预览（前 500 字符）:');
      console.log(result.code.substring(0, 500) + '...');
      return true;
    } else {
      console.error('❌ Builder Agent 测试失败:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Builder Agent 异常:', error);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('VibeCanvas AI Agent 验证测试');
  console.log('='.repeat(60));
  console.log();
  
  // 检查环境变量
  if (!process.env.ARCHITECT_API_KEY || !process.env.CODER_API_KEY) {
    console.error('❌ 错误：未配置 API Keys');
    console.error('请在 .env 文件中配置 ARCHITECT_API_KEY 和 CODER_API_KEY');
    process.exit(1);
  }
  
  console.log('✅ API Keys 已配置');
  console.log('Architect API:', process.env.ARCHITECT_API_URL || 'DeepSeek');
  console.log('Coder API:', process.env.CODER_API_URL || 'DeepSeek');
  console.log();
  
  // 测试 Architect
  const blueprint = await testArchitect();
  
  if (!blueprint) {
    console.error('\n测试终止：Architect Agent 失败');
    process.exit(1);
  }
  
  // 测试 Builder
  const builderSuccess = await testBuilder(blueprint);
  
  if (!builderSuccess) {
    console.error('\n测试终止：Builder Agent 失败');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 所有测试通过！VibeCanvas 已就绪');
  console.log('='.repeat(60));
  console.log('\n访问 http://localhost:3000 开始创作！');
}

main();
