// AI 意图解析器 - 使用 Gemini 理解用户意图

import { chatModel } from '@/lib/gemini';

export interface UserIntent {
  type: 'search' | 'date_check' | 'price_predict' | 'booking' | 'general';
  searchQuery?: string;
  checkInDate?: string;  // ISO format
  checkOutDate?: string;  // ISO format
  listingId?: string;
  listingTitle?: string;
  enablePricePrediction?: boolean;
  reasoning?: string; // Chain of Thought reasoning
}

// Parse user query, extract intent and parameters
export async function parseUserIntent(
  message: string,
  conversationHistory?: string
): Promise<UserIntent> {
  try {
    const contextPrompt = conversationHistory
      ? `\n\n对话历史参考：\n${conversationHistory}\n`
      : '';

    const prompt = `你是一个旅行助手的意图分析器。请一步步思考用户的真实意图，然后提取关键信息。

用户查询: "${message}"${contextPrompt}

请按照以下格式输出你的回答：

Reasoning:
<在这里写下你的思考过程。例如：用户提到了"海边"，说明他想要Beach类型的房源；提到了"下周"，需要计算日期>

JSON:
{
  "type": "search | date_check | price_predict | booking | general",
  "searchQuery": "提取的搜索关键词（如：海边的房子）",
  "checkInDate": "入住日期（YYYY-MM-DD格式，如果提到）",
  "checkOutDate": "退房日期（YYYY-MM-DD格式，如果提到）",
  "listingId": "房源ID（如果提到具体房源）",
  "listingTitle": "房源名称（如果提到完整名称，如：Seaside Retreat 31）",
  "enablePricePrediction": true/false（如果询问价格趋势）
}

意图类型说明：
- search: 寻找房源（如："找海边的房子"）
- date_check: 检查日期可用性（如："1月1日到7日是否可用"）
- price_predict: 价格预测（如："这个日期价格会涨吗"，"什么时候预订最便宜"）
- booking: 预订房源（如："帮我预订这个房源"，"我要订 XXX"）
- general: 一般性问题（如："你好"）

重要规则：
1. 如果同时提到房源名称和价格问题，type 应该是 "price_predict"，并且要填写 listingTitle
2. 如果同时提到房源名称和预订，type 应该是 "booking"
3. listingTitle 必须是完整准确的房源名称，包括数字（如 "Seaside Retreat 31" 不是 "Seaside Retreat"）
4. **如果对话历史中刚提到某个房源，用户说"帮我预订"，应该从历史中提取房源名称**
5. **如果用户说"帮我预订，[日期]"，检查对话历史，提取最近提到的房源名称**

日期解析规则：
- "1月1日" → 今年或明年的1月1日（选择未来的日期）
- "下周五" → 计算具体日期
- "3天后" → 计算具体日期
- 如果只提到入住日期，退房日期默认为入住后1晚

当前日期参考: ${new Date().toISOString().split('T')[0]}`;

    const result = await chatModel.generateContent(prompt);
    const responseText = result.response.text();

    // 提取 Reasoning
    const reasoningMatch = responseText.match(/Reasoning:([\s\S]*?)(?=JSON:|$)/i);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '解析意图...';

    // 提取 JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('无法解析意图，返回默认搜索类型');
      return {
        type: 'search',
        searchQuery: message,
        reasoning: '无法解析具体意图，默认为搜索。'
      };
    }

    const intent = JSON.parse(jsonMatch[0]);
    intent.reasoning = reasoning;

    console.log('📋 解析的意图:', intent);

    return intent;
  } catch (error) {
    console.error('Intent parsing error:', error);
    // 默认为搜索类型
    return {
      type: 'search',
      searchQuery: message,
      reasoning: '解析出错，降级为普通搜索。'
    };
  }
}

// 简单的日期解析（备用方案，不依赖 LLM）
export function parseDateFromText(text: string): { checkIn?: Date; checkOut?: Date } {
  const result: { checkIn?: Date; checkOut?: Date } = {};

  // 匹配常见日期格式
  const patterns = [
    // "1月1日到1月7日"
    /(\d+)月(\d+)日到(\d+)月(\d+)日/,
    // "1月1日-1月7日"
    /(\d+)月(\d+)日[-～](\d+)月(\d+)日/,
    // "1/1到1/7"
    /(\d+)\/(\d+)到(\d+)\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = new Date().getFullYear();
      const checkIn = new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
      const checkOut = new Date(year, parseInt(match[3]) - 1, parseInt(match[4]));

      // 如果日期已过，使用明年
      if (checkIn < new Date()) {
        checkIn.setFullYear(year + 1);
        checkOut.setFullYear(year + 1);
      }

      result.checkIn = checkIn;
      result.checkOut = checkOut;
      return result;
    }
  }

  return result;
}
