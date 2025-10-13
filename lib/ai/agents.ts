import { generateEmbedding } from '@/lib/gemini';
import { semanticSearchListings } from '@/lib/supabase';
import prisma from '@/lib/prismadb';

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

// 预订 Agent - 负责检查可用性和预订信息
export async function bookingAgent(listings: any[]): Promise<AgentResult> {
  try {
    const availableListings = listings.map(listing => {
      // 检查是否有预订冲突
      const hasConflicts = listing.reservations?.some((reservation: any) => {
        const now = new Date();
        const startDate = new Date(reservation.startDate);
        const endDate = new Date(reservation.endDate);
        
        // 如果有当前或未来的预订，标记为部分可用
        return startDate >= now || endDate >= now;
      });

      return {
        ...listing,
        availability: hasConflicts ? '部分可用' : '完全可用',
        bookingInfo: hasConflicts 
          ? '该房源有部分日期被预订，建议查看具体日期' 
          : '该房源目前完全可用，可以立即预订'
      };
    });

    return {
      agent: 'BookingAgent',
      listings: availableListings,
      reasoning: `检查了 ${availableListings.length} 个房源的可用性，提供了预订建议`
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

// Multi-Agent 编排器
export async function orchestrateAgents(query: string): Promise<string> {
  try {
    console.log('🤖 Multi-Agent 系统开始处理查询:', query);

    // 1. 搜索 Agent
    const searchResult = await searchAgent(query);
    console.log('🔍 SearchAgent 结果:', searchResult.listings.length, '个房源');

    if (searchResult.listings.length === 0) {
      return `抱歉，我没有找到符合你要求的房源。请尝试使用不同的关键词，比如：
      
• "海边的房子"
• "便宜的房源"  
• "适合家庭的大房子"
• "有游泳池的豪华别墅"

或者告诉我你的具体需求，我会帮你找到最合适的房源！`;
    }

    // 2. 推荐 Agent
    const recommendResult = await recommendAgent(query, searchResult.listings);
    console.log('💡 RecommendAgent 结果:', recommendResult.listings.length, '个推荐');

    // 3. 预订 Agent
    const bookingResult = await bookingAgent(recommendResult.listings);
    console.log('📅 BookingAgent 结果:', bookingResult.listings.length, '个房源');

    // 4. 生成最终回复
    const topListings = bookingResult.listings.slice(0, 5); // 返回前5个最佳推荐

    let response = `🎉 我为你找到了 ${topListings.length} 个完美的房源！\n\n`;

    topListings.forEach((listing, index) => {
      const reasons = listing.recommendationReasons?.join('、') || '符合你的需求';
      response += `**${index + 1}. ${listing.title}**\n`;
      response += `📍 ${listing.locationValue}\n`;
      response += `💰 $${listing.price}/晚\n`;
      response += `👥 最多 ${listing.guestCount} 人\n`;
      response += `🏠 类型: ${listing.category}\n`;
      response += `✅ ${reasons}\n`;
      response += `📅 ${listing.bookingInfo}\n\n`;
    });

    response += `💡 想了解更多详情？点击房源卡片查看完整信息！\n\n`;
    response += `🔍 如果你需要调整搜索条件，随时告诉我！`;

    return response;
  } catch (error) {
    console.error('Multi-Agent Orchestration Error:', error);
    return `抱歉，我在处理你的请求时遇到了问题。请稍后再试，或者尝试重新描述你的需求。

常见搜索示例：
• "我想找海边的房子"
• "推荐一些价格便宜的房源"
• "帮我找个适合家庭的大房子"`;
  }
}