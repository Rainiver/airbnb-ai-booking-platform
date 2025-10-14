-- ========================================
-- Supabase Vector Database 设置 SQL
-- 用于 Airbnb AI 助手的语义搜索
-- ========================================

-- 1. 启用 vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建 listing_embeddings 表
CREATE TABLE IF NOT EXISTS listing_embeddings (
  id BIGSERIAL PRIMARY KEY,
  listing_id TEXT NOT NULL UNIQUE,
  embedding VECTOR(768),  -- text-embedding-004 生成 768 维向量
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. 创建索引以加速向量搜索
-- IVFFlat 是一种用于快速相似度搜索的索引算法
CREATE INDEX IF NOT EXISTS listing_embeddings_embedding_idx 
ON listing_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. 创建相似度搜索函数
-- 这个函数用于查找与查询向量最相似的房源
CREATE OR REPLACE FUNCTION match_listings (
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  listing_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    listing_id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM listing_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 5. 创建统计函数（可选，用于调试）
CREATE OR REPLACE FUNCTION get_embeddings_stats()
RETURNS TABLE (
  total_count BIGINT,
  avg_similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    COUNT(*) AS total_count,
    0.0 AS avg_similarity
  FROM listing_embeddings;
$$;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ Vector Database 设置完成！';
  RAISE NOTICE '📊 表已创建: listing_embeddings';
  RAISE NOTICE '🔍 索引已创建: listing_embeddings_embedding_idx';
  RAISE NOTICE '⚡ 函数已创建: match_listings()';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：运行 npm run generate-embeddings';
END $$;

