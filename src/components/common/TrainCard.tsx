import React from 'react';
import { FiArrowRight, FiClock, FiMapPin, FiExternalLink } from 'react-icons/fi';
import StatusBadge from './StatusBadge';

interface TrainCardProps {
  trainNo: string;
  departure: string;
  terminal: string;
  departureTime: string;
  waitingRoom: string;
  status: string;
}

const TrainCard: React.FC<TrainCardProps> = ({
  trainNo,
  departure,
  terminal,
  departureTime,
  waitingRoom,
  status,
}) => {
  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // 获取车次类型颜色
  const getTrainTypeColor = () => {
    if (trainNo.startsWith('G')) return 'text-apple-blue';
    if (trainNo.startsWith('D')) return 'text-green-600';
    if (trainNo.startsWith('C')) return 'text-purple-600';
    if (trainNo.startsWith('Z')) return 'text-red-600';
    if (trainNo.startsWith('T')) return 'text-orange-600';
    if (trainNo.startsWith('K')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // 点击打开新标签页
  const handleClick = () => {
    window.open(`/train/${trainNo}`, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      className="
        block bg-white rounded-2xl p-5
        border border-gray-100
        hover:shadow-lg hover:border-apple-blue/20
        transition-all duration-300
        group cursor-pointer
      "
    >
      <div className="flex items-center justify-between mb-4">
        {/* 车次号 */}
        <div className="flex items-center space-x-3">
          <span className={`text-2xl font-bold ${getTrainTypeColor()}`}>
            {trainNo}
          </span>
          <StatusBadge status={status} />
        </div>
        
        {/* 时间和外链图标 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-apple-dark">
            <FiClock className="text-gray-400" />
            <span className="text-xl font-semibold">
              {formatTime(departureTime)}
            </span>
          </div>
          <FiExternalLink className="text-gray-400 group-hover:text-apple-blue transition-colors" />
        </div>
      </div>

      {/* 站点信息 */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-lg font-medium text-apple-dark">{departure}</span>
        <FiArrowRight className="text-gray-400 group-hover:text-apple-blue transition-colors" />
        <span className="text-lg font-medium text-apple-dark">{terminal}</span>
      </div>

      {/* 候车室信息 */}
      <div className="flex items-center space-x-2 text-gray-500">
        <FiMapPin className="text-apple-blue" />
        <span className="text-sm">{waitingRoom}</span>
      </div>
    </div>
  );
};

export default TrainCard;