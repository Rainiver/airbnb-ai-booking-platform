require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

async function testSearchWithThresholds() {
  try {
    console.log('🔍 测试不同相似度阈值...\n');
    
    // 初始化
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // 生成查询向量
    const query = '海边的房子';
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;
    
    // 测试不同阈值
    const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    
    for (const threshold of thresholds) {
      const { data, error } = await supabase.rpc('match_listings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: 10
      });
      
      if (error) {
        console.error(`❌ 阈值 ${threshold}: 错误`, error.message);
      } else {
        const count = data ? data.length : 0;
        console.log(`阈值 ${threshold}: ${count} 个结果`);
        if (count > 0 && threshold === thresholds[0]) {
          console.log('  第一个结果的相似度:', data[0].similarity.toFixed(4));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testSearchWithThresholds();
