require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

async function testSearch() {
  try {
    console.log('🔍 测试语义搜索功能...\n');
    
    // 1. 初始化 Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // 2. 生成查询向量
    const query = '海边的房子';
    console.log(`📝 查询: "${query}"`);
    
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;
    console.log(`✅ 向量生成成功: ${queryEmbedding.length} 维\n`);
    
    // 3. 初始化 Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // 4. 执行语义搜索
    console.log('🔍 执行语义搜索...');
    const { data, error } = await supabase.rpc('match_listings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: 10
    });
    
    if (error) {
      console.error('❌ 搜索错误:', error);
      return;
    }
    
    console.log(`✅ 搜索结果: ${data ? data.length : 0} 个房源\n`);
    
    if (data && data.length > 0) {
      console.log('前 5 个结果:');
      data.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. listing_id: ${item.listing_id}, similarity: ${item.similarity.toFixed(3)}`);
      });
    } else {
      console.log('⚠️ 没有找到匹配的房源');
      
      // 检查数据库中的数据
      const { data: allData, error: allError } = await supabase
        .from('listing_embeddings')
        .select('listing_id, content')
        .limit(5);
      
      if (allError) {
        console.error('❌ 查询错误:', allError);
      } else {
        console.log('\n📊 数据库中的前 5 条记录:');
        allData.forEach((item, index) => {
          console.log(`${index + 1}. ${item.listing_id}: ${item.content.substring(0, 50)}...`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testSearch();
