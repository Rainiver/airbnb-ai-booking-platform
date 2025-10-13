'use client';

import { useState, useRef, useEffect } from 'react';
import { IoClose, IoSend } from 'react-icons/io5';
import { BsRobot } from 'react-icons/bs';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  listings?: any[];
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是AI助手🤖 我可以帮你找到完美的住宿。告诉我你的需求吧！',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // 添加用户消息
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 调用 AI API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const data = await response.json();

      // 添加助手回复
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.message,
          listings: data.listings || [],
        },
      ]);
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 按Enter发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 点击房源卡片
  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 聊天窗口 */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-[600px] h-[80vh] sm:h-[700px] flex flex-col animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-full">
              <BsRobot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">AI 智能助手</h3>
              <p className="text-white text-xs opacity-90">为您推荐完美住宿</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <IoClose size={24} className="text-white" />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index}>
              {/* 消息气泡 */}
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>

              {/* 房源卡片 */}
              {message.listings && message.listings.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.listings.map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => handleListingClick(listing.id)}
                      className="
                        bg-white
                        border
                        rounded-xl
                        p-3
                        hover:shadow-md
                        cursor-pointer
                        transition
                        flex
                        gap-3
                      "
                    >
                      {/* 房源图片 */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={listing.imageSrc}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 房源信息 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {listing.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {listing.locationValue} • {listing.category}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {listing.guestCount} 客人 • {listing.roomCount} 卧室
                        </p>
                        <p className="text-sm font-semibold text-purple-600 mt-1">
                          ${listing.price} / 晚
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 加载动画 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="描述你的需求..."
              disabled={isLoading}
              className="
                flex-1
                px-4
                py-3
                border
                rounded-full
                focus:outline-none
                focus:ring-2
                focus:ring-purple-500
                disabled:bg-gray-100
                disabled:cursor-not-allowed
              "
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="
                px-6
                py-3
                bg-purple-600
                text-white
                rounded-full
                hover:bg-purple-700
                disabled:bg-gray-300
                disabled:cursor-not-allowed
                transition
                flex
                items-center
                gap-2
              "
            >
              <IoSend size={20} />
            </button>
          </div>

          {/* 快捷建议 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              '海边的房子',
              '适合家庭的',
              '预算$200-300',
              '现代公寓',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                disabled={isLoading}
                className="
                  px-3
                  py-1
                  text-xs
                  bg-white
                  border
                  border-purple-200
                  text-purple-600
                  rounded-full
                  hover:bg-purple-50
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition
                "
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;

