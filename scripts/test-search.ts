// Quick test of search functionality
require('dotenv').config({ path: '.env.local' });

import { orchestrateAgents } from '../lib/ai/agents';

async function testSearch() {
    try {
        console.log('🧪 Testing AI search functionality...\n');

        const query = 'romantic beachfront villa with pool';
        console.log(`Query: "${query}"\n`);

        const result = await orchestrateAgents(query, 'test-session');

        console.log('\n📊 Result:');
        console.log('- Message:', result.message);
        console.log('- Listings count:', result.listings?.length || 0);
        console.log('- Has trace:', !!result.trace);

        if (result.listings && result.listings.length > 0) {
            console.log('\n✅ Top listing:', result.listings[0].title);
            console.log('   Price:', `$${result.listings[0].price}`);
            console.log('   Category:', result.listings[0].category);
        }

        if (result.trace && result.trace.length > 0) {
            console.log('\n📋 Agent Trace:');
            result.trace.forEach(step => {
                console.log(`  - ${step.agent}: ${step.action} (${step.status})`);
                if (step.reasoning) {
                    console.log(`    → ${step.reasoning.substring(0, 100)}...`);
                }
            });
        }

    } catch (error: any) {
        console.error('\n❌ Test failed with error:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testSearch();
