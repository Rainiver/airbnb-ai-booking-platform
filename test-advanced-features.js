// 测试高级 AI 功能
async function testAdvancedFeatures() {
  console.log('🚀 测试 AI 高级功能...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const testCases = [
    {
      name: '智能搜索',
      query: '推荐便宜的海边房源',
      expected: '应返回便宜的海滨房源'
    },
    {
      name: '日期查询',
      query: '1月1日到1月7日有哪些可用房源',
      expected: '应返回特定日期可用的房源，显示总价'
    },
    {
      name: '价格预测',
      query: '1月份的价格会涨吗',
      expected: '应分析价格趋势，显示预测价格'
    },
    {
      name: '智能预订',
      query: '帮我预订 Luxury Villa 1',
      expected: '应引导用户完成预订流程'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 测试: ${testCase.name}`);
    console.log(`❓ 查询: "${testCase.query}"`);
    console.log(`🎯 预期: ${testCase.expected}`);
    console.log('='.repeat(60));
    
    try {
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: testCase.query }),
      });

      if (!response.ok) {
        console.log(`❌ HTTP 错误: ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`\n✅ AI 响应:\n${data.response}\n`);
      console.log(`📊 返回房源数: ${data.listings?.length || 0}`);
      
      if (data.listings && data.listings.length > 0) {
        const firstListing = data.listings[0];
        console.log(`\n🏠 第一个房源:`);
        console.log(`   标题: ${firstListing.title}`);
        console.log(`   价格: $${firstListing.price}/晚`);
        
        if (firstListing.priceInfo) {
          console.log(`   预测价格: $${firstListing.priceInfo.predictedPrice}/晚`);
          console.log(`   价格变化: ${firstListing.priceInfo.priceChange}`);
          console.log(`   趋势: ${firstListing.priceInfo.priceTrend}`);
        }
        
        if (firstListing.totalPrice && firstListing.totalPrice !== firstListing.price) {
          console.log(`   总价: $${firstListing.totalPrice}`);
        }
        
        if (firstListing.availability) {
          console.log(`   可用性: ${firstListing.availability}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
    }
    
    // 延迟避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 所有测试完成！');
  console.log('='.repeat(60));
}

testAdvancedFeatures();
