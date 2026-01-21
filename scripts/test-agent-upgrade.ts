/**
 * Test Script for Enterprise RAG + Agent Upgrade
 * 
 * This script directly tests the orchestrateAgents function
 * to verify CoT Intent Parser, Generative Reranker, and Observability Traces
 */

import { orchestrateAgents } from '../lib/ai/agents';

async function testAgentFlow() {
    console.log('🧪 Testing Enterprise RAG + Agent System\n');
    console.log('='.repeat(60));

    // Test 1: CoT Intent Parser with ambiguous query
    console.log('\n📝 Test 1: Chain-of-Thought Intent Parsing');
    console.log('Query: "I need a place near the water for remote work with wifi"');

    try {
        const result1 = await orchestrateAgents(
            'I need a place near the water for remote work with wifi',
            'test-cot-' + Date.now()
        );

        console.log('\n✅ Intent Parsing Trace:');
        const intentStep = result1.trace?.find(t => t.agent === 'IntentParser');
        if (intentStep) {
            console.log(`   Agent: ${intentStep.agent}`);
            console.log(`   Action: ${intentStep.action}`);
            console.log(`   Status: ${intentStep.status}`);
            console.log(`   Reasoning: ${intentStep.reasoning?.substring(0, 200)}...`);
        }
    } catch (error) {
        console.error('❌ Test 1 Failed:', error);
    }

    console.log('\n' + '='.repeat(60));

    // Test 2: Generative Reranker
    console.log('\n📝 Test 2: Generative Reranking');
    console.log('Query: "romantic getaway with a pool and mountain views"');

    try {
        const result2 = await orchestrateAgents(
            'romantic getaway with a pool and mountain views',
            'test-rerank-' + Date.now()
        );

        console.log('\n✅ Reranking Trace:');
        const rerankStep = result2.trace?.find(t => t.agent === 'RecommendAgent' && t.action.includes('Reranking'));
        if (rerankStep) {
            console.log(`   Agent: ${rerankStep.agent}`);
            console.log(`   Action: ${rerankStep.action}`);
            console.log(`   Status: ${rerankStep.status}`);
            console.log(`   Reasoning: ${rerankStep.reasoning?.substring(0, 200)}...`);
        }

        console.log('\n📊 Top Listing Recommendations:');
        result2.listings.slice(0, 3).forEach((listing: any, idx: number) => {
            console.log(`   ${idx + 1}. ${listing.title}`);
            console.log(`      Score: ${listing.recommendationScore || 'N/A'}`);
            console.log(`      Reason: ${listing.recommendationReasons?.join(', ') || 'N/A'}`);
        });
    } catch (error) {
        console.error('❌ Test 2 Failed:', error);
    }

    console.log('\n' + '='.repeat(60));

    // Test 3: Full Trace Observability
    console.log('\n📝 Test 3: Full Observability Trace');
    console.log('Query: "beach house available next week"');

    try {
        const result3 = await orchestrateAgents(
            'beach house available next week',
            'test-trace-' + Date.now()
        );

        console.log('\n✅ Complete Execution Trace:');
        result3.trace?.forEach((step, idx) => {
            console.log(`\n   Step ${idx + 1}:`);
            console.log(`   Agent: ${step.agent}`);
            console.log(`   Action: ${step.action}`);
            console.log(`   Status: ${step.status}`);
            if (step.reasoning) {
                console.log(`   Reasoning: ${step.reasoning.substring(0, 150)}...`);
            }
        });

        console.log(`\n📈 Total Steps: ${result3.trace?.length || 0}`);
        console.log(`📦 Listings Found: ${result3.listings.length}`);
    } catch (error) {
        console.error('❌ Test 3 Failed:', error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All tests completed!\n');
}

// Run tests
testAgentFlow().catch(console.error);
