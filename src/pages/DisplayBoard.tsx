import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiClock, FiMapPin, FiHome, FiChevronRight } from 'react-icons/fi';
import { IoTrainSharp } from 'react-icons/io5';
import { useStations } from '../hooks/useStations';
import { getStationInfo } from '../services/api';
import type { StationTrainInfo } from '../types';

const DisplayBoard: React.FC = () => {
  const navigate = useNavigate();
  const { searchStations } = useStations();
  const [stationName, setStationName] = useState('北京');
  const [trains, setTrains] = useState<StationTrainInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<StationTrainInfo | null>(null);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取车站信息
  const fetchStationInfo = useCallback(async (station: string) => {
    setLoading(true);
    try {
      const response = await getStationInfo(station);
      const trainList: StationTrainInfo[] = response.data.map((item) => ({
        trainNo: item[0],
        departure: item[1],
        terminal: item[2],
        departureTime: item[3],
        waitingRoom: item[4],
        status: item[5],
      }));
      setTrains(trainList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和自动刷新
  useEffect(() => {
    fetchStationInfo(stationName);
    const refreshTimer = setInterval(() => {
      fetchStationInfo(stationName);
    }, 60000);
    return () => clearInterval(refreshTimer);
  }, [stationName, fetchStationInfo]);

  // 处理搜索
  const handleSearchChange = (value: string) => {
    setStationName(value);
    if (value.trim()) {
      const results = searchStations(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 选择车站
  const handleSelectStation = (station: string) => {
    setStationName(station);
    setShowSuggestions(false);
    fetchStationInfo(station);
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // 返回首页
  const handleGoHome = () => {
    navigate('/');
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    if (status === '正点') {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (status === '正在检票') {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
    }
    if (status === '停止检票') {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    if (status === '已发车') {
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
    if (status.includes('晚点')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // 获取车次类型颜色
  const getTrainTypeColor = (trainNo: string) => {
    if (trainNo.startsWith('G')) return 'text-blue-400';
    if (trainNo.startsWith('D')) return 'text-green-400';
    if (trainNo.startsWith('C')) return 'text-purple-400';
    if (trainNo.startsWith('Z')) return 'text-red-400';
    if (trainNo.startsWith('T')) return 'text-orange-400';
    if (trainNo.startsWith('K')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-gradient-to-r from-apple-blue to-blue-600 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          {/* 移动端布局 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* 左侧：返回按钮和车站选择 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* 返回首页按钮 */}
              <button
                onClick={handleGoHome}
                className="
                  flex items-center justify-center
                  w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2
                  bg-white/20 hover:bg-white/30 
                  rounded-full sm:rounded-lg
                  transition-colors
                "
                title="返回首页"
              >
                <FiHome className="text-lg sm:text-xl" />
                <span className="hidden sm:inline ml-2">首页</span>
              </button>

              {/* 车站选择 */}
              <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                <FiMapPin className="text-lg sm:text-2xl flex-shrink-0" />
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="
                      bg-white/20 backdrop-blur-sm
                      px-3 py-2 rounded-lg
                      text-white placeholder:text-white/70
                      border border-white/30
                      focus:outline-none focus:border-white
                      text-base sm:text-xl font-semibold
                      w-full sm:w-32
                    "
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50 overflow-hidden min-w-[180px]">
                      {suggestions.slice(0, 6).map((station, index) => (
                        <button
                          key={index}
                          onMouseDown={() => handleSelectStation(station)}
                          className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 transition-colors text-sm"
                        >
                          {station}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-lg sm:text-2xl font-bold">站</span>
              </div>
            </div>

            {/* 右侧：时间和刷新 */}
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <FiClock className="text-lg sm:text-xl" />
                <span 
                  className="text-xl sm:text-3xl font-bold"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                </span>
              </div>
              <button
                onClick={() => fetchStationInfo(stationName)}
                className="
                  flex items-center space-x-1 sm:space-x-2 
                  px-3 sm:px-4 py-2 
                  bg-white/20 rounded-lg 
                  hover:bg-white/30 transition-colors
                "
              >
                <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm sm:text-base">刷新</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端表头（仅在大屏显示） */}
      <div className="hidden lg:block bg-gray-800 px-6 py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-6 gap-4 text-gray-400 font-medium text-sm">
          <div>车次</div>
          <div>始发站</div>
          <div>终点站</div>
          <div>开车时间</div>
          <div>候车室/检票口</div>
          <div>状态</div>
        </div>
      </div>

      {/* 列车列表 */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-16">
        {/* 加载状态 */}
        {loading && trains.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FiRefreshCw className="text-4xl text-gray-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">正在加载...</p>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && trains.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <IoTrainSharp className="text-5xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">暂无列车信息</p>
            </div>
          </div>
        )}

        {/* 桌面端列表 */}
        <div className="hidden lg:block px-6">
          <div className="max-w-7xl mx-auto divide-y divide-gray-700/50">
            {trains.map((train, index) => (
              <div
                key={`${train.trainNo}-${index}`}
                className="grid grid-cols-6 gap-4 py-4 items-center hover:bg-gray-800/50 transition-colors rounded-lg px-2 -mx-2"
              >
                <div className={`text-2xl font-bold ${getTrainTypeColor(train.trainNo)}`}>
                  {train.trainNo}
                </div>
                <div className="text-lg text-gray-200">{train.departure}</div>
                <div className="text-lg text-gray-200">{train.terminal}</div>
                <div 
                  className="text-2xl font-bold text-green-400"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatTime(train.departureTime)}
                </div>
                <div className="text-base text-blue-400">{train.waitingRoom}</div>
                <div>
                  <span className={`
                    inline-flex px-3 py-1 rounded-full text-sm font-medium
                    border ${getStatusStyle(train.status)}
                  `}>
                    {train.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 移动端/平板端卡片列表 */}
        <div className="lg:hidden px-3 sm:px-4 py-2 space-y-3">
          {trains.map((train, index) => (
            <div
              key={`${train.trainNo}-${index}`}
              onClick={() => setSelectedTrain(selectedTrain?.trainNo === train.trainNo ? null : train)}
              className={`
                bg-gray-800/80 backdrop-blur rounded-xl p-4
                border border-gray-700/50
                transition-all duration-200
                ${selectedTrain?.trainNo === train.trainNo ? 'ring-2 ring-apple-blue' : ''}
              `}
            >
              {/* 卡片头部 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* 车次 */}
                  <span className={`text-xl sm:text-2xl font-bold ${getTrainTypeColor(train.trainNo)}`}>
                    {train.trainNo}
                  </span>
                  {/* 状态 */}
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    border ${getStatusStyle(train.status)}
                  `}>
                    {train.status}
                  </span>
                </div>
                {/* 开车时间 */}
                <div 
                  className="text-2xl sm:text-3xl font-bold text-green-400"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatTime(train.departureTime)}
                </div>
              </div>

              {/* 站点信息 */}
              <div className="flex items-center space-x-2 text-sm sm:text-base text-gray-300 mb-2">
                <span className="text-gray-400">始发</span>
                <span className="font-medium text-white">{train.departure}</span>
                <FiChevronRight className="text-gray-500" />
                <span className="text-gray-400">终点</span>
                <span className="font-medium text-white">{train.terminal}</span>
              </div>

              {/* 候车信息 */}
              <div className="flex items-center space-x-2 text-blue-400">
                <FiMapPin className="text-sm" />
                <span className="text-sm sm:text-base">{train.waitingRoom}</span>
              </div>

              {/* 展开详情 */}
              {selectedTrain?.trainNo === train.trainNo && (
                <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">始发站</span>
                      <p className="text-white font-medium">{train.departure}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">终点站</span>
                      <p className="text-white font-medium">{train.terminal}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">候车室</span>
                      <p className="text-blue-400 font-medium">{train.waitingRoom.split('/')[0]}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">检票口</span>
                      <p className="text-blue-400 font-medium">{train.waitingRoom.split('/')[1] || '-'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/train/${train.trainNo}`, '_blank');
                    }}
                    className="
                      w-full mt-3 py-2
                      bg-apple-blue/20 hover:bg-apple-blue/30
                      text-apple-blue
                      rounded-lg text-sm font-medium
                      transition-colors
                    "
                  >
                    查看车次详情
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 bg-gradient-to-r from-apple-blue to-blue-600 px-3 sm:px-6 py-2 sm:py-3 fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto">
          {/* 移动端 */}
          <div className="sm:hidden text-center text-xs">
            <p className="text-white/90">🚄 请注意检票时间，提前到达候车室</p>
            <p className="text-white/60 mt-0.5">
              数据仅供参考 · 更新于 {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
            </p>
          </div>
          
          {/* 桌面端 */}
          <div className="hidden sm:flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-white/90">🚄 温馨提示：请旅客注意检票时间，提前到达候车室</span>
            </div>
            <div className="text-white/70">
              自动刷新：每分钟 | 更新时间：{currentTime.toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {/* 移动端快速筛选（可选功能） */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700/50 px-3 py-2 z-10">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>共 {trains.length} 趟列车</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>正点</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>检票</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>晚点</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayBoard;