import { generateEmbedding } from '@/lib/gemini';
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

// Agent 类型定义
export interface AgentResult {
  agent: string;
  listings: any[];
  reasoning: string;
}

// 搜索 Agent - 负责语义搜索
export async function searchAgent(query: string): Promise<AgentResult> {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query);
    
    // 语义搜索
    const searchResults = await semanticSearchListings(
      queryEmbedding,
      0.2, // 相似度阈值（降低以匹配实际数据）
      20   // 返回数量
    );

    // 获取完整的房源信息
    const listingIds = searchResults.map(result => result.listing_id);
    const listings = await prisma.listing.findMany({
      where: {
        id: { in: listingIds }
      },
      include: {
        user: true,
        reservations: true
      }
    });

    return {
      agent: 'SearchAgent',
      listings,
      reasoning: `基于语义搜索Found了 ${listings.length} 个相关房源，相似度阈值 0.2`
    };
  } catch (error) {
    console.error('SearchAgent Error:', error);
    return {
      agent: 'SearchAgent',
      listings: [],
      reasoning: '搜索过程中发生错误'
    };
  }
}

// 推荐 Agent - 负责智能推荐和排序
export async function recommendAgent(query: string, searchResults: any[]): Promise<AgentResult> {
  try {
    if (searchResults.length === 0) {
      return {
        agent: 'RecommendAgent',
        listings: [],
        reasoning: '没有Found相关房源进行推荐'
      };
    }

    // 基于查询内容进行智能推荐
    const recommendations = searchResults.map(listing => {
      let score = 0;
      let reasons: string[] = [];

      // 价格匹配
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

      // 位置匹配
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
      reasoning: `检查了 ${availableListings.length} properties，${bookableListings.length} 个可预订${
        checkIn ? `，日期: ${checkIn.toLocaleDateString()} - ${checkOut?.toLocaleDateString()}` : ''
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

// Multi-Agent 编排结果
export interface OrchestrationResult {
  message: string;
  listings: any[];
}

// Multi-Agent 编排器（增强版 + 对话记忆）
export async function orchestrateAgents(
  query: string, 
  conversationId: string = 'default'
): Promise<OrchestrationResult> {
  try {
    console.log('🤖 Multi-Agent 系统开始处理查询:', query);

    // 0. 获取或创建对话上下文
    let context = getConversation(conversationId);
    if (!context) {
      const { createConversation } = await import('./conversation-memory');
      context = createConversation(conversationId);
    }

    // 添加用户消息到历史
    addMessage(conversationId, 'user', query);

    // 分析用户偏好
    analyzePreferences(context);

    // 获取对话摘要
    const conversationSummary = getConversationSummary(context);
    console.log('📝 对话上下文:', conversationSummary);

    // 构建对话历史（最近 5 条消息）
    const recentHistory = context.messages
      .slice(-5)
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
      .join('\n');

    // 1. 解析用户意图（带对话历史）
    const intent = await parseUserIntent(query, recentHistory);
    console.log('🧠 用户意图:', intent.type, intent.listingTitle ? `(房源: ${intent.listingTitle})` : '');

    // 从上下文继承过滤条件
    if (!intent.checkInDate && context.currentFilters?.checkInDate) {
      intent.checkInDate = context.currentFilters.checkInDate;
      intent.checkOutDate = context.currentFilters.checkOutDate;
    }

    // 如果是预订意图但没有房源名称，尝试从历史中提取
    if (intent.type === 'booking' && !intent.listingTitle && !intent.listingId) {
      // 查找最近提到的房源
      const recentMessages = context.messages.slice(-10);
      for (let i = recentMessages.length - 1; i >= 0; i--) {
        const msg = recentMessages[i];
        // 查找常见房源名称模式
        const listingMatch = msg.content.match(/(Luxury Villa|Cozy Apartment|Modern Loft|Beach House|Mountain Cabin|City Studio|Countryside Cottage|Penthouse Suite|Garden House|Lake View Home|Seaside Retreat|Urban Oasis|Historic Mansion|Desert Lodge|Forest Cabin|Elegant Townhouse|Charming Bungalow|Stylish Condo|Rustic Farmhouse|Waterfront Property)\s*\d+/i);
        
        if (listingMatch) {
          intent.listingTitle = listingMatch[0];
          console.log('💡 从对话历史中提取房源名称:', intent.listingTitle);
          break;
        }
      }
    }

    // 根据意图类型采取不同策略
    if (intent.type === 'date_check') {
      return await handleDateCheck(intent, conversationId);
    } else if (intent.type === 'price_predict') {
      return await handlePricePredict(intent, conversationId);
    } else if (intent.type === 'booking') {
      return await handleBooking(intent, conversationId);
    }

    // 默认：搜索流程（基于上下文）
    
    // 检查是否是基于上次结果的追问
    const isFollowUp = query.length < 20 && (
      query.includes('这些') || 
      query.includes('它们') || 
      query.includes('最便宜') ||
      query.includes('最贵') ||
      query.includes('最近') ||
      query.includes('哪个')
    );

    let listings: any[] = [];

    if (isFollowUp && context.lastSearchResults && context.lastSearchResults.length > 0) {
      // 基于上次结果进行过滤
      console.log('🔄 基于上次搜索结果 (', context.lastSearchResults.length, '个) 进行追问');
      listings = context.lastSearchResults;
    } else {
      // 新搜索
      const searchQuery = intent.searchQuery || query;
      const searchResult = await searchAgent(searchQuery);
      console.log('🔍 SearchAgent 结果:', searchResult.listings.length, 'properties');
      listings = searchResult.listings;

      if (listings.length === 0) {
        return {
          message: responses.noResults,
          listings: []
        };
      }
    }

    // 2. 推荐 Agent（考虑用户偏好）
    const recommendResult = await recommendAgent(query, listings);
    console.log('💡 RecommendAgent 结果:', recommendResult.listings.length, '个推荐');

    // 3. 预订 Agent（带日期和价格Now）
    const bookingResult = await bookingAgent(recommendResult.listings, {
      checkInDate: intent.checkInDate || context.currentFilters?.checkInDate,
      checkOutDate: intent.checkOutDate || context.currentFilters?.checkOutDate,
      enablePricePrediction: intent.enablePricePrediction || !!intent.checkInDate,
    });
    console.log('📅 BookingAgent 结果:', bookingResult.listings.length, 'properties');

    // 4. 更新对话上下文
    const topListings = bookingResult.listings
      .filter(l => l.canBook)
      .slice(0, 5);

    // 保存搜索结果和过滤条件
    updateLastSearch(conversationId, bookingResult.listings);
    updateFilters(conversationId, {
      checkInDate: intent.checkInDate || context.currentFilters?.checkInDate,
      checkOutDate: intent.checkOutDate || context.currentFilters?.checkOutDate,
    });

    // 5. 生成最终回复
    let message = '';
    
    if (isFollowUp) {
      message = `🔄 Based on previous search, filtered ${topListings.length} ${topListings.length === 1 ? 'property' : 'properties'}:\n\n`;
    } else {
      message = `🎉 Found ${topListings.length} perfect ${topListings.length === 1 ? 'property' : 'properties'}!\n\n`;
    }
    
    if (intent.checkInDate || context.currentFilters?.checkInDate) {
      const checkIn = intent.checkInDate || context.currentFilters?.checkInDate;
      const checkOut = intent.checkOutDate || context.currentFilters?.checkOutDate;
      message += `📅 Dates: ${new Date(checkIn!).toLocaleDateString()}`;
      if (checkOut) {
        message += ` - ${new Date(checkOut).toLocaleDateString()}`;
      }
      message += '\n\n';
    }

    message += `💡 Click property cards for details\n`;
    message += `🔍 Ask: "Which is cheapest?" or "Best time to book?"`;

    // 保存助手回复到历史
    addMessage(conversationId, 'assistant', message);

    return {
      message,
      listings: topListings
    };
  } catch (error) {
    console.error('Multi-Agent Orchestration Error:', error);
    return {
      message: `Sorry, I encountered an issue. Please try again or rephrase.\n\nCommon queries:\n• "Find beach houses"\n• "Available Jan 1-7?"\n• "When is cheapest time to book"`,
      listings: []
    };
  }
}

// 处理日期检查
async function handleDateCheck(intent: any, conversationId: string): Promise<OrchestrationResult> {
  try {
    // 获取所有房源
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

// 处理价格Now
async function handlePricePredict(intent: any, conversationId: string): Promise<OrchestrationResult> {
  try {
    // 获取上下文
    const context = getConversation(conversationId);
    
    let listings: any[] = [];
    
    // 如果指定了特定房源，只分析那properties
    if (intent.listingTitle) {
      console.log('🎯 分析特定房源价格:', intent.listingTitle);
      
      // 先从缓存中查找
      if (context?.lastSearchResults && context.lastSearchResults.length > 0) {
        const cleanQuery = intent.listingTitle.toLowerCase().replace(/\s/g, '');
        const found = context.lastSearchResults.find((l: any) => {
          const cleanTitle = l.title.toLowerCase().replace(/\s/g, '');
          return cleanTitle === cleanQuery || cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle);
        });
        
        if (found) {
          listings = [found];
          console.log('✅ 在缓存中Found:', found.title);
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
      console.log('🔄 使用上次搜索的', context.lastSearchResults.length, 'properties进行价格分析');
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
    
    // 如果是针对特定房源
    if (intent.listingTitle && resultListings.length === 1) {
      const listing = resultListings[0];
      message = `🎯 **Price Analysis:** ${listing.title}\n\n`;
      
      if (listing.priceInfo) {
        message += `💰 **Base Price:** $${listing.priceInfo.currentPrice}/night\n\n`;
        message += `📊 **Best Time to Book:**\n\n`;
        
        // 根据趋势给出建议
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
    // 如果是多properties
    else {
      message = `📊 **Price Trend Analysis:**\n\n`;
      
      if (intent.checkInDate) {
        message += `📅 Query Date: ${new Date(intent.checkInDate).toLocaleDateString()}\n\n`;
      }
      
      // 添加上下文提示
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

// 处理预订请求
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

    // 查找指定房源
    let listing = null;
    
    // 1. 优先从上次搜索结果中查找（更准确，更快）
    if (intent.listingTitle && context?.lastSearchResults && context.lastSearchResults.length > 0) {
      console.log('🔍 在上次搜索结果中查找:', intent.listingTitle);
      
      // 移除空格进行匹配
      const cleanQuery = intent.listingTitle.toLowerCase().replace(/\s/g, '');
      
      listing = context.lastSearchResults.find((l: any) => {
        const cleanTitle = l.title.toLowerCase().replace(/\s/g, '');
        return cleanTitle === cleanQuery || cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle);
      });
      
      if (listing) {
        console.log('✅ 在缓存中Found房源:', listing.title);
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
        // 先尝试精确匹配
        listing = await prisma.listing.findFirst({
          where: {
            title: {
              contains: intent.listingTitle,
              mode: 'insensitive'
            }
          },
          include: { user: true, reservations: true }
        });
        
        // 如果没Found，尝试模糊匹配
        if (!listing) {
          const cleanQuery = intent.listingTitle.toLowerCase().replace(/\s/g, '');
          const allListings = await prisma.listing.findMany({
            include: { user: true, reservations: true }
          });
          
          listing = allListings.find(l => {
            const cleanTitle = l.title.toLowerCase().replace(/\s/g, '');
            return cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle);
          }) || null;
        }
      }
    }

    if (!listing) {
      message = `😕 Sorry, couldn't find "${intent.listingTitle}".\n\n`;
      
      // 如果有上次搜索结果，显示可用选项
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

    // 检查日期和可用性
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

    // 生成预订确认信息
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