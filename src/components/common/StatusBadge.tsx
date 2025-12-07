import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case '正点':
        return 'bg-green-100 text-green-700 border-green-200';
      case '正在检票':
        return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20 animate-pulse';
      case '停止检票':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case '已发车':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case '候车中':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        if (status.includes('晚点')) {
          return 'bg-red-100 text-red-700 border-red-200';
        }
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1
        text-sm font-medium rounded-full
        border ${getStatusStyle()}
      `}
    >
      {status}
    </span>
  );
};

export default StatusBadge;