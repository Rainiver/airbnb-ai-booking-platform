'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import AI3DAvatar from './AI3DAvatar';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  listings?: any[];
  agentStatus?: {
    search: 'idle' | 'active' | 'complete';
    recommend: 'idle' | 'active' | 'complete';
    booking: 'idle' | 'active' | 'complete';
  };
}

interface ModernAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModernAIChatModal: React.FC<ModernAIChatModalProps> = ({ isOpen, onClose }) => {
  // 生成唯一对话 ID
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '👋 你好！我是你的 AI 旅行助手，基于 Multi-Agent + RAG 系统\n\n🎯 我能帮你：\n\n🔍 **智能搜索**\n• "我想找海边的房子"\n• "推荐价格便宜的房源"\n\n📅 **日期查询**\n• "1月1日到1月7日有哪些可用房源"\n• "下周末有空房吗"\n\n💰 **价格预测**\n• "这个月价格会涨吗"\n• "什么时候预订最便宜"\n\n🎫 **智能预订**\n• "帮我预订 Luxury Villa 1，1月1日到1月3日"\n\n试试看吧！',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgentStatus, setCurrentAgentStatus] = useState<{
    search: 'idle' | 'active' | 'complete';
    recommend: 'idle' | 'active' | 'complete';
    booking: 'idle' | 'active' | 'complete';
  }>({
    search: 'idle',
    recommend: 'idle',
    booking: 'idle',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAgentProgress = async () => {
    // Search Agent
    setCurrentAgentStatus({ search: 'active', recommend: 'idle', booking: 'idle' });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Recommend Agent
    setCurrentAgentStatus({ search: 'complete', recommend: 'active', booking: 'idle' });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Booking Agent
    setCurrentAgentStatus({ search: 'complete', recommend: 'complete', booking: 'active' });
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Complete
    setCurrentAgentStatus({ search: 'complete', recommend: 'complete', booking: 'complete' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 开始 Agent 动画
    simulateAgentProgress();

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          conversationId 
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || '抱歉，我现在无法回答你的问题。',
        timestamp: new Date(),
        listings: data.listings || [],
        agentStatus: { ...currentAgentStatus },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，发生了错误。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentAgentStatus({ search: 'idle', recommend: 'idle', booking: 'idle' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景模糊层 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* 主容器 - 玻璃拟态设计 */}
      <div className="relative w-full max-w-4xl h-[85vh] flex rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-xl border border-white/20">
        
        {/* 左侧 - AI 助手可视化 */}
        <div className="w-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-r border-white/20 p-6 flex flex-col items-center justify-center space-y-6">
          {/* 3D Avatar */}
          <AI3DAvatar 
            isThinking={isLoading} 
            agentStatus={currentAgentStatus}
          />
          
          {/* AI 状态文本 */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI 旅行助手
            </h3>
            {isLoading && (
              <div className="space-y-2 animate-pulse">
                {currentAgentStatus.search !== 'idle' && (
                  <p className="text-xs text-blue-600">
                    {currentAgentStatus.search === 'active' ? '🔍 正在搜索...' : '✓ 搜索完成'}
                  </p>
                )}
                {currentAgentStatus.recommend !== 'idle' && (
                  <p className="text-xs text-purple-600">
                    {currentAgentStatus.recommend === 'active' ? '💡 智能推荐中...' : '✓ 推荐完成'}
                  </p>
                )}
                {currentAgentStatus.booking !== 'idle' && (
                  <p className="text-xs text-pink-600">
                    {currentAgentStatus.booking === 'active' ? '📅 检查可用性...' : '✓ 检查完成'}
                  </p>
                )}
              </div>
            )}
            {!isLoading && (
              <p className="text-xs text-gray-500">准备就绪</p>
            )}
          </div>

          {/* Multi-Agent 说明 */}
          <div className="w-full bg-white/50 backdrop-blur-sm rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-700">搜索智能体</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-700">推荐智能体</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-gray-700">预订智能体</span>
            </div>
          </div>
        </div>

        {/* 右侧 - 对话区域 */}
        <div className="flex-1 flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <Sparkles className="text-blue-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">AI 对话</h2>
                <p className="text-xs text-gray-500">Multi-Agent RAG 系统</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                        : 'bg-white/80 backdrop-blur-sm text-gray-800 shadow-md border border-white/20'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-[10px] mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                {/* 房源卡片 */}
                {message.listings && message.listings.length > 0 && (
                  <div className="flex justify-start mt-4">
                    <div className="space-y-3 max-w-[75%]">
                      {message.listings.map((listing: any) => (
                        <a
                          key={listing.id}
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
                        >
                          <div className="flex items-start space-x-4">
                            {listing.imageSrc && (
                              <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                                <img
                                  src={listing.imageSrc}
                                  alt={listing.title}
                                  className="w-24 h-24 object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {listing.title}
                              </h3>
                              <p className="text-xs text-gray-600">
                                📍 {listing.locationValue} • {listing.category}
                              </p>
                              <p className="text-xs text-gray-600">
                                👥 最多 {listing.guestCount} 人
                              </p>
                              
                              {/* 价格信息 - 增强版 */}
                              <div className="space-y-1">
                                {listing.priceInfo ? (
                                  <div className="space-y-0.5">
                                    <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                      ${listing.priceInfo.predictedPrice}/晚
                                    </p>
                                    {listing.priceInfo.priceChange !== '无变化' && (
                                      <p className="text-[10px] text-gray-500">
                                        原价 ${listing.priceInfo.currentPrice} ({listing.priceInfo.priceChange})
                                      </p>
                                    )}
                                    <p className="text-[10px] text-orange-600">
                                      📊 {listing.priceInfo.priceTrend}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    ${listing.price}/晚
                                  </p>
                                )}
                                
                                {/* 总价（如果有多晚） */}
                                {listing.totalPrice && listing.totalPrice !== listing.price && (
                                  <p className="text-xs text-gray-700 font-semibold">
                                    💵 总价: ${listing.totalPrice}
                                  </p>
                                )}
                              </div>

                              {/* 推荐理由 */}
                              {listing.recommendationReasons && listing.recommendationReasons.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {listing.recommendationReasons.map((reason: string, idx: number) => (
                                    <span key={idx} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                      ✓ {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {/* 可用性状态 */}
                              {listing.availability && (
                                <div className="flex items-center space-x-1">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    listing.canBook 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {listing.canBook ? '✅ 可预订' : '❌ 不可用'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-gray-600">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="p-6 border-t border-white/20 bg-white/50 backdrop-blur-sm">
            <div className="flex space-x-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                className="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAIChatModal;
