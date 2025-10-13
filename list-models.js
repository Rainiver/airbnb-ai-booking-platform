// 列出可用的 Gemini 模型
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ 找不到 GEMINI_API_KEY');
      return;
    }

    console.log('🔍 查询可用的 Gemini 模型...\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 尝试直接使用 API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('📋 可用模型列表:\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`模型名: ${model.name}`);
        console.log(`显示名: ${model.displayName}`);
        console.log(`描述: ${model.description}`);
        console.log(`支持的方法: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('---');
      });
    } else {
      console.log('未找到可用模型');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  }
}

listModels();

