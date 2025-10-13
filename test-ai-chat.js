// 测试 AI 聊天功能
require('dotenv').config({ path: '.env.local' });

async function testAIChat() {
  console.log('🤖 测试 AI 聊天功能...\n');

  try {
    // 测试查询
    const testQueries = [
      '我想找海边的房子',
      '推荐一些便宜的房源',
      '帮我找个适合家庭的大房子'
    ];

    for (const query of testQueries) {
      console.log(`📝 测试查询: "${query}"`);
      
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 响应: ${data.response.substring(0, 100)}...\n`);
      } else {
        console.log(`❌ 错误: ${response.status} ${response.statusText}\n`);
      }
    }

    console.log('🎉 AI 聊天功能测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 等待服务器启动
setTimeout(testAIChat, 5000);
