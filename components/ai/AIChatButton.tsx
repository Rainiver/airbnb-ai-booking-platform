'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import AIChatModal from './AIChatModal';

const AIChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮动AI助手按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 z-50"
        aria-label="AI助手"
      >
        <MessageCircle size={24} />
      </button>

      {/* AI聊天模态框 */}
      <AIChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default AIChatButton;