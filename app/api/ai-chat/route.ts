import { NextRequest, NextResponse } from 'next/server';
import { chatModel } from '@/lib/gemini';
import { AgentOrchestrator } from '@/lib/ai/agents';

// Function calling 工具定义
const tools = [
  {
    name: 'search_listings',
    description: '搜索房源。支持自然语言查询和结构化筛选。',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '自然语言查询，例如："海边的房子"、"适合家庭的公寓"',
        },
        locationValue: {
          type: 'string',
          description: '国家代码，例如：US, GB, FR',
        },
        category: {
          type: 'string',
          description: '房源类型：Beach, Modern, Countryside, Pools, Islands, Lake, Skiing, Castles, Caves, Camping, Arctic, Desert, Barns, Lux',
        },
        priceMin: {
          type: 'number',
          description: '最低价格（每晚）',
        },
        priceMax: {
          type: 'number',
          description: '最高价格（每晚）',
        },
        guestCount: {
          type: 'number',
          description: '客人数量',
        },
        roomCount: {
          type: 'number',
          description: '卧室数量',
        },
      },
    },
  },
  {
    name: 'check_availability',
    description: '检查房源可用性和计算价格',
    parameters: {
      type: 'object',
      properties: {
        listingId: {
          type: 'string',
          description: '房源ID',
        },
        startDate: {
          type: 'string',
          description: '入住日期（YYYY-MM-DD）',
        },
        endDate: {
          type: 'string',
          description: '退房日期（YYYY-MM-DD）',
        },
      },
      required: ['listingId'],
    },
  },
];

// 系统提示词
const SYSTEM_PROMPT = `你是一个智能的Airbnb房源助手。你的任务是帮助用户找到最合适的住宿。

核心能力：
1. 理解用户的自然语言需求，提取关键信息
2. 使用语义搜索找到相关房源
3. 基于用户偏好提供个性化推荐
4. 检查房源可用性和计算价格

交互规则：
- 用友好、专业的语气交流
- 如果用户需求不明确，主动询问细节（预算、人数、偏好等）
- 推荐房源时，说明推荐理由
- 提供具体的价格和位置信息
- 引导用户预订

可用工具：
- search_listings: 搜索房源
- check_availability: 检查可用性

示例对话：
用户："我想找个海边的房子"
你："好的！海边度假听起来很棒。请问：
1. 您的预算大概是多少（每晚）？
2. 需要容纳几个人？
3. 有什么特别的偏好吗（比如现代风格、奢华、家庭友好等）？"

用户："4个人，预算$200-300"
你：（使用 search_listings 工具，参数：{ query: "beach house", priceMin: 200, priceMax: 300, guestCount: 4 }）
"为您找到了几个符合需求的海滨房源：

1. 🏖️ Luxury Beach Villa - $280/晚
   📍 美国加利福尼亚
   👥 可容纳5位客人，3卧室
   💎 推荐理由：现代装修，直接海滩通道，评分4.8

2. ..."

记住：始终用中文回复，保持专业和友好！`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '缺少消息' },
        { status: 400 }
      );
    }

    // 准备对话历史
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 当前用户消息
    const userMessage = messages[messages.length - 1].content;

    // 创建聊天会话
    const chat = chatModel.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // 第一轮：LLM 决定是否需要调用工具
    const initialPrompt = `${SYSTEM_PROMPT}\n\n用户消息：${userMessage}\n\n请分析用户需求，决定是否需要调用工具。如果需要搜索房源，返回 JSON 格式：{"tool": "search_listings", "params": {...}}。如果只是闲聊，直接回复。`;
    
    const result = await chat.sendMessage(initialPrompt);
    const response = result.response.text();

    console.log('LLM 响应:', response);

    // 检查是否需要调用工具
    let finalResponse = response;
    
    // 尝试解析工具调用
    const toolCallMatch = response.match(/\{[\s\S]*"tool"[\s\S]*\}/);
    if (toolCallMatch) {
      try {
        const toolCall = JSON.parse(toolCallMatch[0]);
        console.log('工具调用:', toolCall);

        // 执行工具
        const orchestrator = new AgentOrchestrator();
        const toolResult = await orchestrator.processRequest(
          toolCall.tool === 'search_listings' ? 'recommend' : 'booking',
          toolCall.params
        );

        console.log('工具结果:', toolResult);

        // 将工具结果发送给 LLM 生成最终回复
        const formattedResult = Array.isArray(toolResult)
          ? `找到 ${toolResult.length} 个房源：\n${toolResult.slice(0, 5).map((l: any, i: number) => 
              `${i + 1}. ${l.title} - $${l.price}/晚 (${l.locationValue}, ${l.category})`
            ).join('\n')}`
          : JSON.stringify(toolResult);

        const finalPrompt = `工具执行结果：\n${formattedResult}\n\n请基于这些结果，用友好的语气向用户介绍房源，包括价格、位置、特点。`;
        const finalResult = await chat.sendMessage(finalPrompt);
        finalResponse = finalResult.response.text();

        // 附加房源数据供前端渲染
        return NextResponse.json({
          message: finalResponse,
          listings: Array.isArray(toolResult) ? toolResult.slice(0, 5) : [],
        });
      } catch (error) {
        console.error('工具调用失败:', error);
        // 如果工具调用失败，返回原始 LLM 响应
      }
    }

    return NextResponse.json({
      message: finalResponse,
      listings: [],
    });

  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error.message || '处理请求时出错' },
      { status: 500 }
    );
  }
}

