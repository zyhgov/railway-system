import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiClock, FiMapPin, FiArrowRight, FiUsers, 
  FiInfo, FiZap, FiBox, FiHash, FiCoffee, FiLayers
} from 'react-icons/fi';
import { IoTrainSharp, IoSpeedometerOutline } from 'react-icons/io5';
import { MdOutlineEventSeat, MdOutlineRestaurant } from 'react-icons/md';
import { TbRulerMeasure } from 'react-icons/tb';
import Loading from '../components/common/Loading';
import { getTrainInfo } from '../services/api';
import type { TrainDetail, StopInfo } from '../types';

const TrainSearch: React.FC = () => {
  const { trainNo } = useParams<{ trainNo: string }>();
  const navigate = useNavigate();
  
  const [searchValue, setSearchValue] = useState(trainNo || '');
  const [trainDetail, setTrainDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllInfo, setShowAllInfo] = useState(false);

  // 查询车次信息
  const fetchTrainInfo = async (train: string) => {
    if (!train.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTrainInfo(train.toUpperCase());
      setTrainDetail(response);
      navigate(`/train/${train.toUpperCase()}`, { replace: true });
    } catch (err) {
      setError('查询失败，请检查车次号是否正确');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    fetchTrainInfo(searchValue);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 初始加载
  useEffect(() => {
    if (trainNo) {
      fetchTrainInfo(trainNo);
    }
  }, []);

  // 获取车次类型颜色
  const getTrainTypeColor = (train: string) => {
    if (train.startsWith('G')) return 'bg-apple-blue';
    if (train.startsWith('D')) return 'bg-green-600';
    if (train.startsWith('C')) return 'bg-purple-600';
    if (train.startsWith('Z')) return 'bg-red-600';
    if (train.startsWith('T')) return 'bg-orange-600';
    if (train.startsWith('K')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  // 获取车次类型名称
  const getTrainTypeName = (train: string) => {
    if (train.startsWith('G')) return '高速动车组';
    if (train.startsWith('D')) return '动车组';
    if (train.startsWith('C')) return '城际动车组';
    if (train.startsWith('Z')) return '直达特快';
    if (train.startsWith('T')) return '特快列车';
    if (train.startsWith('K')) return '快速列车';
    return '普通列车';
  };

  /**
   * 解析停站时间，考虑跨天情况
   */
  const parseStopTimes = (stops: StopInfo[], baseDate: string) => {
    const result: { stop: StopInfo; arrivalDate: Date; departureDate: Date }[] = [];
    
    const dateParts = baseDate.split('-').map(Number);
    let currentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    let previousDepartureMinutes = -1;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      
      const [arrHour, arrMin] = stop.到达时间.split(':').map(Number);
      const arrivalMinutes = arrHour * 60 + arrMin;
      
      const [depHour, depMin] = stop.发车时间.split(':').map(Number);
      const departureMinutes = depHour * 60 + depMin;

      if (i > 0 && arrivalMinutes < previousDepartureMinutes) {
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const arrivalDate = new Date(currentDate);
      arrivalDate.setHours(arrHour, arrMin, 0, 0);

      let departureDate = new Date(currentDate);
      if (departureMinutes < arrivalMinutes) {
        departureDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
      departureDate.setHours(depHour, depMin, 0, 0);

      result.push({
        stop,
        arrivalDate,
        departureDate,
      });

      previousDepartureMinutes = departureMinutes;
    }

    return result;
  };

  /**
   * 获取站点状态
   */
  const getStopStatus = (
    stopIndex: number, 
    parsedStops: { stop: StopInfo; arrivalDate: Date; departureDate: Date }[],
    now: Date
  ) => {
    const currentStop = parsedStops[stopIndex];
    const { stop, arrivalDate, departureDate } = currentStop;
    
    const isFirstStation = stopIndex === 0;
    const isLastStation = stopIndex === parsedStops.length - 1;

    if (stop.ticketDelay && parseInt(stop.ticketDelay) > 0) {
      return {
        color: 'bg-red-500 border-red-300',
        status: `晚点${stop.ticketDelay}分`,
        textColor: 'text-red-600',
        description: '列车晚点运行'
      };
    }

    if (!isLastStation && now > departureDate) {
      return {
        color: 'bg-gray-400 border-gray-300',
        status: '已过站',
        textColor: 'text-gray-500',
        description: '列车已驶离该站'
      };
    }

    if (isLastStation && now >= arrivalDate) {
      return {
        color: 'bg-green-500 border-green-300',
        status: '已到达',
        textColor: 'text-green-600',
        description: '列车已到达终点站'
      };
    }

    if (now >= arrivalDate && now <= departureDate) {
      return {
        color: 'bg-green-500 border-green-300 animate-pulse',
        status: '当前站',
        textColor: 'text-green-600',
        description: '列车正在该站停靠'
      };
    }

    const thirtyMinutesBefore = new Date(arrivalDate.getTime() - 30 * 60 * 1000);
    if (now >= thirtyMinutesBefore && now < arrivalDate) {
      const minutesLeft = Math.ceil((arrivalDate.getTime() - now.getTime()) / (60 * 1000));
      return {
        color: 'bg-apple-blue border-blue-300',
        status: '即将到达',
        textColor: 'text-apple-blue',
        description: `约${minutesLeft}分钟后到达`
      };
    }

    if (isFirstStation) {
      const tenMinutesBefore = new Date(departureDate.getTime() - 10 * 60 * 1000);
      if (now >= tenMinutesBefore && now < departureDate) {
        const minutesLeft = Math.ceil((departureDate.getTime() - now.getTime()) / (60 * 1000));
        return {
          color: 'bg-yellow-500 border-yellow-300',
          status: '即将发车',
          textColor: 'text-yellow-600',
          description: `约${minutesLeft}分钟后发车`
        };
      }
      
      if (now < departureDate) {
        return {
          color: 'bg-apple-blue border-apple-blue/30',
          status: '始发站',
          textColor: 'text-apple-blue',
          description: '列车始发站'
        };
      }
    }

    if (isLastStation) {
      return {
        color: 'bg-apple-blue border-apple-blue/30',
        status: '终点站',
        textColor: 'text-apple-blue',
        description: '列车终点站'
      };
    }

    return {
      color: 'bg-white border-2 border-gray-300',
      status: '未到达',
      textColor: 'text-gray-500',
      description: '列车尚未到达'
    };
  };

  const parsedStops = trainDetail 
    ? parseStopTimes(trainDetail.停站信息, trainDetail.出发日期)
    : [];

  const now = new Date();

  const getTrainOverview = () => {
    if (parsedStops.length === 0) return null;

    const firstStop = parsedStops[0];
    const lastStop = parsedStops[parsedStops.length - 1];

    if (now < firstStop.departureDate) {
      const diffMs = firstStop.departureDate.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        status: '未发车',
        color: 'bg-blue-100 text-blue-700',
        message: diffHours > 0 
          ? `距离发车还有 ${diffHours}小时${diffMins}分钟`
          : `距离发车还有 ${diffMins}分钟`
      };
    }

    if (now >= lastStop.arrivalDate) {
      return {
        status: '已到达',
        color: 'bg-green-100 text-green-700',
        message: '列车已到达终点站'
      };
    }

    for (let i = 0; i < parsedStops.length; i++) {
      const stop = parsedStops[i];
      
      if (now >= stop.arrivalDate && now <= stop.departureDate) {
        return {
          status: '停靠中',
          color: 'bg-green-100 text-green-700',
          message: `正在 ${stop.stop.站点} 停靠`
        };
      }

      if (i < parsedStops.length - 1) {
        const nextStop = parsedStops[i + 1];
        if (now > stop.departureDate && now < nextStop.arrivalDate) {
          return {
            status: '运行中',
            color: 'bg-orange-100 text-orange-700',
            message: `正在前往 ${nextStop.stop.站点}`
          };
        }
      }
    }

    return {
      status: '运行中',
      color: 'bg-orange-100 text-orange-700',
      message: '列车运行中'
    };
  };

  const trainOverview = getTrainOverview();

  // 计算运行时长
  const calculateDuration = () => {
    if (!trainDetail) return '';
    const [startH, startM] = trainDetail.开车时间.split(':').map(Number);
    const [endH, endM] = trainDetail.到达时间.split(':').map(Number);
    
    let totalMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMins < 0) totalMins += 24 * 60;
    
    // 如果有跨多天的情况，需要根据停站信息计算
    if (parsedStops.length > 0) {
      const firstStop = parsedStops[0];
      const lastStop = parsedStops[parsedStops.length - 1];
      const diffMs = lastStop.arrivalDate.getTime() - firstStop.departureDate.getTime();
      totalMins = Math.floor(diffMs / (1000 * 60));
    }
    
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  // 技术参数信息
  const technicalInfo = trainDetail ? [
    { 
      icon: <TbRulerMeasure className="text-xl" />, 
      label: '车辆全长', 
      value: trainDetail.车辆全长,
      show: !!trainDetail.车辆全长
    },
    { 
      icon: <IoSpeedometerOutline className="text-xl" />, 
      label: '最高速度', 
      value: trainDetail.最高速度,
      show: !!trainDetail.最高速度
    },
    { 
      icon: <FiLayers className="text-xl" />, 
      label: '编组', 
      value: trainDetail.编组 ? `${trainDetail.编组}编组` : undefined,
      show: !!trainDetail.编组
    },
    { 
      icon: <FiBox className="text-xl" />, 
      label: '车辆组成', 
      value: trainDetail.车辆组成,
      show: !!trainDetail.车辆组成
    },
    { 
      icon: <MdOutlineEventSeat className="text-xl" />, 
      label: '定员', 
      value: trainDetail.定员,
      show: !!trainDetail.定员
    },
    { 
      icon: <MdOutlineRestaurant className="text-xl" />, 
      label: '餐车', 
      value: trainDetail.餐车 ? `${trainDetail.餐车}` : undefined,
      show: !!trainDetail.餐车
    },
  ].filter(item => item.show) : [];

  return (
    <div className="min-h-screen relative">
      {/* 背景图片 */}
      {/* <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://cf-r2.zyhorg.ac.cn/images/1765074023725-amq4ak-hexiehaozhengmian.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
      </div> */}

      {/* 内容区域 */}
      <div className="relative z-10 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-apple-dark mb-3 sm:mb-4">
              车次查询
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              输入车次号，查询列车详细信息
            </p>
          </div>

          {/* 搜索框 */}
          <div className="flex items-center max-w-xl mx-auto mb-8 sm:mb-12">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="输入车次号，如：G1、D2、K3..."
                className="
                  w-full h-12 sm:h-14 pl-12 pr-4
                  bg-white/95 backdrop-blur rounded-l-xl sm:rounded-l-2xl
                  border border-r-0 border-gray-200
                  text-apple-dark text-base sm:text-lg
                  placeholder:text-gray-400
                  focus:outline-none focus:border-apple-blue
                  shadow-lg
                "
              />
            </div>
            <button
              onClick={handleSearch}
              className="
                h-12 sm:h-14 px-5 sm:px-8
                bg-apple-blue text-white
                rounded-r-xl sm:rounded-r-2xl
                font-medium text-base sm:text-lg
                hover:bg-blue-600
                transition-colors
                shadow-lg
              "
            >
              查询
            </button>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-lg">
              <Loading text="正在查询车次信息..." />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-center py-12 bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl shadow-lg">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {/* 车次详情 */}
          {!loading && !error && trainDetail && (
            <div className="space-y-4 sm:space-y-6">
              {/* 基本信息卡片 */}
              <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
                {/* 运行状态概览 */}
                {trainOverview && (
                  <div className={`mb-5 sm:mb-6 px-4 py-3 rounded-xl ${trainOverview.color} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">{trainOverview.status}</span>
                      <span className="text-sm opacity-80">{trainOverview.message}</span>
                    </div>
                    <span className="text-xs opacity-60">
                      更新于 {now.toLocaleTimeString('zh-CN', { hour12: false })}
                    </span>
                  </div>
                )}

                {/* 车次主信息 */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                  {/* 左侧：车次号和路线 */}
                  <div className="flex items-center space-x-4">
                    <div className={`
                      w-16 h-16 sm:w-20 sm:h-20 ${getTrainTypeColor(trainDetail.车次)}
                      rounded-xl sm:rounded-2xl flex flex-col items-center justify-center
                      text-white shadow-lg
                    `}>
                      <span className="text-lg sm:text-2xl font-bold">{trainDetail.车次}</span>
                      <span className="text-xs opacity-80">{getTrainTypeName(trainDetail.车次).slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        {trainDetail.出发日期}
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-2xl font-bold text-apple-dark">
                        <span>{trainDetail.始发站}</span>
                        <FiArrowRight className="text-gray-400 flex-shrink-0" />
                        <span>{trainDetail.终到站}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {getTrainTypeName(trainDetail.车次)} · 全程约 {calculateDuration()}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：时间信息 */}
                  <div className="flex items-center justify-center space-x-6 sm:space-x-8 bg-gray-50 rounded-xl px-6 py-4">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-apple-dark">
                        {trainDetail.开车时间}
                      </div>
                      <div className="text-sm text-gray-500">出发</div>
                    </div>
                    <div className="flex flex-col items-center text-gray-300">
                      <div className="text-xs text-gray-400 mb-1">{calculateDuration()}</div>
                      <div className="w-16 sm:w-20 h-0.5 bg-gray-300 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{trainDetail.停站信息.length} 站</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-apple-dark">
                        {trainDetail.到达时间}
                      </div>
                      <div className="text-sm text-gray-500">到达</div>
                    </div>
                  </div>
                </div>

                {/* 担当信息 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3">
                    <FiUsers className="text-apple-blue text-xl flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">客运担当</div>
                      <div className="font-medium truncate">{trainDetail.客运担当}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3">
                    <IoTrainSharp className="text-apple-blue text-xl flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">车底类型</div>
                      <div className="font-medium truncate">{trainDetail.车底类型}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3">
                    <FiMapPin className="text-apple-blue text-xl flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">车底配属</div>
                      <div className="font-medium truncate">{trainDetail.车底配属}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 技术参数卡片 */}
              {technicalInfo.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-apple-dark flex items-center space-x-2">
                      <FiInfo className="text-apple-blue" />
                      <span>技术参数</span>
                    </h2>
                    <button
                      onClick={() => setShowAllInfo(!showAllInfo)}
                      className="text-sm text-apple-blue hover:underline"
                    >
                      {showAllInfo ? '收起' : '展开全部'}
                    </button>
                  </div>

                  <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${!showAllInfo && technicalInfo.length > 6 ? 'max-h-24 overflow-hidden' : ''}`}>
                    {technicalInfo.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 text-center hover:shadow-md transition-shadow"
                      >
                        <div className="text-apple-blue mb-2 flex justify-center">
                          {item.icon}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                        <div className="font-semibold text-apple-dark text-sm sm:text-base truncate">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 状态图例 */}
              <div className="bg-white/95 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600">已过站</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">当前站</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-apple-blue"></div>
                    <span className="text-gray-600">即将到达</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">即将发车</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">晚点</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white border-2 border-gray-300"></div>
                    <span className="text-gray-600">未到达</span>
                  </div>
                </div>
              </div>

              {/* 停站信息 */}
              <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold text-apple-dark mb-5 sm:mb-6 flex items-center space-x-2">
                  <FiClock className="text-apple-blue" />
                  <span>停站信息</span>
                  <span className="text-sm font-normal text-gray-500">
                    共 {trainDetail.停站信息.length} 站
                  </span>
                </h2>
              {/* 跨天提示 */}
              {parsedStops.length > 0 && 
                parsedStops[parsedStops.length - 1].arrivalDate.getDate() !== new Date(trainDetail.出发日期).getDate() && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                  <p className="font-medium mb-1">🚄 跨天列车提示</p>
                  <p>
                    本次列车为跨天运行，从 {trainDetail.出发日期} 出发，
                    预计 {parsedStops[parsedStops.length - 1].arrivalDate.toLocaleDateString('zh-CN')} 到达终点站。
                  </p>
                </div>
              )}
                <div className="relative">
                  {/* 时间线 */}
                  <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
{/* 时间线 */}
{/* <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 timeline-line-animated"></div> */}
                  <div className="space-y-0">
                    {parsedStops.map((parsedStop, index) => {
                      const { stop, arrivalDate } = parsedStop;
                      const stopStatus = getStopStatus(index, parsedStops, now);
                      
                      const showDate = arrivalDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                      const baseDate = new Date(trainDetail.出发日期).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                      const isDifferentDay = showDate !== baseDate;
                      const dayDiff = Math.floor((arrivalDate.getTime() - new Date(trainDetail.出发日期).getTime()) / (24 * 60 * 60 * 1000));
                      
                      return (
                        <div
                          key={index}
                          className="relative flex items-start pl-12 sm:pl-16 py-3 sm:py-4 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          {/* 站点标记 */}
                          <div 
                            className={`absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 rounded-full ${stopStatus.color}`}
                            title={stopStatus.description}
                          ></div>

                          {/* 站点信息 */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4">
                            <div className="col-span-2 sm:col-span-1">
                              <div className="font-semibold text-apple-dark flex items-center flex-wrap gap-1 sm:gap-2">
                                <span className="text-sm sm:text-base">{stop.站点}</span>
                                {isDifferentDay && dayDiff > 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                                    +{dayDiff}天
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${stopStatus.textColor}`}>
                                {stopStatus.status}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">到达</div>
                              <div className="font-medium text-sm sm:text-base">{stop.到达时间}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">发车</div>
                              <div className="font-medium text-sm sm:text-base">{stop.发车时间}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">停留</div>
                              <div className="font-medium text-sm sm:text-base">{stop.停留时间}</div>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <div className="text-xs text-gray-500">出站口</div>
                              <div className="font-medium text-xs sm:text-sm text-gray-700">
                                {stop.exit === '--' ? '—' : stop.exit}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* 空状态 */}
          {!loading && !error && !trainDetail && (
            <div className="text-center py-16 sm:py-20 bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl shadow-lg">
              <IoTrainSharp className="text-5xl sm:text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg">
                请输入车次号开始查询
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainSearch;