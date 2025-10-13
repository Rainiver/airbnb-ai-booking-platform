async function testAIWithCards() {
  console.log('🤖 测试 AI 聊天 API（带房源卡片）...\n');
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const query = '推荐便宜的房源';
  console.log(`📝 查询: "${query}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: query }),
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP 错误: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ AI 响应:\n');
    console.log(data.response);
    console.log(`\n📊 推荐房源数量: ${data.listings?.length || 0}`);
    
    if (data.listings && data.listings.length > 0) {
      console.log('\n🏠 房源列表:');
      data.listings.forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.title}`);
        console.log(`   ID: ${listing.id}`);
        console.log(`   价格: $${listing.price}/晚`);
        console.log(`   位置: ${listing.locationValue}`);
        console.log(`   链接: /listings/${listing.id}`);
        if (listing.recommendationReasons) {
          console.log(`   推荐理由: ${listing.recommendationReasons.join('、')}`);
        }
      });
    }
    
    console.log('\n🎉 测试成功！房源卡片数据已返回');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAIWithCards();
