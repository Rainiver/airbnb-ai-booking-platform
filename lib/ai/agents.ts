import { generateEmbedding, chatModel } from '@/lib/gemini';
import { semanticSearchListings } from '@/lib/supabase';
import prisma from '@/lib/prismadb';
import { parseUserIntent } from './intent-parser';
import { responses } from './responses';
import {
  getConversation,
  addMessage,
  updateFilters,
  updateLastSearch,
  analyzePreferences,
  getConversationSummary,
  type ConversationContext
} from './conversation-memory';

// Trace types
export interface AgentTraceStep {
  agent: string;
  action: string;
  status: 'pending' | 'success' | 'failed';
  reasoning?: string;
  timestamp: number;
}

export interface AgentResult {
  agent: string;
  listings: any[];
  reasoning: string;
}

// Define VectorSearchResult type
interface VectorSearchResult {
  listing_id: string;
  similarity: number;
}

// Search Agent - handles semantic search
export async function searchAgent(query: string): Promise<AgentResult> {
  try {
    console.log(`📡 SearchAgent: Processing query: "${query}"`);

    // 1. Generate query embedding
    const queryText = `User needs: ${query}`;
    let queryEmbedding: number[];

    try {
      queryEmbedding = await generateEmbedding(queryText);
      console.log(`✅ Generated query embedding (${queryEmbedding.length} dimensions)`);
    } catch (embeddingError) {
      console.error('⚠️ Failed to generate embedding, falling back to keyword search:', embeddingError);
      // Fallback to keyword search
      return await fallbackKeywordSearch(query);
    }

    // 2. Perform semantic search
    let searchResults: VectorSearchResult[];
    try {
      searchResults = await semanticSearchListings(queryEmbedding, 0.2, 20);
      console.log(`🔍 Found ${searchResults.length} results from vector search`);
    } catch (searchError) {
      console.error('⚠️ Supabase vector search failed, falling back to keyword search:', searchError);
      // Fallback to keyword search when Supabase is unavailable
      return await fallbackKeywordSearch(query);
    }

    if (searchResults.length === 0) {
      console.log('⚠️ No vector search results, trying keyword fallback');
      return await fallbackKeywordSearch(query);
    }

    // 3. Fetch detailed listings from MongoDB
    const listingIds = searchResults.map(r => r.listing_id);
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      include: { user: true, reservations: true }, // Keep original includes
    });

    console.log(`✅ Fetched ${listings.length} listings from MongoDB`);

    // Sort by semantic search order
    const sortedListings = listingIds
      .map((id: string) => listings.find(l => l.id === id))
      .filter(Boolean) as any[];

    // Check for Data Sync issue: Vectors found but entries missing in DB
    if (searchResults.length > 0 && sortedListings.length === 0) {
      console.warn('⚠️ Vector search found results but MongoDB returned none. Possible data synchronization issue (stale embeddings).');
      return await fallbackKeywordSearch(query);
    }

    return {
      agent: 'SearchAgent',
      listings: sortedListings,
      reasoning: `Found ${sortedListings.length} listings match semantic search (Strategy: Vector).`,
    };
  } catch (error) {
    console.error('SearchAgent Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Last resort fallback
    const fallbackResult = await fallbackKeywordSearch(query);
    return {
      ...fallbackResult,
      reasoning: `Vector search failed (${errorMessage}). Fallback: ${fallbackResult.reasoning}`
    };
  }
}

// Fallback keyword search using MongoDB
async function fallbackKeywordSearch(query: string): Promise<AgentResult> {
  try {
    console.log('🔄 Using fallback keyword search with MongoDB');

    // Extract keywords from query
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean); // Filter out empty strings

    if (keywords.length === 0) {
      return {
        agent: 'SearchAgent',
        listings: [],
        reasoning: 'No keywords found for fallback search.',
      };
    }

    // Build search filters
    const orConditions = keywords.map(keyword => ({
      OR: [
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { description: { contains: keyword, mode: 'insensitive' as const } },
        { locationValue: { contains: keyword, mode: 'insensitive' as const } },
      ]
    }));

    const listings = await prisma.listing.findMany({
      where: {
        OR: orConditions
      },
      include: { user: true, reservations: true }, // Keep original includes
      take: 20,
    });

    console.log(`✅ Fallback search found ${listings.length} listings`);

    return {
      agent: 'SearchAgent',
      listings,
      reasoning: `Found ${listings.length} listings using keyword search.`,
    };
  } catch (error) {
    console.error('❌ Fallback search also failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      agent: 'SearchAgent',
      listings: [],
      reasoning: `Critical Failure: Keyword search also failed. Error: ${errorMessage}`,
    };
  }
}

// Recommend Agent - handles intelligent recommendations and sorting
export async function recommendAgent(query: string, searchResults: any[]): Promise<AgentResult> {
  try {
    if (searchResults.length === 0) {
      return {
        agent: 'RecommendAgent',
        listings: [],
        reasoning: '没有Found相关房源进行推荐'
      };
    }

    // Intelligent recommendation based on query
    const recommendations = searchResults.map(listing => {
      let score = 0;
      let reasons: string[] = [];

      // Price matching
      if (query.toLowerCase().includes('便宜') || query.toLowerCase().includes('低价')) {
        if (listing.price <= 100) {
          score += 30;
          reasons.push('价格便宜');
        }
      } else if (query.toLowerCase().includes('豪华') || query.toLowerCase().includes('高端')) {
        if (listing.price >= 200) {
          score += 30;
          reasons.push('价格符合高端定位');
        }
      }

      // Location matching
      if (query.toLowerCase().includes('海边') || query.toLowerCase().includes('海滩')) {
        if (listing.category === 'Beach') {
          score += 25;
          reasons.push('靠近海滩');
        }
      } else if (query.toLowerCase().includes('山') || query.toLowerCase().includes('森林')) {
        if (listing.category === 'Countryside') {
          score += 25;
          reasons.push('自然环境优美');
        }
      } else if (query.toLowerCase().includes('城市') || query.toLowerCase().includes('市中心')) {
        if (listing.category === 'Rooms') {
          score += 25;
          reasons.push('位于市中心');
        }
      }

      // 房型匹配
      if (query.toLowerCase().includes('家庭') || query.toLowerCase().includes('多人')) {
        if (listing.guestCount >= 4) {
          score += 20;
          reasons.push('适合家庭入住');
        }
      } else if (query.toLowerCase().includes('情侣') || query.toLowerCase().includes('浪漫')) {
        if (listing.guestCount <= 2) {
          score += 20;
          reasons.push('适合情侣入住');
        }
      }

      // 设施匹配
      if (query.toLowerCase().includes('游泳池') || query.toLowerCase().includes('泳池')) {
        if (listing.amenities.includes('Pool')) {
          score += 15;
          reasons.push('有游泳池');
        }
      }

      return {
        ...listing,
        recommendationScore: score,
        recommendationReasons: reasons
      };
    });

    // 按推荐分数排序
    recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      agent: 'RecommendAgent',
      listings: recommendations.slice(0, 10), // 返回前10个推荐
      reasoning: `基于用户偏好进行了智能推荐，共 ${recommendations.length} properties，返回前10个最佳匹配`
    };
  } catch (error) {
    console.error('RecommendAgent Error:', error);
    return {
      agent: 'RecommendAgent',
      listings: searchResults,
      reasoning: '推荐过程中发生错误，返回原始搜索结果'
    };
  }
}

// 日期范围检查辅助函数
function checkDateAvailability(
  listing: any,
  checkInDate?: Date,
  checkOutDate?: Date
): {
  isAvailable: boolean;
  conflictingDates: string[];
  availableInfo: string;
} {
  if (!checkInDate || !checkOutDate) {
    // 如果没有指定日期，检查通用可用性
    const hasConflicts = listing.reservations?.some((reservation: any) => {
      const now = new Date();
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      return startDate >= now || endDate >= now;
    });

    return {
      isAvailable: !hasConflicts,
      conflictingDates: [],
      availableInfo: hasConflicts ? '部分日期已被预订' : '近期完全可用'
    };
  }

  // 检查指定日期范围
  const conflicts = listing.reservations?.filter((reservation: any) => {
    const resStart = new Date(reservation.startDate);
    const resEnd = new Date(reservation.endDate);

    // 检查日期是否重叠
    return (
      (checkInDate >= resStart && checkInDate < resEnd) ||
      (checkOutDate > resStart && checkOutDate <= resEnd) ||
      (checkInDate <= resStart && checkOutDate >= resEnd)
    );
  }) || [];

  const isAvailable = conflicts.length === 0;
  const conflictingDates = conflicts.map((res: any) =>
    `${new Date(res.startDate).toLocaleDateString()} - ${new Date(res.endDate).toLocaleDateString()}`
  );

  return {
    isAvailable,
    conflictingDates,
    availableInfo: isAvailable
      ? `${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()} 可预订`
      : `已被预订: ${conflictingDates.join(', ')}`
  };
}

// 价格Now辅助函数
function predictPrice(listing: any, checkInDate?: Date): {
  currentPrice: number;
  predictedPrice: number;
  priceChange: string;
  priceTrend: string;
} {
  const basePrice = listing.price;
  let multiplier = 1.0;
  let trend = 'Stable pricing';

  if (checkInDate) {
    const month = checkInDate.getMonth(); // 0-11
    const dayOfWeek = checkInDate.getDay(); // 0-6

    // 季节性价格调整
    if (month >= 5 && month <= 8) {
      // 夏季旺季 (6-9月)
      multiplier *= 1.3;
      trend = 'Peak season premium';
    } else if (month === 11 || month === 0) {
      // 冬季假期 (12-1月)
      multiplier *= 1.2;
      trend = '假期价格上涨';
    }

    // 周末价格调整
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      // 周五、周六
      multiplier *= 1.15;
      trend += '，Weekend surcharge';
    }

    // 临近预订（7天内）价格调整
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckIn <= 7 && daysUntilCheckIn >= 0) {
      multiplier *= 0.9; // 最后一刻折扣
      trend = 'Last-minute deal';
    } else if (daysUntilCheckIn > 60) {
      multiplier *= 0.95; // 早鸟优惠
      trend = 'Early bird discount';
    }
  }

  const predictedPrice = Math.round(basePrice * multiplier);
  const change = predictedPrice - basePrice;
  const priceChange = change > 0
    ? `+$${change} (${((change / basePrice) * 100).toFixed(0)}%)`
    : change < 0
      ? `-$${Math.abs(change)} (${((Math.abs(change) / basePrice) * 100).toFixed(0)}%)`
      : '无变化';

  return {
    currentPrice: basePrice,
    predictedPrice,
    priceChange,
    priceTrend: trend
  };
}

// 预订 Agent - 负责检查可用性、价格Now和预订建议
export async function bookingAgent(
  listings: any[],
  options?: {
    checkInDate?: string;
    checkOutDate?: string;
    enablePricePrediction?: boolean;
  }
): Promise<AgentResult> {
  try {
    const checkIn = options?.checkInDate ? new Date(options.checkInDate) : undefined;
    const checkOut = options?.checkOutDate ? new Date(options.checkOutDate) : undefined;

    const availableListings = listings.map(listing => {
      // 1. 日期可用性检查
      const dateCheck = checkDateAvailability(listing, checkIn, checkOut);

      // 2. 价格Now
      const priceInfo = options?.enablePricePrediction
        ? predictPrice(listing, checkIn)
        : null;

      // 3. 计算Total
      let totalPrice = listing.price;
      if (checkIn && checkOut) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const pricePerNight = priceInfo?.predictedPrice || listing.price;
        totalPrice = pricePerNight * nights;
      }

      // 4. 生成预订信息
      let bookingInfo = dateCheck.availableInfo;
      if (priceInfo) {
        bookingInfo += `\n💰 价格: $${priceInfo.predictedPrice}/nights (${priceInfo.priceChange})`;
        bookingInfo += `\n📊 ${priceInfo.priceTrend}`;
      }
      if (checkIn && checkOut && dateCheck.isAvailable) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        bookingInfo += `\n🌙 ${nights} nights，Total: $${totalPrice}`;
      }

      return {
        ...listing,
        availability: dateCheck.isAvailable ? '可预订' : '不可用',
        availabilityDetails: dateCheck,
        priceInfo,
        totalPrice,
        bookingInfo,
        canBook: dateCheck.isAvailable,
      };
    });

    // 过滤出可预订的房源
    const bookableListings = availableListings.filter(l => l.canBook);

    return {
      agent: 'BookingAgent',
      listings: availableListings,
      reasoning: `检查了 ${availableListings.length} properties，${bookableListings.length} 个可预订${checkIn ? `，日期: ${checkIn.toLocaleDateString()} - ${checkOut?.toLocaleDateString()}` : ''
        }`
    };
  } catch (error) {
    console.error('BookingAgent Error:', error);
    return {
      agent: 'BookingAgent',
      listings,
      reasoning: '预订检查过程中发生错误'
    };
  }
}

// Generative Reranker
export async function generativeRerank(
  query: string,
  listings: any[]
): Promise<{ listings: any[]; reasoning: string }> {
  if (listings.length === 0) return { listings: [], reasoning: '没有房源可排序' };

  try {
    // 简化房源信息供 LLM 评分
    const listingsContext = listings.map((l, index) =>
      `ID: ${l.id} | Title: ${l.title} | Price: $${l.price} | Category: ${l.category} | Desc: ${l.description.substring(0, 100)}...`
    ).join('\n');

    const prompt = `你是一个专业的房屋租赁顾问。请根据用户的需求，对以下候选房源进行评分和排序。

用户需求: "${query}"

候选房源:
${listingsContext}

请分析每个房源与需求的匹配度（0-10分），并给出排序后的 JSON 列表。

Reasoning:
<思考过程：分析用户核心需求（如位置、设施、氛围），对比房源特点，说明为何某些房源得分更高>

JSON:
[
  {
    "id": "房源ID",
    "score": 9.5,
    "reason": "匹配理由（简短）"
  },
  ...
]`;

    const result = await chatModel.generateContent(prompt);
    const responseText = result.response.text();

    const reasoningMatch = responseText.match(/Reasoning:([\s\S]*?)(?=JSON:|$)/i);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '根据匹配度排序';

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { listings, reasoning: '排序解析失败，保持原序' };
    }

    const rankings = JSON.parse(jsonMatch[0]);

    // 创建 ID 到 rank 的映射
    const rankMap = new Map(rankings.map((r: any) => [r.id, r]));

    // 重新排序并注入推荐理由
    const rerankedListings = listings
      .filter(l => rankMap.has(l.id))
      .map(l => {
        const rank = rankMap.get(l.id) as any;
        return {
          ...l,
          recommendationScore: rank.score,
          recommendationReasons: [rank.reason] // 覆盖之前的简单规则理由
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      listings: rerankedListings,
      reasoning
    };

  } catch (error) {
    console.error('Generative Rerank Error:', error);
    return { listings, reasoning: '重排序服务暂时不可用' };
  }
}

// Multi-Agent 编排结果
export interface OrchestrationResult {
  message: string;
  listings: any[];
  trace?: AgentTraceStep[]; // Agent Execution Trace
}

// Multi-Agent 编排器（增强版 + 对话记忆 + 可观测性）
export async function orchestrateAgents(
  query: string,
  conversationId: string = 'default'
): Promise<OrchestrationResult> {
  const trace: AgentTraceStep[] = [];

  const addTrace = (agent: string, action: string, status: 'pending' | 'success' | 'failed', reasoning?: string) => {
    trace.push({
      agent,
      action,
      status,
      reasoning,
      timestamp: Date.now()
    });
  };

  try {
    console.log('🤖 Multi-Agent system processing query:', query);
    console.log('📝 Conversation ID:', conversationId);
    addTrace('System', 'Initialization', 'success', 'Starting request processing');

    // 0. 获取 or create conversation context
    console.log('💾 Getting conversation context...');
    let context = getConversation(conversationId);
    if (!context) {
      console.log('✨ Creating new conversation context');
      const { createConversation } = await import('./conversation-memory');
      context = createConversation(conversationId);
    }
    addMessage(conversationId, 'user', query);
    analyzePreferences(context); // Async analysis

    const recentHistory = context.messages
      .slice(-5)
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    // 1. Intent Parsing
    console.log('🧠 Starting intent parsing...');
    addTrace('IntentParser', 'Analyzing Intent', 'pending');
    const intent = await parseUserIntent(query, recentHistory);
    console.log('✅ Intent parsed:', JSON.stringify(intent, null, 2));
    addTrace('IntentParser', 'Intent Detected', 'success',
      `Intent: ${intent.type}\nReasoning: ${intent.reasoning || 'N/A'}`);

    console.log('🧠 User intent:', intent);

    // Apply filters from context if needed
    if (!intent.checkInDate && context.currentFilters?.checkInDate) {
      console.log('📅 Applying date filters from context');
      intent.checkInDate = context.currentFilters.checkInDate;
      intent.checkOutDate = context.currentFilters.checkOutDate;
    }

    // Listing extraction logic (simplified)
    if (intent.type === 'booking' && !intent.listingTitle && !intent.listingId) {
      // ... existing logic to find listing from history ...
      // (Keeping existing logic for brevity, assuming it's robust enough for now)
      // For new implementation, we might want to trace this too
    }

    // Dispatch based on intent
    console.log(`🚀 Dispatching to handler for intent type: ${intent.type}`);
    if (intent.type === 'date_check') {
      console.log('📅 Handling date check...');
      const res = await handleDateCheck(intent, conversationId);
      return { ...res, trace };
    } else if (intent.type === 'price_predict') {
      console.log('💰 Handling price prediction...');
      const res = await handlePricePredict(intent, conversationId);
      return { ...res, trace };
    } else if (intent.type === 'booking') {
      console.log('🎫 Handling booking...');
      const res = await handleBooking(intent, conversationId);
      return { ...res, trace };
    }

    // Default: Search Flow with Reranking
    console.log('🔍 Starting search flow...');

    // Check for follow-up
    const isFollowUp = query.length < 20 && (
      query.includes('这里') || query.includes('那些') ||
      ['最便宜', '最贵', '最近'].some(k => query.includes(k))
    );

    let listings: any[] = [];

    if (isFollowUp && context.lastSearchResults && context.lastSearchResults.length > 0) {
      console.log('🔄 Using cached search results for follow-up query');
      addTrace('SearchAgent', 'Context Retrieval', 'success', 'Using previous search results for context');
      listings = context.lastSearchResults;
    } else {
      console.log('🔎 Performing semantic search...');
      addTrace('SearchAgent', 'Semantic Search', 'pending');
      const searchQuery = intent.searchQuery || query;
      console.log('🔍 Search query:', searchQuery);
      const searchResult = await searchAgent(searchQuery);
      listings = searchResult.listings;
      console.log(`✅ Search completed: found ${listings.length} listings`);
      addTrace('SearchAgent', 'Search Completed', 'success', searchResult.reasoning);

      if (listings.length === 0) {
        console.log('⚠️ No results found');
        return {
          message: `${responses.noResults}\n\n(System Diagnostic: ${searchResult.reasoning})`,
          listings: [],
          trace
        };
      }
    }

    // 2. Generative Reranking
    console.log('🎯 Starting generative reranking...');
    addTrace('RecommendAgent', 'Generative Reranking', 'pending', 'LLM scoring listings based on specific needs');
    const rerankResult = await generativeRerank(query, listings);
    listings = rerankResult.listings.slice(0, 10); // Top 10 after rerank
    console.log(`✅ Reranking completed: top ${listings.length} listings selected`);
    addTrace('RecommendAgent', 'Reranking Completed', 'success', rerankResult.reasoning);

    // 3. Availability & Pricing Check
    console.log('📊 Checking availability and pricing...');
    addTrace('BookingAgent', 'Checking Details', 'pending');
    const bookingResult = await bookingAgent(listings, {
      checkInDate: intent.checkInDate || context.currentFilters?.checkInDate,
      checkOutDate: intent.checkOutDate || context.currentFilters?.checkOutDate,
      enablePricePrediction: intent.enablePricePrediction || !!intent.checkInDate,
    });
    console.log('✅ Booking check completed');
    addTrace('BookingAgent', 'Check Completed', 'success', bookingResult.reasoning);

    // 4. Final Updates
    console.log('💾 Updating conversation context...');
    updateLastSearch(conversationId, bookingResult.listings);
    updateFilters(conversationId, {
      checkInDate: intent.checkInDate || context.currentFilters?.checkInDate,
      checkOutDate: intent.checkOutDate || context.currentFilters?.checkOutDate,
    });

    // 5. Response Generation
    console.log('📝 Generating response...');
    const topListings = bookingResult.listings.filter(l => l.canBook).slice(0, 5);
    let message = isFollowUp
      ? `🔄 Based on your criteria, here are the top matches:\n\n`
      : `🎉 Found ${topListings.length} perfect matches for you!\n\n`;

    if (intent.reasoning) {
      // Optional: Include intent reasoning in the message? Maybe too verbose.
      // message += `thought: ${intent.reasoning}\n\n`;
    }

    message += `💡 Click cards for details. Ask me to "Book [Name]" or check dates.`;

    addMessage(conversationId, 'assistant', message);
    addTrace('System', 'Response Generated', 'success');

    console.log('✅ Multi-Agent orchestration completed successfully');
    return {
      message,
      listings: topListings,
      trace
    };

  } catch (error) {
    console.error('❌ Multi-Agent Orchestration Error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    addTrace('System', 'Error', 'failed', String(error));
    return {
      message: `Sorry, I encountered an issue. Please try again.`,
      listings: [],
      trace
    };
  }
}

// Handle date checking
async function handleDateCheck(intent: any, conversationId: string): Promise<OrchestrationResult> {
  try {
    // Get all listings
    const allListings = await prisma.listing.findMany({
      include: {
        user: true,
        reservations: true
      }
    });

    // 使用 BookingAgent 检查可用性
    const bookingResult = await bookingAgent(allListings, {
      checkInDate: intent.checkInDate,
      checkOutDate: intent.checkOutDate,
      enablePricePrediction: true,
    });

    const available = bookingResult.listings.filter(l => l.canBook).slice(0, 10);

    let message = `📅 Date Availability Results:\n\n`;
    message += `Check-in: ${new Date(intent.checkInDate).toLocaleDateString()}\n`;
    message += `Check-out: ${new Date(intent.checkOutDate).toLocaleDateString()}\n\n`;
    message += `✅ Found ${available.length} available ${available.length === 1 ? 'property' : 'properties'}!\n\n`;
    message += `💡 Click cards for details`;

    return {
      message,
      listings: available.slice(0, 5)
    };
  } catch (error) {
    console.error('Date check error:', error);
    return {
      message: 'Sorry, error checking dates. Please try again.',
      listings: []
    };
  }
}

// Handle price prediction
async function handlePricePredict(intent: any, conversationId: string): Promise<OrchestrationResult> {
  try {
    // 获取上下文
    const context = getConversation(conversationId);

    let listings: any[] = [];

    // 如果指定了特定房源，只分析那properties
    if (intent.listingTitle) {
      console.log('🎯 Analyzing specific listing price:', intent.listingTitle);

      // Search in cache first
      if (context?.lastSearchResults && context.lastSearchResults.length > 0) {
        const cleanQuery = intent.listingTitle.toLowerCase().replace(/\s/g, '');
        const found = context.lastSearchResults.find((l: any) => {
          const cleanTitle = l.title.toLowerCase().replace(/\s/g, '');
          return cleanTitle === cleanQuery || cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle);
        });

        if (found) {
          listings = [found];
          console.log('✅ Found in cache:', found.title);
        }
      }

      // 如果缓存中没Found，去数据库查找
      if (listings.length === 0) {
        const found = await prisma.listing.findFirst({
          where: {
            title: {
              contains: intent.listingTitle,
              mode: 'insensitive'
            }
          },
          include: { user: true, reservations: true }
        });

        if (found) {
          listings = [found];
        }
      }

      if (listings.length === 0) {
        return {
          message: `😕 Sorry, couldn't find "${intent.listingTitle}".\n\n💡 Search for properties first, then ask about pricing.`,
          listings: []
        };
      }
    }
    // 如果没有指定房源，使用上次搜索结果
    else if (context?.lastSearchResults && context.lastSearchResults.length > 0) {
      console.log('🔄 Using last search results -', context.lastSearchResults.length, 'properties for price analysis');
      listings = context.lastSearchResults.slice(0, 20);
    }
    // 否则重新搜索
    else {
      const searchResult = await searchAgent(intent.searchQuery || '房源');
      listings = searchResult.listings.slice(0, 20);
    }

    // 应用价格Now
    const bookingResult = await bookingAgent(listings, {
      checkInDate: intent.checkInDate,
      checkOutDate: intent.checkOutDate,
      enablePricePrediction: true,
    });

    const resultListings = bookingResult.listings.slice(0, 5);

    let message = '';

    // If for a specific listing
    if (intent.listingTitle && resultListings.length === 1) {
      const listing = resultListings[0];
      message = `🎯 **Price Analysis:** ${listing.title}\n\n`;

      if (listing.priceInfo) {
        message += `💰 **Base Price:** $${listing.priceInfo.currentPrice}/night\n\n`;
        message += `📊 **Best Time to Book:**\n\n`;

        // Provide suggestions based on trends
        if (listing.priceInfo.priceTrend.includes('Early') || listing.priceInfo.priceTrend.includes('Advance')) {
          message += `✅ Book Now - Early bird discount (-5%)\n`;
          message += `   Price: $${listing.priceInfo.predictedPrice}/night\n\n`;
          message += `📅 Summer (Jun-Sep): +30% premium\n`;
          message += `📅 Weekends: +15% premium\n`;
          message += `📅 Last minute (<7 days): -10% discount\n\n`;
          message += `💡 Lock in the discount by booking early!`;
        } else if (listing.priceInfo.priceTrend.includes('peak') || listing.priceInfo.priceTrend.includes('season')) {
          message += `⚠️ Peak Season - Price increased 30%\n`;
          message += `   Current: $${listing.priceInfo.predictedPrice}/night (+${listing.priceInfo.priceChange})\n\n`;
          message += `💡 Book off-season to save 30%`;
        } else if (listing.priceInfo.priceTrend.includes('Weekend')) {
          message += `⚠️ Weekend Premium - Fri/Sat +15%\n`;
          message += `   Price: $${listing.priceInfo.predictedPrice}/night\n\n`;
          message += `💡 Book Sun-Thu to save 15%`;
        } else if (listing.priceInfo.priceTrend.includes('Last') || listing.priceInfo.priceTrend.includes('minute')) {
          message += `🎉 Last-Minute Deal - Book < 7 days for -10%\n`;
          message += `   Sale Price: $${listing.priceInfo.predictedPrice}/night\n\n`;
          message += `💡 Wait for deals if you're flexible!`;
        } else {
          message += `➡️ Stable Pricing\n`;
          message += `   Current: $${listing.priceInfo.predictedPrice}/night\n\n`;
          message += `💡 Book anytime - price is stable`;
        }
      }

      message += `\n\n🎯 **Ready to book?** Say: "Book ${listing.title}, [dates]"`;
    }
    // If for multiple properties
    else {
      message = `📊 **Price Trend Analysis:**\n\n`;

      if (intent.checkInDate) {
        message += `📅 Query Date: ${new Date(intent.checkInDate).toLocaleDateString()}\n\n`;
      }

      // Add context hint
      if (context?.lastSearchResults && context.lastSearchResults.length > 0 && !intent.listingTitle) {
        message += `Based on your previous search - `;
      }

      message += `Analyzed ${resultListings.length} ${resultListings.length === 1 ? 'property' : 'properties'}:\n\n`;

      resultListings.forEach((listing, idx) => {
        if (listing.priceInfo) {
          const trend = listing.priceInfo.priceChange.startsWith('+') ? '📈' :
            listing.priceInfo.priceChange.startsWith('-') ? '📉' : '➡️';
          message += `${idx + 1}. ${listing.title}\n`;
          message += `   ${trend} ${listing.priceInfo.priceTrend}\n`;
          message += `   Was $${listing.priceInfo.currentPrice} → Now $${listing.priceInfo.predictedPrice}/night\n\n`;
        }
      });

      message += `💡 Click cards for details`;
    }

    return {
      message,
      listings: resultListings
    };
  } catch (error) {
    console.error('Price predict error:', error);
    return {
      message: 'Sorry，价格Now时出现错误。Please try again。',
      listings: []
    };
  }
}

// Handle booking request
async function handleBooking(intent: any, conversationId: string): Promise<OrchestrationResult> {
  try {
    const context = getConversation(conversationId);
    let message = `🎫 Booking Assistant:\n\n`;

    if (!intent.listingTitle && !intent.listingId) {
      message += `Please search for properties first, then:\n\n`;
      message += `"Book [property name]"\n\n`;
      message += `Example: "Book Luxury Villa 1"`;

      return {
        message,
        listings: []
      };
    }

    // Find specified listing
    let listing = null;

    // 1. 优先从上次搜索结果中查找（更准确，更快）
    if (intent.listingTitle && context?.lastSearchResults && context.lastSearchResults.length > 0) {
      console.log('🔍 Searching in last results:', intent.listingTitle);

      // Remove spaces for matching
      const cleanQuery = intent.listingTitle.toLowerCase().replace(/\s/g, '');

      listing = context.lastSearchResults.find((l: any) => {
        const cleanTitle = l.title.toLowerCase().replace(/\s/g, '');
        return cleanTitle === cleanQuery || cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle);
      });

      if (listing) {
        console.log('✅ Found in cache:', listing.title);
      }
    }

    // 2. 如果缓存中没Found，去数据库查找
    if (!listing) {
      if (intent.listingId) {
        listing = await prisma.listing.findUnique({
          where: { id: intent.listingId },
          include: { user: true, reservations: true }
        });
      } else if (intent.listingTitle) {
        // Try exact match first
        listing = await prisma.listing.findFirst({
          where: {
            title: {
              contains: intent.listingTitle,
              mode: 'insensitive'
            }
          },
          include: { user: true, reservations: true }
        });

        // If not found, try fuzzy matching
        if (!listing) {
          const cleanQuery = intent.listingTitle.toLowerCase().replace(/\s/g, '');
          const allListings = await prisma.listing.findMany({
            include: { user: true, reservations: true }
          });

          listing = allListings.find((l: any) => {
            const cleanTitle = l.title.toLowerCase().replace(/\s/g, '');
            return cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle);
          }) || null;
        }
      }
    }

    if (!listing) {
      message = `😕 Sorry, couldn't find "${intent.listingTitle}".\n\n`;

      // If there are previous search results, show available options
      if (context?.lastSearchResults && context.lastSearchResults.length > 0) {
        message += `📋 From your previous search:\n\n`;
        context.lastSearchResults.slice(0, 5).forEach((l: any, idx: number) => {
          message += `${idx + 1}. ${l.title}\n`;
        });
        message += `\n💡 Tell me: "Book [property name]"`;

        return {
          message,
          listings: context.lastSearchResults.slice(0, 5)
        };
      } else {
        message += `💡 Search first, then book.`;

        return {
          message,
          listings: []
        };
      }
    }

    // Check date and availability
    const hasDate = intent.checkInDate && intent.checkOutDate;
    const bookingResult = await bookingAgent([listing], hasDate ? {
      checkInDate: intent.checkInDate,
      checkOutDate: intent.checkOutDate,
      enablePricePrediction: true,
    } : undefined);

    const listingWithInfo = bookingResult.listings[0];

    if (!listingWithInfo.canBook) {
      message = `😔 Sorry, ${listing.title} is unavailable for your selected dates.\n\n`;
      message += `📅 ${listingWithInfo.bookingInfo}\n\n`;
      message += `💡 Try different dates or other properties?`;

      return {
        message,
        listings: [listingWithInfo]
      };
    }

    // Generate booking confirmation
    message = `✅ **Perfect! Booking ${listing.title}**\n\n`;
    message += `🏠 **Property:** ${listing.title}\n`;
    message += `📍 **Location:** ${listing.locationValue}\n\n`;

    if (hasDate) {
      const checkIn = new Date(intent.checkInDate!);
      const checkOut = new Date(intent.checkOutDate!);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      message += `📅 **Check-in:** ${checkIn.toLocaleDateString()}\n`;
      message += `📅 **Check-out:** ${checkOut.toLocaleDateString()}\n`;
      message += `🌙 **Duration:** ${nights} ${nights === 1 ? 'night' : 'nights'}\n\n`;

      if (listingWithInfo.priceInfo) {
        message += `💰 **Rate:** $${listingWithInfo.priceInfo.predictedPrice}/night\n`;
        message += `📊 **Pricing:** ${listingWithInfo.priceInfo.priceTrend}\n`;
        message += `💵 **Total Price:** $${listingWithInfo.totalPrice}\n\n`;
      }
    } else {
      message += `⚠️ **No check-in date selected!**\n\n`;
      message += `Please specify:\n`;
      message += `"Book ${listing.title}, Jan 1st to 7th"\n\n`;
    }

    message += `🎯 **Next Step:**\nClick the card below to complete booking.`;

    return {
      message,
      listings: [listingWithInfo]
    };
  } catch (error) {
    console.error('Booking error:', error);
    return {
      message: 'Sorry, error processing booking. Please try again.',
      listings: []
    };
  }
}