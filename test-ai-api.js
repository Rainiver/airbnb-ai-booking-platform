async function testAIChat() {
  console.log('🤖 测试 AI 聊天 API...\n');
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const query = '我想找海边的房子';
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
      const text = await response.text();
      console.error('响应:', text);
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ AI 响应:\n');
    console.log(data.response);
    console.log('\n🎉 测试成功！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAIChat();
