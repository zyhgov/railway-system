import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiClock, FiMapPin, FiArrowRight, FiUsers } from 'react-icons/fi';
import { IoTrainSharp } from 'react-icons/io5';
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

  /**
   * 解析停站时间，考虑跨天情况
   * @param stops 所有停站信息
   * @param baseDate 列车出发日期
   * @returns 包含正确日期时间的停站信息
   */
  const parseStopTimes = (stops: StopInfo[], baseDate: string) => {
    const result: { stop: StopInfo; arrivalDate: Date; departureDate: Date }[] = [];
    
    // 解析基准日期
    const [year, month, day] = baseDate.split('-').map(Number);
    let currentDate = new Date(year, month - 1, day);
    let previousDepartureMinutes = -1;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      
      // 解析到达时间
      const [arrHour, arrMin] = stop.到达时间.split(':').map(Number);
      const arrivalMinutes = arrHour * 60 + arrMin;
      
      // 解析发车时间
      const [depHour, depMin] = stop.发车时间.split(':').map(Number);
      const departureMinutes = depHour * 60 + depMin;

      // 如果到达时间小于上一站的发车时间，说明跨天了
      if (i > 0 && arrivalMinutes < previousDepartureMinutes) {
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }

      // 创建到达时间
      const arrivalDate = new Date(currentDate);
      arrivalDate.setHours(arrHour, arrMin, 0, 0);

      // 如果发车时间小于到达时间（跨天），需要加一天
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
   * @param stopIndex 当前站点索引
   * @param parsedStops 解析后的停站信息
   * @param now 当前时间
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

    // 检查晚点
    if (stop.ticketDelay && parseInt(stop.ticketDelay) > 0) {
      return {
        color: 'bg-red-500 border-red-300',
        status: `晚点${stop.ticketDelay}分`,
        textColor: 'text-red-600',
        description: '列车晚点运行'
      };
    }

    // 已过站：当前时间已经超过该站发车时间（非终点站）
    if (!isLastStation && now > departureDate) {
      return {
        color: 'bg-gray-400 border-gray-300',
        status: '已过站',
        textColor: 'text-gray-500',
        description: '列车已驶离该站'
      };
    }

    // 终点站已到达
    if (isLastStation && now >= arrivalDate) {
      return {
        color: 'bg-green-500 border-green-300',
        status: '已到达',
        textColor: 'text-green-600',
        description: '列车已到达终点站'
      };
    }

    // 当前站：已到达但未发车
    if (now >= arrivalDate && now <= departureDate) {
      return {
        color: 'bg-green-500 border-green-300 animate-pulse',
        status: '当前站',
        textColor: 'text-green-600',
        description: '列车正在该站停靠'
      };
    }

    // 即将到达：距离到达时间30分钟内
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

    // 始发站或终点站的默认样式
    if (isFirstStation) {
      // 始发站：检查是否即将发车（10分钟内）
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
      
      // 始发站还未到发车时间
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

    // 未到达
    return {
      color: 'bg-white border-2 border-gray-300',
      status: '未到达',
      textColor: 'text-gray-500',
      description: '列车尚未到达'
    };
  };

  // 计算并缓存解析后的停站时间
  const parsedStops = trainDetail 
    ? parseStopTimes(trainDetail.停站信息, trainDetail.出发日期)
    : [];

  // 当前时间（用于状态判断）
  const now = new Date();

  // 计算列车运行状态概览
  const getTrainOverview = () => {
    if (parsedStops.length === 0) return null;

    const firstStop = parsedStops[0];
    const lastStop = parsedStops[parsedStops.length - 1];

    // 列车未发车
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

    // 列车已到达终点
    if (now >= lastStop.arrivalDate) {
      return {
        status: '已到达',
        color: 'bg-green-100 text-green-700',
        message: '列车已到达终点站'
      };
    }

    // 列车运行中，找出当前位置
    for (let i = 0; i < parsedStops.length; i++) {
      const stop = parsedStops[i];
      
      // 在某站停靠中
      if (now >= stop.arrivalDate && now <= stop.departureDate) {
        return {
          status: '停靠中',
          color: 'bg-green-100 text-green-700',
          message: `正在 ${stop.stop.站点} 停靠`
        };
      }

      // 在两站之间运行
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
      <div className="relative z-10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-apple-dark mb-4">
              车次查询
            </h1>
            <p className="text-gray-600 text-lg">
              输入车次号，查询列车详细信息
            </p>
          </div>

          {/* 搜索框 */}
          <div className="flex items-center max-w-xl mx-auto mb-12">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="输入车次号，如：G1、D2、K3..."
                className="
                  w-full h-14 pl-12 pr-4
                  bg-white/95 backdrop-blur rounded-l-2xl
                  border border-r-0 border-gray-200
                  text-apple-dark text-lg
                  placeholder:text-gray-400
                  focus:outline-none focus:border-apple-blue
                  shadow-lg
                "
              />
            </div>
            <button
              onClick={handleSearch}
              className="
                h-14 px-8
                bg-apple-blue text-white
                rounded-r-2xl
                font-medium text-lg
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
            <div className="bg-white/95 backdrop-blur rounded-3xl p-12 shadow-lg">
              <Loading text="正在查询车次信息..." />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-center py-12 bg-white/95 backdrop-blur rounded-3xl shadow-lg">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {/* 车次详情 */}
          {!loading && !error && trainDetail && (
            <div className="space-y-6">
              {/* 基本信息卡片 */}
              <div className="bg-white/95 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg">
                {/* 运行状态概览 */}
                {trainOverview && (
                  <div className={`mb-6 px-4 py-3 rounded-xl ${trainOverview.color} flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">{trainOverview.status}</span>
                      <span className="text-sm opacity-80">{trainOverview.message}</span>
                    </div>
                    <span className="text-xs opacity-60">
                      数据更新于 {now.toLocaleTimeString('zh-CN', { hour12: false })}
                    </span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                  {/* 车次号 */}
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className={`
                      w-20 h-20 ${getTrainTypeColor(trainDetail.车次)}
                      rounded-2xl flex items-center justify-center
                      text-white text-2xl font-bold shadow-lg
                    `}>
                      {trainDetail.车次}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        {trainDetail.出发日期}
                      </div>
                      <div className="flex items-center space-x-3 text-xl sm:text-2xl font-bold text-apple-dark">
                        <span>{trainDetail.始发站}</span>
                        <FiArrowRight className="text-gray-400" />
                        <span>{trainDetail.终到站}</span>
                      </div>
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex items-center space-x-6 sm:space-x-8">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-apple-dark">
                        {trainDetail.开车时间}
                      </div>
                      <div className="text-sm text-gray-500">出发</div>
                    </div>
                    <div className="text-gray-300 text-2xl">→</div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-apple-dark">
                        {trainDetail.到达时间}
                      </div>
                      <div className="text-sm text-gray-500">到达</div>
                    </div>
                  </div>
                </div>

                {/* 其他信息 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <FiUsers className="text-apple-blue text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">客运担当</div>
                      <div className="font-medium">{trainDetail.客运担当}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <IoTrainSharp className="text-apple-blue text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">车底类型</div>
                      <div className="font-medium">{trainDetail.车底类型}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiMapPin className="text-apple-blue text-xl" />
                    <div>
                      <div className="text-sm text-gray-500">车底配属</div>
                      <div className="font-medium">{trainDetail.车底配属}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 状态图例 */}
              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600">已过站</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">当前站/已到达</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-apple-blue"></div>
                    <span className="text-gray-600">即将到达</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">即将发车</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">晚点</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
                    <span className="text-gray-600">未到达</span>
                  </div>
                </div>
              </div>
              {/* 跨天提示 */}
              {parsedStops.length > 0 && 
                parsedStops[parsedStops.length - 1].arrivalDate.getDate() !== new Date(trainDetail.出发日期).getDate() && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                  <p className="font-medium mb-1">🚄 跨天列车提示</p>
                  <p>
                    本次列车为跨天运行，从 {trainDetail.出发日期} 出发，
                    预计 {parsedStops[parsedStops.length - 1].arrivalDate.toLocaleDateString('zh-CN')} 到达终点站。
                    停站状态已根据实际日期时间计算。
                  </p>
                </div>
              )}
              {/* 停站信息 */}
              <div className="bg-white/95 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-xl font-bold text-apple-dark mb-6 flex items-center space-x-2">
                  <FiClock className="text-apple-blue" />
                  <span>停站信息</span>
                  <span className="text-sm font-normal text-gray-500">
                    共 {trainDetail.停站信息.length} 站
                  </span>
                </h2>

                <div className="relative">
                  {/* 时间线 */}
                  <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  <div className="space-y-0">
                    {parsedStops.map((parsedStop, index) => {
                      const { stop, arrivalDate, departureDate } = parsedStop;
                      const stopStatus = getStopStatus(index, parsedStops, now);
                      
                      // 显示日期（如果与出发日期不同）
                      const showDate = arrivalDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                      const baseDate = new Date(trainDetail.出发日期).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                      const isDifferentDay = showDate !== baseDate;
                      
                      return (
                        <div
                          key={index}
                          className="relative flex items-start pl-14 sm:pl-16 py-4 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          {/* 站点标记 */}
                          <div 
                            className={`absolute left-3 sm:left-4 w-5 h-5 rounded-full ${stopStatus.color}`}
                            title={stopStatus.description}
                          ></div>

                          {/* 站点信息 */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4">
                            <div className="col-span-2 sm:col-span-1">
                              <div className="font-semibold text-apple-dark flex items-center space-x-2">
                                <span>{stop.站点}</span>
                                {isDifferentDay && (
                                  <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                                    +{Math.floor((arrivalDate.getTime() - new Date(trainDetail.出发日期).getTime()) / (24 * 60 * 60 * 1000))}天
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${stopStatus.textColor}`}>
                                {stopStatus.status}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500">到达</div>
                              <div className="font-medium text-sm sm:text-base">{stop.到达时间}</div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500">发车</div>
                              <div className="font-medium text-sm sm:text-base">{stop.发车时间}</div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-500">停留</div>
                              <div className="font-medium text-sm sm:text-base">{stop.停留时间}</div>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <div className="text-xs sm:text-sm text-gray-500">出站口</div>
                              <div className="font-medium text-xs sm:text-sm">
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
            <div className="text-center py-20 bg-white/95 backdrop-blur rounded-3xl shadow-lg">
              <IoTrainSharp className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
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