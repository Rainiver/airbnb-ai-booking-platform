// 对话记忆管理系统

export interface ConversationContext {
  conversationId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  currentFilters?: {
    category?: string;      // Beach, Mountain, etc.
    priceRange?: { min: number; max: number };
    guestCount?: number;
    locationValue?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
  lastSearchResults?: any[];  // 缓存上次搜索结果
  userPreferences?: {
    preferredCategories: string[];
    pricePreference: 'budget' | 'mid' | 'luxury';
  };
}

// 内存存储（简单实现，生产环境应使用 Redis）
const conversationStore = new Map<string, ConversationContext>();

// 创建新对话
export function createConversation(conversationId: string): ConversationContext {
  const context: ConversationContext = {
    conversationId,
    messages: [],
    currentFilters: {},
    userPreferences: {
      preferredCategories: [],
      pricePreference: 'mid'
    }
  };
  
  conversationStore.set(conversationId, context);
  return context;
}

// 获取对话上下文
export function getConversation(conversationId: string): ConversationContext | null {
  return conversationStore.get(conversationId) || null;
}

// 添加消息到对话历史
export function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): void {
  const context = conversationStore.get(conversationId);
  if (!context) return;

  context.messages.push({
    role,
    content,
    timestamp: new Date()
  });

  // 只保留最近 20 条消息
  if (context.messages.length > 20) {
    context.messages = context.messages.slice(-20);
  }
}

// 更新当前过滤条件
export function updateFilters(
  conversationId: string,
  filters: Partial<ConversationContext['currentFilters']>
): void {
  const context = conversationStore.get(conversationId);
  if (!context) return;

  context.currentFilters = {
    ...context.currentFilters,
    ...filters
  };
}

// 更新上次搜索结果
export function updateLastSearch(
  conversationId: string,
  listings: any[]
): void {
  const context = conversationStore.get(conversationId);
  if (!context) return;

  context.lastSearchResults = listings;
}

// 分析用户偏好
export function analyzePreferences(context: ConversationContext): void {
  if (!context.messages.length) return;

  const userMessages = context.messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());

  // 分析价格偏好
  const budgetKeywords = ['便宜', '低价', '实惠', '经济'];
  const luxuryKeywords = ['豪华', '高端', '奢华', '顶级'];
  
  const budgetCount = userMessages.filter(msg => 
    budgetKeywords.some(kw => msg.includes(kw))
  ).length;
  
  const luxuryCount = userMessages.filter(msg => 
    luxuryKeywords.some(kw => msg.includes(kw))
  ).length;

  if (budgetCount > luxuryCount) {
    context.userPreferences!.pricePreference = 'budget';
  } else if (luxuryCount > budgetCount) {
    context.userPreferences!.pricePreference = 'luxury';
  }

  // 分析类型偏好
  const categoryKeywords: { [key: string]: string[] } = {
    'Beach': ['海边', '海滩', '沙滩', '海景'],
    'Mountain': ['山', '山区', '高山'],
    'Countryside': ['乡村', '田园', '郊区'],
    'City': ['城市', '市中心', '都市'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const mentioned = userMessages.some(msg => 
      keywords.some(kw => msg.includes(kw))
    );
    if (mentioned && !context.userPreferences!.preferredCategories.includes(category)) {
      context.userPreferences!.preferredCategories.push(category);
    }
  }
}

// 获取对话摘要（用于上下文理解）
export function getConversationSummary(context: ConversationContext): string {
  let summary = '';

  // 当前过滤条件
  if (context.currentFilters && Object.keys(context.currentFilters).length > 0) {
    summary += '当前搜索条件：\n';
    
    if (context.currentFilters.category) {
      summary += `- 类型: ${context.currentFilters.category}\n`;
    }
    if (context.currentFilters.priceRange) {
      summary += `- 价格: $${context.currentFilters.priceRange.min}-${context.currentFilters.priceRange.max}\n`;
    }
    if (context.currentFilters.guestCount) {
      summary += `- 人数: ${context.currentFilters.guestCount} 人\n`;
    }
    if (context.currentFilters.checkInDate) {
      summary += `- 入住: ${context.currentFilters.checkInDate}\n`;
    }
    if (context.currentFilters.checkOutDate) {
      summary += `- 退房: ${context.currentFilters.checkOutDate}\n`;
    }
  }

  // 用户偏好
  if (context.userPreferences) {
    if (context.userPreferences.preferredCategories.length > 0) {
      summary += `\n用户偏好类型: ${context.userPreferences.preferredCategories.join(', ')}\n`;
    }
    summary += `用户价格偏好: ${context.userPreferences.pricePreference}\n`;
  }

  // 上次搜索
  if (context.lastSearchResults && context.lastSearchResults.length > 0) {
    summary += `\n上次搜索返回了 ${context.lastSearchResults.length} 个房源\n`;
  }

  return summary;
}

// 清理过期对话（可选）
export function cleanupOldConversations(maxAge: number = 24 * 60 * 60 * 1000): void {
  const now = new Date().getTime();
  const idsToDelete: string[] = [];
  
  conversationStore.forEach((context, id) => {
    if (context.messages.length === 0) return;
    
    const lastMessage = context.messages[context.messages.length - 1];
    const age = now - lastMessage.timestamp.getTime();
    
    if (age > maxAge) {
      idsToDelete.push(id);
    }
  });
  
  idsToDelete.forEach(id => conversationStore.delete(id));
}
