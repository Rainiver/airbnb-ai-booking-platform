import { NextRequest, NextResponse } from 'next/server';
import { orchestrateAgents } from '@/lib/ai/agents';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 使用 Multi-Agent 系统处理用户查询
    const response = await orchestrateAgents(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}