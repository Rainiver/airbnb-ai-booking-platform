'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ModernAIChatModal from './ModernAIChatModal';

const AIChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮动AI助手按钮 - 现代化设计 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 group z-50"
        aria-label="AI助手"
      >
        {/* 外圈光晕动画 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse" />
        
        {/* 主按钮 */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 group-hover:scale-110">
          <Sparkles size={28} className="animate-pulse" />
        </div>

        {/* 悬浮提示 */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            AI Smart Assistant
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </button>

      {/* AI聊天模态框 - 现代化版本 */}
      <ModernAIChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default AIChatButton;