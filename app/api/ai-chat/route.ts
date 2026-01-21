import { NextRequest, NextResponse } from 'next/server';
import { orchestrateAgents } from '@/lib/ai/agents';

// Enforce dynamic behavior to prevent stale responses
export const dynamic = 'force-dynamic';

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
      listings: result.listings,
      trace: result.trace
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return response field to match frontend expectations with error trace
    return NextResponse.json({
      response: 'Sorry, an error occurred while processing your request. Please check the trace details.',
      listings: [],
      trace: [{
        agent: 'System',
        action: 'API Error',
        status: 'failed',
        reasoning: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      }]
    });
  }
}