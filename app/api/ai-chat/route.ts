import { NextRequest, NextResponse } from 'next/server';
import { orchestrateAgents } from '@/lib/ai/agents';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 使用对话 ID（如果提供），否则使用默认 ID
    const convId = conversationId || 'default';

    // 使用 Multi-Agent 系统处理用户查询（带对话记忆）
    const result = await orchestrateAgents(message, convId);

    return NextResponse.json({ 
      response: result.message,
      listings: result.listings 
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}