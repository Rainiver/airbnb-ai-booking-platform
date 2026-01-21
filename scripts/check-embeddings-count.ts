// Load environment variables
require('dotenv').config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function checkEmbeddingsCount() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials in environment');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { count, error } = await supabase
            .from('listing_embeddings')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error querying Supabase:', error);
            return;
        }

        console.log(`📊 Embeddings in Supabase: ${count ?? 0} / 1117`);

        if (count && count > 0) {
            const percentage = ((count / 1117) * 100).toFixed(1);
            console.log(`📈 Progress: ${percentage}%`);

            if (count < 1117) {
                console.log(`⏳ Remaining: ${1117 - count} embeddings`);
            } else {
                console.log(`✅ All embeddings generated!`);
            }
        } else {
            console.log(`⚠️  No embeddings found yet. Did the generation process start?`);
        }
    } catch (error) {
        console.error('❌ Failed to check embeddings:', error);
    }
}

checkEmbeddingsCount();
