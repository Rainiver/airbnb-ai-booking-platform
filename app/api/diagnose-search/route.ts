
import { NextResponse } from 'next/server';
import { orchestrateAgents } from '@/lib/ai/agents';
import prisma from '@/lib/prismadb';

export async function GET() {
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        env: {
            hasGeminiKey: !!process.env.GEMINI_API_KEY,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
        dbTest: null,
        searchTest: null,
    };

    try {
        // 1. Database Connection Test
        const count = await prisma.listing.count();
        diagnostics.dbTest = {
            status: 'success',
            listingCount: count
        };
    } catch (error) {
        diagnostics.dbTest = {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
        };
    }

    try {
        // 2. Search Agent Test
        const query = 'romantic beachfront villa with pool';
        const result = await orchestrateAgents(query, 'diagnostic-session');

        diagnostics.searchTest = {
            status: 'success',
            message: result.message,
            listingsFound: result.listings?.length || 0,
            trace: result.trace
        };
    } catch (error) {
        diagnostics.searchTest = {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
        };
    }

    return NextResponse.json(diagnostics);
}
