'use client';

import { useEffect, useRef } from 'react';

interface AI3DAvatarProps {
  isThinking?: boolean;
  agentStatus?: {
    search: 'idle' | 'active' | 'complete';
    recommend: 'idle' | 'active' | 'complete';
    booking: 'idle' | 'active' | 'complete';
  };
}

const AI3DAvatar: React.FC<AI3DAvatarProps> = ({ 
  isThinking = false,
  agentStatus = { search: 'idle', recommend: 'idle', booking: 'idle' }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 绘制主球体（渐变）
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80);
      
      if (isThinking) {
        // 思考状态 - 动态彩虹渐变
        gradient.addColorStop(0, `hsla(${(time * 2) % 360}, 80%, 60%, 0.9)`);
        gradient.addColorStop(0.5, `hsla(${(time * 2 + 60) % 360}, 80%, 60%, 0.6)`);
        gradient.addColorStop(1, `hsla(${(time * 2 + 120) % 360}, 80%, 60%, 0.2)`);
      } else {
        // 静态状态 - 蓝色渐变
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.6)');
        gradient.addColorStop(1, 'rgba(147, 197, 253, 0.2)');
      }

      // 绘制主球体
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.fill();

      // 绘制脉动环
      for (let i = 0; i < 3; i++) {
        const radius = 80 + (time * 2 + i * 20) % 60;
        const opacity = 1 - ((time * 2 + i * 20) % 60) / 60;
        
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 绘制粒子效果
      if (isThinking) {
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + time / 20;
          const distance = 100 + Math.sin(time / 10 + i) * 20;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;
          const size = 3 + Math.sin(time / 5 + i) * 2;

          const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          particleGradient.addColorStop(0, `hsla(${(time * 3 + i * 30) % 360}, 80%, 70%, 0.8)`);
          particleGradient.addColorStop(1, `hsla(${(time * 3 + i * 30) % 360}, 80%, 70%, 0)`);

          ctx.fillStyle = particleGradient;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 1;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isThinking]);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={192}
        height={192}
        className="absolute inset-0"
      />
      
      {/* Agent 状态指示器 */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
          agentStatus.search === 'active' ? 'bg-blue-500 animate-pulse scale-125' :
          agentStatus.search === 'complete' ? 'bg-green-500' : 'bg-gray-300'
        }`} title="Search Agent" />
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
          agentStatus.recommend === 'active' ? 'bg-purple-500 animate-pulse scale-125' :
          agentStatus.recommend === 'complete' ? 'bg-green-500' : 'bg-gray-300'
        }`} title="Recommend Agent" />
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
          agentStatus.booking === 'active' ? 'bg-pink-500 animate-pulse scale-125' :
          agentStatus.booking === 'complete' ? 'bg-green-500' : 'bg-gray-300'
        }`} title="Booking Agent" />
      </div>
    </div>
  );
};

export default AI3DAvatar;
