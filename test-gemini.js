// 测试 Gemini API 连接
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    // 检查 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ 错误：找不到 GEMINI_API_KEY 环境变量');
      console.log('请确保 .env.local 文件中有：');
      console.log('GEMINI_API_KEY=你的API-Key\n');
      return;
    }

    console.log('🔍 测试 Gemini API...\n');
    console.log(`API Key: ${apiKey.substring(0, 10)}...（已隐藏）\n`);

    // 初始化 Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 测试1：简单对话
    console.log('测试1：简单对话');
    const result = await model.generateContent('你好！请用一句话介绍自己。');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ AI 回复：${text}\n`);

    // 测试2：生成 Embedding
    console.log('测试2：生成 Embedding');
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const embeddingResult = await embeddingModel.embedContent('测试文本');
    const embedding = embeddingResult.embedding;
    console.log(`✅ Embedding 维度：${embedding.values.length}\n`);

    console.log('🎉 所有测试通过！Gemini API 工作正常！\n');
    console.log('💡 现在可以继续设置 Supabase 了！');

  } catch (error) {
    console.error('❌ 测试失败：', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('\n⚠️ API Key 无效，请检查：');
      console.log('1. API Key 是否正确复制（没有多余空格）');
      console.log('2. 是否在 Google AI Studio 启用了 Gemini API');
      console.log('3. API Key 是否以 "AIzaSy" 开头');
    } else if (error.message.includes('quota')) {
      console.log('\n⚠️ API 配额不足：');
      console.log('1. 免费额度：60 requests/min, 1500 requests/day');
      console.log('2. 请稍后再试');
    } else {
      console.log('\n详细错误：');
      console.log(error);
    }
  }
}

// 运行测试
testGemini();

