import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundImage: 'url(https://cf-r2.zyhorg.ac.cn/images/1765074018199-0mhm59-chengdu.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <img 
            src="/Railway.svg" 
            alt="全国铁路信息查询系统" 
            className="w-32 h-32 drop-shadow-2xl"
          />
        </div>
        
        {/* 标题 */}
        <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in-up text-center">
          全国铁路信息查询系统
        </h1>
        <p className="text-gray-400 text-sm mb-6 animate-fade-in-up">
          Railway Information Query System
        </p>
        
        {/* 骨架加载文字效果 */}
        <div className="flex flex-col items-center space-y-3 animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          
          <p className="text-white/80 text-lg">
            正在加载铁路信息...
          </p>
          
          {/* 加载进度条 */}
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-gradient-to-r from-apple-blue to-blue-400 rounded-full"
              style={{
                animation: 'loading-progress 2s ease-in-out infinite',
              }}
            ></div>
          </div>
          
          {/* 提示文字 */}
          <p className="text-gray-500 text-xs mt-4">
            非官方平台 · 仅供学习交流
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading-progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;