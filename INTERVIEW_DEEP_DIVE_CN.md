# Airbnb AI 项目代码深挖与面试准备

这份文档旨在帮助你深入理解项目代码，应对面试中的技术深挖。

## 1. 项目架构总览 (Architecture Overview)

这是一个基于 **Next.js 13 (App Router)** 的全栈应用，结合了 **RAG (检索增强生成)** 和 **Multi-Agent (多智能体)** 架构。

*   **前端**: Next.js, TypeScript, Tailwind CSS, Zustand (状态管理).
*   **后端**: Next.js API Routes (Serverless Functions).
*   **数据库 (双数据库策略)**:
    *   **MongoDB (via Prisma)**: 存储结构化数据（用户、房源、预订）。
    *   **Supabase (pgvector)**: 存储向量数据（房源描述的 Embeddings），用于语义搜索。
*   **AI 模型**: Google Gemini Pro (对话) + Gemini Text Embedding 004 (向量化).

---

## 2. 核心功能深挖 (Core Features Deep Dive)

### 2.1 RAG (检索增强生成) 实现流程

面试官可能会问：“你的 RAG 是怎么实现的？” 或者 “搜索流程是怎样的？”

**代码位置**: `lib/ai/agents.ts` -> `searchAgent`

**流程解释**:
1.  **用户输入**: 用户输入自然语言，例如 "我想找个海边的便宜房子"。
2.  **生成向量 (Embedding)**: 调用 `generateEmbedding(query)` (在 `lib/gemini.ts`) 将用户的问题转化为 768 维的向量。
3.  **向量搜索 (Vector Search)**: 调用 `semanticSearchListings` (在 `lib/supabase.ts`)。
    *   使用 Supabase 的 `rpc('match_listings')` 函数。
    *   计算用户向量与数据库中房源向量的 **余弦相似度 (Cosine Similarity)**。
    *   返回相似度最高的房源 ID。
4.  **数据回查 (Hydration)**: 拿到 ID 后，使用 Prisma 从 MongoDB 查询完整的房源详情 (`prisma.listing.findMany`)。
5.  **结果返回**: 将房源数据交给后续的 Agent 处理。

**亮点**: 使用了双数据库，MongoDB 存数据，Supabase 存向量，发挥各自优势。

### 2.2 Multi-Agent 系统 (多智能体架构)

面试官可能会问：“为什么叫 Multi-Agent？有哪些 Agent？它们怎么协作？”

**代码位置**: `lib/ai/agents.ts`

你设计了三个核心 Agent，由 `orchestrateAgents` 函数进行编排：

#### A. Search Agent (搜索智能体)
*   **职责**: 负责“找”。
*   **逻辑**: 接收 Query -> 生成 Embedding -> 向量搜索 -> 返回房源列表。
*   **代码**: `searchAgent` 函数。

#### B. Recommend Agent (推荐智能体)
*   **职责**: 负责“挑”和“排”。
*   **逻辑**: 接收搜索结果，根据规则打分。
*   **代码**: `recommendAgent` 函数。
*   **打分规则 (Rule-based Scoring)**:
    *   关键词 "便宜" -> 价格 <= 100 -> +30分。
    *   关键词 "海边" -> category == 'Beach' -> +25分。
    *   关键词 "家庭" -> guestCount >= 4 -> +20分。
    *   最后按分数降序排列。

#### C. Booking Agent (预订智能体)
*   **职责**: 负责“查”和“算”。
*   **逻辑**: 检查日期可用性，预测价格。
*   **代码**: `bookingAgent` 函数。
*   **功能**:
    *   `checkDateAvailability`: 检查预订日期是否与已有预订冲突。
    *   `predictPrice`: 动态定价逻辑（见下文）。

#### D. Orchestrator (编排器)
*   **职责**: 总管，管理对话上下文。
*   **代码**: `orchestrateAgents` 函数。
*   **流程**:
    1.  获取对话历史 (`conversation-memory.ts`)。
    2.  分析用户意图 (`intent-parser.ts`)。
    3.  如果是新搜索 -> 调 Search Agent。
    4.  如果是追问 -> 复用上次结果。
    5.  调 Recommend Agent 排序。
    6.  调 Booking Agent 查状态。
    7.  生成最终回复。

### 2.3 动态定价引擎 (Dynamic Pricing Engine)

面试官可能会问：“你的动态定价是怎么算的？”

**代码位置**: `lib/ai/agents.ts` -> `predictPrice`

这是一个基于规则的预测模型，考虑了 5 个因素：
1.  **季节 (Season)**: 夏季 (6-9月) +30%，冬季假期 (12-1月) +20%。
2.  **周末 (Weekend)**: 周五、周六 +15%。
3.  **早鸟 (Advance)**: 提前 60 天以上 -5%。
4.  **临期 (Last Minute)**: 7 天以内 -10%。
5.  **基础价格**: 房源设定的原始价格。

**公式**: `Final Price = Base Price * (1 + Season + Weekend - Advance - LastMinute)`

### 2.4 对话记忆 (Conversation Memory)

面试官可能会问：“AI 怎么知道我指的是哪个房子？”

**代码位置**: `lib/ai/conversation-memory.ts` (虽然没看这个文件，但从 `agents.ts` 可以推断)

*   **实现**: 在内存中（或数据库）维护一个 `ConversationContext` 对象。
*   **存储内容**:
    *   `messages`: 历史聊天记录。
    *   `lastSearchResults`: 上一次搜索到的房源列表（关键！）。
    *   `currentFilters`: 当前的日期、人数等条件。
*   **上下文理解**:
    *   当用户说 "预订它" 或 "哪个最便宜" 时，系统会检查 `lastSearchResults`。
    *   `orchestrateAgents` 中有逻辑专门处理 `isFollowUp` (追问) 情况，直接使用 `context.lastSearchResults` 而不是重新搜索。

---

## 3. 关键代码片段解释 (Code Walkthrough)

### API 入口 (`app/api/ai-chat/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  // 1. 解析请求体
  const { message, conversationId } = await request.json();
  
  // 2. 调用编排器 (核心入口)
  const result = await orchestrateAgents(message, conversationId || 'default');
  
  // 3. 返回结果
  return NextResponse.json({ 
    response: result.message,
    listings: result.listings 
  });
}
```
*   **解释**: 这是一个标准的 Next.js API Route。它非常轻量，主要工作都委托给了 `orchestrateAgents`。

### 意图解析 (`lib/ai/agents.ts`)
```typescript
// 尝试从历史记录中提取房源名称
if (intent.type === 'booking' && !intent.listingTitle) {
  const recentMessages = context.messages.slice(-10);
  // 正则匹配常见的房源名称格式
  const listingMatch = msg.content.match(/(Luxury Villa|...)\s*\d+/i);
  if (listingMatch) {
    intent.listingTitle = listingMatch[0];
  }
}
```
*   **解释**: 这段代码展示了如何处理“上下文缺失”。如果用户只说“预订”，系统会回溯历史消息，用正则表达式去“猜”用户想订哪个房子。这是一个简单的 NLP 实现，但很有效。

---

## 4. 面试常见问题模拟 (Q&A)

**Q: 为什么选择 MongoDB + Supabase 的组合？**
**A:** MongoDB 适合存结构化、文档型数据（房源详情、订单），查询灵活。Supabase (PostgreSQL) 的 pgvector 插件在处理向量搜索方面非常成熟且性能好。虽然 MongoDB 也有向量搜索，但当时为了学习和利用 Supabase 的生态，选择了这种混合架构。

**Q: 如果用户量大了，这个架构怎么扩展？**
**A:**
1.  **数据库**: MongoDB Atlas 可以自动分片扩展。Supabase 也可以独立扩展。
2.  **缓存**: 引入 Redis 缓存热门搜索的 Embedding 结果和房源详情。
3.  **队列**: 引入消息队列 (RabbitMQ/Kafka) 处理预订请求，防止高并发下的超卖。

**Q: 这里的 Multi-Agent 是真的并发执行吗？**
**A:** 在目前的实现中，主要是**顺序执行 (Sequential)** 或 **按需执行**。Search -> Recommend -> Booking。但在逻辑上它们是解耦的。如果未来需要，可以改为 `Promise.all` 并行执行 Search 和其他非依赖任务，或者让 Agent 自主决策调用工具。

**Q: 最大的难点是什么？**
**A:** 最大的难点是 **Context（上下文）的管理**。比如用户先搜了“海边别墅”，然后问“第二个多少钱”。系统需要知道“第二个”指的是上次搜索结果列表中的索引为 1 的那个房源。我通过在 `ConversationContext` 中缓存 `lastSearchResults` 解决了这个问题。
