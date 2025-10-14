import { generateEmbedding } from '@/lib/gemini';
import { semanticSearchListings } from '@/lib/supabase';
import prisma from '@/lib/prismadb';
import { parseUserIntent } from './intent-parser';

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
      reasoning: `基于语义搜索找到了 ${listings.length} 个相关房源，相似度阈值 0.2`
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
        reasoning: '没有找到相关房源进行推荐'
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
      reasoning: `基于用户偏好进行了智能推荐，共 ${recommendations.length} 个房源，返回前10个最佳匹配`
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

// 价格预测辅助函数
function predictPrice(listing: any, checkInDate?: Date): {
  currentPrice: number;
  predictedPrice: number;
  priceChange: string;
  priceTrend: string;
} {
  const basePrice = listing.price;
  let multiplier = 1.0;
  let trend = '价格稳定';

  if (checkInDate) {
    const month = checkInDate.getMonth(); // 0-11
    const dayOfWeek = checkInDate.getDay(); // 0-6

    // 季节性价格调整
    if (month >= 5 && month <= 8) {
      // 夏季旺季 (6-9月)
      multiplier *= 1.3;
      trend = '旺季价格上涨';
    } else if (month === 11 || month === 0) {
      // 冬季假期 (12-1月)
      multiplier *= 1.2;
      trend = '假期价格上涨';
    }

    // 周末价格调整
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      // 周五、周六
      multiplier *= 1.15;
      trend += '，周末加价';
    }

    // 临近预订（7天内）价格调整
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckIn <= 7 && daysUntilCheckIn >= 0) {
      multiplier *= 0.9; // 最后一刻折扣
      trend = '临近入住优惠价';
    } else if (daysUntilCheckIn > 60) {
      multiplier *= 0.95; // 早鸟优惠
      trend = '提前预订优惠';
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

// 预订 Agent - 负责检查可用性、价格预测和预订建议
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

      // 2. 价格预测
      const priceInfo = options?.enablePricePrediction 
        ? predictPrice(listing, checkIn)
        : null;

      // 3. 计算总价
      let totalPrice = listing.price;
      if (checkIn && checkOut) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const pricePerNight = priceInfo?.predictedPrice || listing.price;
        totalPrice = pricePerNight * nights;
      }

      // 4. 生成预订信息
      let bookingInfo = dateCheck.availableInfo;
      if (priceInfo) {
        bookingInfo += `\n💰 价格: $${priceInfo.predictedPrice}/晚 (${priceInfo.priceChange})`;
        bookingInfo += `\n📊 ${priceInfo.priceTrend}`;
      }
      if (checkIn && checkOut && dateCheck.isAvailable) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        bookingInfo += `\n🌙 ${nights} 晚，总价: $${totalPrice}`;
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
      reasoning: `检查了 ${availableListings.length} 个房源，${bookableListings.length} 个可预订${
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

// Multi-Agent 编排器（增强版）
export async function orchestrateAgents(query: string): Promise<OrchestrationResult> {
  try {
    console.log('🤖 Multi-Agent 系统开始处理查询:', query);

    // 0. 解析用户意图
    const intent = await parseUserIntent(query);
    console.log('🧠 用户意图:', intent.type);

    // 根据意图类型采取不同策略
    if (intent.type === 'date_check') {
      return await handleDateCheck(intent);
    } else if (intent.type === 'price_predict') {
      return await handlePricePredict(intent);
    } else if (intent.type === 'booking') {
      return await handleBooking(intent);
    }

    // 默认：搜索流程
    // 1. 搜索 Agent
    const searchQuery = intent.searchQuery || query;
    const searchResult = await searchAgent(searchQuery);
    console.log('🔍 SearchAgent 结果:', searchResult.listings.length, '个房源');

    if (searchResult.listings.length === 0) {
      return {
        message: `抱歉，我没有找到符合你要求的房源。请尝试使用不同的关键词，比如：
      
• "海边的房子"
• "便宜的房源"  
• "适合家庭的大房子"
• "有游泳池的豪华别墅"

你也可以：
• 指定日期："1月1日到1月7日有哪些可用房源"
• 询问价格："这个月价格会涨吗"
• 直接预订："帮我预订 [房源名称]"`,
        listings: []
      };
    }

    // 2. 推荐 Agent
    const recommendResult = await recommendAgent(searchQuery, searchResult.listings);
    console.log('💡 RecommendAgent 结果:', recommendResult.listings.length, '个推荐');

    // 3. 预订 Agent（带日期和价格预测）
    const bookingResult = await bookingAgent(recommendResult.listings, {
      checkInDate: intent.checkInDate,
      checkOutDate: intent.checkOutDate,
      enablePricePrediction: intent.enablePricePrediction || !!intent.checkInDate,
    });
    console.log('📅 BookingAgent 结果:', bookingResult.listings.length, '个房源');

    // 4. 生成最终回复
    const topListings = bookingResult.listings
      .filter(l => l.canBook) // 只显示可预订的
      .slice(0, 5);

    let message = `🎉 我为你找到了 ${topListings.length} 个完美的房源！\n\n`;
    
    if (intent.checkInDate) {
      message += `📅 入住日期: ${new Date(intent.checkInDate).toLocaleDateString()}`;
      if (intent.checkOutDate) {
        message += ` - ${new Date(intent.checkOutDate).toLocaleDateString()}`;
      }
      message += '\n\n';
    }

    message += `💡 点击下方房源卡片查看详情和预订\n`;
    message += `🔍 如果需要调整搜索条件，随时告诉我！`;

    return {
      message,
      listings: topListings
    };
  } catch (error) {
    console.error('Multi-Agent Orchestration Error:', error);
    return {
      message: `抱歉，我在处理你的请求时遇到了问题。请稍后再试，或者尝试重新描述你的需求。

常见查询示例：
• "我想找海边的房子"
• "推荐一些价格便宜的房源"
• "1月1日到1月7日有哪些可用房源"
• "这个月价格会涨吗"`,
      listings: []
    };
  }
}

// 处理日期检查
async function handleDateCheck(intent: any): Promise<OrchestrationResult> {
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
    
    let message = `📅 日期查询结果：\n\n`;
    message += `入住: ${new Date(intent.checkInDate).toLocaleDateString()}\n`;
    message += `退房: ${new Date(intent.checkOutDate).toLocaleDateString()}\n\n`;
    message += `✅ 找到 ${available.length} 个可用房源！\n\n`;
    message += `💡 点击下方房源卡片查看详情`;

    return {
      message,
      listings: available.slice(0, 5)
    };
  } catch (error) {
    console.error('Date check error:', error);
    return {
      message: '抱歉，检查日期时出现错误。请重新尝试。',
      listings: []
    };
  }
}

// 处理价格预测
async function handlePricePredict(intent: any): Promise<OrchestrationResult> {
  try {
    // 搜索相关房源
    const searchResult = await searchAgent(intent.searchQuery || '房源');
    
    // 应用价格预测
    const bookingResult = await bookingAgent(searchResult.listings.slice(0, 20), {
      checkInDate: intent.checkInDate,
      checkOutDate: intent.checkOutDate,
      enablePricePrediction: true,
    });

    const listings = bookingResult.listings.slice(0, 5);
    
    let message = `📊 价格趋势分析：\n\n`;
    
    if (intent.checkInDate) {
      message += `📅 查询日期: ${new Date(intent.checkInDate).toLocaleDateString()}\n\n`;
    }

    message += `我为你分析了 ${listings.length} 个房源的价格趋势：\n\n`;
    
    listings.forEach((listing, idx) => {
      if (listing.priceInfo) {
        const trend = listing.priceInfo.priceChange.startsWith('+') ? '📈' : 
                     listing.priceInfo.priceChange.startsWith('-') ? '📉' : '➡️';
        message += `${idx + 1}. ${listing.title}\n`;
        message += `   ${trend} ${listing.priceInfo.priceTrend}\n`;
        message += `   原价 $${listing.priceInfo.currentPrice} → 预测 $${listing.priceInfo.predictedPrice}/晚\n\n`;
      }
    });

    message += `💡 点击房源卡片查看详情`;

    return {
      message,
      listings
    };
  } catch (error) {
    console.error('Price predict error:', error);
    return {
      message: '抱歉，价格预测时出现错误。请重新尝试。',
      listings: []
    };
  }
}

// 处理预订请求
async function handleBooking(intent: any): Promise<OrchestrationResult> {
  try {
    let message = `🎫 预订功能提示：\n\n`;
    
    if (!intent.listingTitle && !intent.listingId) {
      message += `请先通过搜索找到你喜欢的房源，然后告诉我：\n\n`;
      message += `"帮我预订 [房源名称]"\n\n`;
      message += `例如："帮我预订 Luxury Villa 1"`;
      
      return {
        message,
        listings: []
      };
    }

    // 查找指定房源
    let listing = null;
    if (intent.listingId) {
      listing = await prisma.listing.findUnique({
        where: { id: intent.listingId },
        include: { user: true, reservations: true }
      });
    } else if (intent.listingTitle) {
      listing = await prisma.listing.findFirst({
        where: {
          title: {
            contains: intent.listingTitle,
            mode: 'insensitive'
          }
        },
        include: { user: true, reservations: true }
      });
    }

    if (!listing) {
      message = `😕 抱歉，我没有找到名为 "${intent.listingTitle}" 的房源。\n\n`;
      message += `💡 请先搜索房源，然后告诉我你想预订哪一个。`;
      
      return {
        message,
        listings: []
      };
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
      message = `😔 抱歉，${listing.title} 在所选日期不可用。\n\n`;
      message += `📅 ${listingWithInfo.bookingInfo}\n\n`;
      message += `💡 要不要试试其他日期，或者看看其他房源？`;
      
      return {
        message,
        listings: [listingWithInfo]
      };
    }

    // 生成预订确认信息
    message = `✅ 很好！让我帮你预订这个房源：\n\n`;
    message += `🏠 **${listing.title}**\n`;
    message += `📍 ${listing.locationValue}\n\n`;
    
    if (hasDate) {
      const checkIn = new Date(intent.checkInDate!);
      const checkOut = new Date(intent.checkOutDate!);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      message += `📅 入住: ${checkIn.toLocaleDateString()}\n`;
      message += `📅 退房: ${checkOut.toLocaleDateString()}\n`;
      message += `🌙 ${nights} 晚\n\n`;
      
      if (listingWithInfo.priceInfo) {
        message += `💰 价格: $${listingWithInfo.priceInfo.predictedPrice}/晚\n`;
        message += `📊 ${listingWithInfo.priceInfo.priceTrend}\n`;
        message += `💵 总价: $${listingWithInfo.totalPrice}\n\n`;
      }
    } else {
      message += `⚠️ 你还没有选择入住日期！\n\n`;
      message += `请告诉我：\n`;
      message += `"帮我预订 ${listing.title}，1月1日到1月7日"\n\n`;
    }

    message += `🎯 **下一步操作**：\n`;
    message += `请点击下方房源卡片，进入详情页完成预订流程。\n\n`;
    message += `（目前 AI 会为你准备好所有信息，实际预订需要在房源详情页完成）`;

    return {
      message,
      listings: [listingWithInfo]
    };
  } catch (error) {
    console.error('Booking error:', error);
    return {
      message: '抱歉，处理预订请求时出现错误。请重新尝试。',
      listings: []
    };
  }
}