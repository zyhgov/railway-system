import React from 'react';

interface LoadingProps {
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ text = '加载中...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-apple-gray rounded-full"></div>
        <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-gray-500 font-medium">{text}</p>
    </div>
  );
};

export default Loading;