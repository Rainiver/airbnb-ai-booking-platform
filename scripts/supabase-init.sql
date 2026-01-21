-- 启用 pgvector 扩展用于向量搜索
create extension if not exists vector;

-- 创建 listing_embeddings 表
-- 存储每个房源的768维向量表示
create table listing_embeddings (
  id bigserial primary key,
  listing_id text unique not null,
  embedding vector(768),  -- Gemini text-embedding-004 生成768维向量
  content text,            -- 原始文本内容
  metadata jsonb,          -- 房源元数据（标题、类别、价格等）
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 创建向量索引以加速相似度搜索
-- ivfflat 是一种倒排文件索引，适合大规模向量搜索
create index on listing_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 创建语义搜索函数
-- 输入查询向量，返回最相似的listings
create or replace function match_listings(
  query_embedding vector(768),
query_embedding vector(768),
  match_threshold float default 0.2,  -- 相似度阈值
  match_count int default 10          -- 返回结果数量
)
returns table (
  listing_id text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    listing_embeddings.listing_id,
    listing_embeddings.content,
    listing_embeddings.metadata,
    1 - (listing_embeddings.embedding <=> query_embedding) as similarity
  from listing_embeddings
  where 1 - (listing_embeddings.embedding <=> query_embedding) > match_threshold
  order by listing_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- 授予权限（匿名访问）
grant usage on schema public to anon, authenticated;
grant all on listing_embeddings to anon, authenticated;
grant execute on function match_listings to anon, authenticated;
