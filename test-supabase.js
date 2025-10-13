// 测试 Supabase 连接
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 错误：找不到 Supabase 环境变量');
      console.log('请检查 .env.local 文件中的：');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
      return;
    }

    console.log('🔍 测试 Supabase 连接...\n');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Key: ${supabaseKey.substring(0, 20)}...（已隐藏）\n`);

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 测试1：检查表是否存在
    console.log('测试1：检查 listing_embeddings 表');
    const { data, error, count } = await supabase
      .from('listing_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ 表不存在或权限问题:', error.message);
      console.log('\n⚠️ 请确认：');
      console.log('1. 已在 Supabase SQL Editor 中执行了 SQL');
      console.log('2. SQL 执行成功（显示 "Success"）');
      console.log('3. 刷新 Supabase 页面查看表是否创建\n');
      return;
    }

    console.log(`✅ 表存在！当前记录数: ${count || 0}\n`);

    // 测试2：检查函数是否存在
    console.log('测试2：测试 match_listings 函数');
    
    // 创建一个测试向量（768维，全为0.5）
    const testVector = Array(768).fill(0.5);
    
    const { data: funcData, error: funcError } = await supabase
      .rpc('match_listings', {
        query_embedding: testVector,
        match_threshold: 0.5,
        match_count: 5
      });

    if (funcError) {
      console.error('❌ 函数调用失败:', funcError.message);
      console.log('\n⚠️ 请确认函数已创建');
      return;
    }

    console.log(`✅ 函数工作正常！返回 ${funcData?.length || 0} 个结果\n`);

    console.log('🎉 所有测试通过！Supabase Vector Database 设置成功！\n');
    console.log('💡 下一步：运行 npm run generate-embeddings');
    console.log('   这将为你的 75 个房源生成向量并存储到 Supabase\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n详细错误：');
    console.error(error);
  }
}

testSupabase();

