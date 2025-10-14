// Load environment variables
require('dotenv').config({ path: '.env.local' });

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

// 初始化 Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 对话模型（用于聊天）
export const chatModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

// Embedding 模型（用于向量搜索）
export const embeddingModel = genAI.getGenerativeModel({
  model: 'text-embedding-004',
});

// 生成文本 embedding
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// 批量生成 embeddings
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = await Promise.all(
    texts.map(text => generateEmbedding(text))
  );
  return embeddings;
}

