import prisma from '../prismadb';
import { generateEmbedding } from '../gemini';
import { semanticSearchListings } from '../supabase';

// Agent 基类
export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;
  abstract async execute(params: any): Promise<any>;
}

// 搜索 Agent
export class SearchAgent extends BaseAgent {
  name = 'SearchAgent';
  description = '搜索和筛选房源';

  async execute(params: {
    query?: string;
    locationValue?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    guestCount?: number;
    roomCount?: number;
  }) {
    try {
      console.log('🔍 SearchAgent 执行:', params);

      // 如果有自然语言查询，使用语义搜索
      if (params.query) {
        const embedding = await generateEmbedding(params.query);
        const vectorResults = await semanticSearchListings(embedding, 0.6, 20);
        
        // 获取完整的 listing 数据
        const listingIds = vectorResults.map(r => r.listing_id);
        const listings = await prisma.listing.findMany({
          where: { id: { in: listingIds } },
        });

        // 按相似度排序
        const sortedListings = listings
          .map(listing => ({
            ...listing,
            similarity: vectorResults.find(r => r.listing_id === listing.id)?.similarity || 0,
          }))
          .sort((a, b) => b.similarity - a.similarity);

        return sortedListings;
      }

      // 否则使用传统筛选
      const where: any = {};

      if (params.locationValue) {
        where.locationValue = params.locationValue;
      }

      if (params.category) {
        where.category = params.category;
      }

      if (params.guestCount) {
        where.guestCount = { gte: params.guestCount };
      }

      if (params.roomCount) {
        where.roomCount = { gte: params.roomCount };
      }

      if (params.priceMin || params.priceMax) {
        where.price = {};
        if (params.priceMin) where.price.gte = params.priceMin;
        if (params.priceMax) where.price.lte = params.priceMax;
      }

      const listings = await prisma.listing.findMany({
        where,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      return listings;
    } catch (error) {
      console.error('SearchAgent error:', error);
      throw error;
    }
  }
}

// 推荐 Agent
export class RecommendAgent extends BaseAgent {
  name = 'RecommendAgent';
  description = '基于用户偏好推荐房源';

  async execute(params: {
    listings: any[];
    preferences?: string;
    topK?: number;
  }) {
    try {
      console.log('💡 RecommendAgent 执行');

      const { listings, topK = 5 } = params;

      // 简单的推荐逻辑：按价格和评分排序
      const recommended = listings
        .sort((a, b) => {
          // 优先推荐价格适中、评分高的
          const scoreA = (a.rating || 4.0) - (a.price / 1000);
          const scoreB = (b.rating || 4.0) - (b.price / 1000);
          return scoreB - scoreA;
        })
        .slice(0, topK);

      return recommended;
    } catch (error) {
      console.error('RecommendAgent error:', error);
      throw error;
    }
  }
}

// 预订 Agent
export class BookingAgent extends BaseAgent {
  name = 'BookingAgent';
  description = '检查可用性和计算价格';

  async execute(params: {
    listingId: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      console.log('📅 BookingAgent 执行:', params);

      const { listingId, startDate, endDate } = params;

      // 获取房源信息
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          reservations: true,
        },
      });

      if (!listing) {
        return { available: false, message: '房源不存在' };
      }

      // 如果提供了日期，检查可用性
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        // 检查是否有冲突的预订
        const conflicts = listing.reservations?.filter((reservation: any) => {
          const resStart = new Date(reservation.startDate);
          const resEnd = new Date(reservation.endDate);
          return (start < resEnd && end > resStart);
        });

        const available = !conflicts || conflicts.length === 0;
        const totalPrice = nights * listing.price;

        return {
          available,
          listing,
          nights,
          pricePerNight: listing.price,
          totalPrice,
          message: available 
            ? `房源可用！总计 ${nights} 晚，$${totalPrice}` 
            : '该日期已被预订',
        };
      }

      // 否则只返回房源信息
      return {
        available: true,
        listing,
        message: '请选择日期以检查可用性',
      };
    } catch (error) {
      console.error('BookingAgent error:', error);
      throw error;
    }
  }
}

// Agent 协调器
export class AgentOrchestrator {
  private searchAgent: SearchAgent;
  private recommendAgent: RecommendAgent;
  private bookingAgent: BookingAgent;

  constructor() {
    this.searchAgent = new SearchAgent();
    this.recommendAgent = new RecommendAgent();
    this.bookingAgent = new BookingAgent();
  }

  async processRequest(intent: string, params: any) {
    console.log('🎭 AgentOrchestrator 处理请求:', intent);

    switch (intent) {
      case 'search':
        return await this.searchAgent.execute(params);
      
      case 'recommend':
        const searchResults = await this.searchAgent.execute(params);
        return await this.recommendAgent.execute({
          listings: searchResults,
          topK: params.topK || 5,
        });
      
      case 'booking':
        return await this.bookingAgent.execute(params);
      
      default:
        // 默认行为：搜索 + 推荐
        const listings = await this.searchAgent.execute(params);
        return await this.recommendAgent.execute({
          listings,
          topK: params.topK || 5,
        });
    }
  }
}

