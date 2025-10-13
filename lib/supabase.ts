// 加载环境变量
require('dotenv').config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// 初始化 Supabase 客户端
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Vector 搜索类型定义
export interface VectorSearchResult {
  listing_id: string;
  content: string;
  metadata: {
    title: string;
    category: string;
    price: number;
    locationValue: string;
  };
  similarity: number;
}

// 存储 listing embedding
export async function storeListingEmbedding(
  listingId: string,
  embedding: number[],
  content: string,
  metadata: any
) {
  const { data, error } = await supabase
    .from('listing_embeddings')
    .upsert({
      listing_id: listingId,
      embedding,
      content,
      metadata,
    }, {
      onConflict: 'listing_id'
    });

  if (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }

  return data;
}

// 语义搜索房源
export async function semanticSearchListings(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 10
): Promise<VectorSearchResult[]> {
  const { data, error } = await supabase.rpc('match_listings', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }

  return data || [];
}

// 检查 embeddings 是否已生成
export async function checkEmbeddingsExist(): Promise<boolean> {
  const { count, error } = await supabase
    .from('listing_embeddings')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error checking embeddings:', error);
    return false;
  }

  return (count || 0) > 0;
}

