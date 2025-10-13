'use client';

import { useState } from 'react';
import { BsRobot } from 'react-icons/bs';
import AIChatModal from './AIChatModal';

const AIChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed
          bottom-6
          right-6
          z-50
          flex
          items-center
          gap-2
          px-4
          py-3
          bg-gradient-to-r
          from-purple-600
          to-blue-600
          text-white
          rounded-full
          shadow-lg
          hover:shadow-xl
          hover:scale-105
          transition-all
          duration-200
          font-semibold
          group
        "
        aria-label="AI助手"
      >
        <BsRobot size={24} className="group-hover:animate-pulse" />
        <span className="hidden sm:inline">AI助手</span>
        
        {/* 脉冲动画 */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
      </button>

      {/* 聊天模态框 */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIChatButton;

