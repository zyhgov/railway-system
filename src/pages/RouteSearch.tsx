import React, { useState, useCallback, useRef } from 'react';
import { FiMapPin, FiArrowRight, FiSearch, FiAlertCircle, FiX, FiExternalLink, FiClock, FiUsers } from 'react-icons/fi';
import { IoTrainSharp } from 'react-icons/io5';
import Loading from '../components/common/Loading';
import { useStations } from '../hooks/useStations';
import { getStationInfo, getTrainInfo } from '../services/api';
import type { TrainDetail, StopInfo } from '../types';

// 搜索类型
type SearchMode = 'direct' | 'transfer' | 'all';

// 直达车次结果
interface DirectTrain {
  type: 'direct';
  trainNo: string;
  trainType: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  departureIndex: number;
  arrivalIndex: number;
  totalStops: number;
  trainDetail: TrainDetail;
}

// 中转车次结果
interface TransferTrain {
  type: 'transfer';
  firstTrain: {
    trainNo: string;
    trainType: string;
    departureStation: string;
    arrivalStation: string;
    departureTime: string;
    arrivalTime: string;
    trainDetail: TrainDetail;
  };
  secondTrain: {
    trainNo: string;
    trainType: string;
    departureStation: string;
    arrivalStation: string;
    departureTime: string;
    arrivalTime: string;
    trainDetail: TrainDetail;
  };
  transferStation: string;
  waitTime: string;
  totalDuration: string;
}

type SearchResult = DirectTrain | TransferTrain;

const RouteSearch: React.FC = () => {
  const { searchStations } = useStations();
  
  // 出发站
  const [fromStation, setFromStation] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  
  // 终点站
  const [toStation, setToStation] = useState('');
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  // 搜索模式
  const [searchMode, setSearchMode] = useState<SearchMode>('all');
  
  // 结果
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 详情弹窗
  const [selectedTrain, setSelectedTrain] = useState<TrainDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // 取消搜索
  const abortControllerRef = useRef<AbortController | null>(null);

  // 搜索出发站
  const handleFromSearch = useCallback((value: string) => {
    setFromStation(value);
    if (value.trim()) {
      const results = searchStations(value);
      setFromSuggestions(results);
      setShowFromSuggestions(true);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  }, [searchStations]);

  // 搜索终点站
  const handleToSearch = useCallback((value: string) => {
    setToStation(value);
    if (value.trim()) {
      const results = searchStations(value);
      setToSuggestions(results);
      setShowToSuggestions(true);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  }, [searchStations]);

  // 选择出发站
  const handleSelectFromStation = (station: string) => {
    setFromStation(station);
    setShowFromSuggestions(false);
  };

  // 选择终点站
  const handleSelectToStation = (station: string) => {
    setToStation(station);
    setShowToSuggestions(false);
  };

  // 交换出发站和终点站
  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  // 计算时长
  const calculateDuration = (departureTime: string, arrivalTime: string): string => {
    const [depHour, depMin] = departureTime.split(':').map(Number);
    const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
    
    let totalMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}时${minutes > 0 ? minutes + '分' : ''}`;
    }
    return `${minutes}分`;
  };

  // 计算等待时间
  const calculateWaitTime = (arrivalTime: string, departureTime: string): { waitTime: string; minutes: number } => {
    const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
    const [depHour, depMin] = departureTime.split(':').map(Number);
    
    let totalMinutes = (depHour * 60 + depMin) - (arrHour * 60 + arrMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let waitTime = '';
    if (hours > 0) {
      waitTime = `${hours}时${minutes > 0 ? minutes + '分' : ''}`;
    } else {
      waitTime = `${minutes}分`;
    }
    
    return { waitTime, minutes: totalMinutes };
  };

  // 获取车次类型
  const getTrainType = (trainNo: string): string => {
    if (trainNo.startsWith('G')) return '高铁';
    if (trainNo.startsWith('D')) return '动车';
    if (trainNo.startsWith('C')) return '城际';
    if (trainNo.startsWith('Z')) return '直达';
    if (trainNo.startsWith('T')) return '特快';
    if (trainNo.startsWith('K')) return '快速';
    return '普通';
  };

  // 获取车次类型颜色
  const getTrainTypeColor = (trainNo: string) => {
    if (trainNo.startsWith('G')) return 'bg-apple-blue';
    if (trainNo.startsWith('D')) return 'bg-green-500';
    if (trainNo.startsWith('C')) return 'bg-purple-500';
    if (trainNo.startsWith('Z')) return 'bg-red-500';
    if (trainNo.startsWith('T')) return 'bg-orange-500';
    if (trainNo.startsWith('K')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // 匹配站点名称
  const matchStation = (stopName: string, searchName: string): boolean => {
    return stopName === searchName || 
           stopName.includes(searchName) || 
           searchName.includes(stopName);
  };

  // 停止搜索
  const handleStopSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  };

  // 查询路线
// 查询路线
const handleSearch = async () => {
  if (!fromStation.trim() || !toStation.trim()) {
    setError('请输入出发站和终点站');
    return;
  }

  if (fromStation === toStation) {
    setError('出发站和终点站不能相同');
    return;
  }

  // 创建新的 AbortController
  abortControllerRef.current = new AbortController();

  // 保存当前搜索模式，避免闭包问题
  const currentSearchMode = searchMode;

  setLoading(true);
  setError(null);
  setSearched(true);
  setResults([]);
  setProgress({ current: 0, total: 0, phase: '获取列车信息...' });

  try {
    // 1. 获取出发站的所有列车
    const stationResponse = await getStationInfo(fromStation);
    const trains = stationResponse.data;
    
    if (trains.length === 0) {
      setError(`未找到从 ${fromStation} 出发的列车`);
      setLoading(false);
      return;
    }

    // 2. 去重车次
    const uniqueTrainNos = [...new Set(trains.map(t => t[0]))];
    setProgress({ current: 0, total: uniqueTrainNos.length, phase: '搜索直达车次...' });

    // 存储中间站点用于中转搜索
    const transferStations: Map<string, { trainNo: string; detail: TrainDetail; stopIndex: number }[]> = new Map();

    // 是否搜索直达
    const shouldSearchDirect = currentSearchMode === 'direct' || currentSearchMode === 'all';
    // 是否搜索中转
    const shouldSearchTransfer = currentSearchMode === 'transfer' || currentSearchMode === 'all';

    // 3. 搜索直达车次
    for (let i = 0; i < uniqueTrainNos.length; i++) {
      // 检查是否取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const trainNo = uniqueTrainNos[i];
      setProgress({ current: i + 1, total: uniqueTrainNos.length, phase: `搜索: ${trainNo}` });

      try {
        const trainDetail = await getTrainInfo(trainNo);
        const stops = trainDetail.停站信息;

        const departureIndex = stops.findIndex(stop => matchStation(stop.站点, fromStation));
        const arrivalIndex = stops.findIndex(stop => matchStation(stop.站点, toStation));

        // 直达车次
        if (shouldSearchDirect && departureIndex !== -1 && arrivalIndex !== -1 && departureIndex < arrivalIndex) {
          const departureStop = stops[departureIndex];
          const arrivalStop = stops[arrivalIndex];

          const newResult: DirectTrain = {
            type: 'direct',
            trainNo,
            trainType: getTrainType(trainNo),
            departureStation: departureStop.站点,
            arrivalStation: arrivalStop.站点,
            departureTime: departureStop.发车时间,
            arrivalTime: arrivalStop.到达时间,
            duration: calculateDuration(departureStop.发车时间, arrivalStop.到达时间),
            departureIndex,
            arrivalIndex,
            totalStops: arrivalIndex - departureIndex,
            trainDetail,
          };

          // 实时添加结果
          setResults(prev => {
            const updated = [...prev, newResult];
            return updated.sort((a, b) => {
              const timeA = a.type === 'direct' ? a.departureTime : a.firstTrain.departureTime;
              const timeB = b.type === 'direct' ? b.departureTime : b.firstTrain.departureTime;
              return timeA.localeCompare(timeB);
            });
          });
        }

        // 收集中转站点信息（用于后续中转搜索）
        if (shouldSearchTransfer && departureIndex !== -1) {
          for (let j = departureIndex + 1; j < stops.length; j++) {
            const stopName = stops[j].站点;
            if (!matchStation(stopName, toStation)) {
              if (!transferStations.has(stopName)) {
                transferStations.set(stopName, []);
              }
              transferStations.get(stopName)!.push({ trainNo, detail: trainDetail, stopIndex: j });
            }
          }
        }

      } catch (err) {
        console.error(`查询车次 ${trainNo} 失败:`, err);
      }

      // 添加小延迟
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 4. 搜索中转车次
    if (shouldSearchTransfer) {
      const transferStationsList = Array.from(transferStations.keys());
      setProgress({ current: 0, total: transferStationsList.length, phase: '搜索中转方案...' });

      for (let i = 0; i < transferStationsList.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const transferStation = transferStationsList[i];
        setProgress({ current: i + 1, total: transferStationsList.length, phase: `搜索中转: ${transferStation}` });

        try {
          // 获取中转站的列车
          const transferResponse = await getStationInfo(transferStation);
          const transferTrains = transferResponse.data;
          const uniqueTransferTrainNos = [...new Set(transferTrains.map(t => t[0]))];

          // 检查每趟从中转站出发的列车
          for (const secondTrainNo of uniqueTransferTrainNos) {
            if (abortControllerRef.current?.signal.aborted) {
              return;
            }

            try {
              const secondTrainDetail = await getTrainInfo(secondTrainNo);
              const secondStops = secondTrainDetail.停站信息;

              const secondDepartureIndex = secondStops.findIndex(stop => matchStation(stop.站点, transferStation));
              const secondArrivalIndex = secondStops.findIndex(stop => matchStation(stop.站点, toStation));

              if (secondDepartureIndex !== -1 && secondArrivalIndex !== -1 && secondDepartureIndex < secondArrivalIndex) {
                // 找到可以到达终点站的第二程列车
                const firstTrainInfos = transferStations.get(transferStation) || [];

                for (const firstTrainInfo of firstTrainInfos) {
                  const firstStops = firstTrainInfo.detail.停站信息;
                  const firstDepartureIndex = firstStops.findIndex(stop => matchStation(stop.站点, fromStation));
                  
                  if (firstDepartureIndex !== -1 && firstDepartureIndex < firstTrainInfo.stopIndex) {
                    const firstDepartureStop = firstStops[firstDepartureIndex];
                    const firstArrivalStop = firstStops[firstTrainInfo.stopIndex];
                    const secondDepartureStop = secondStops[secondDepartureIndex];
                    const secondArrivalStop = secondStops[secondArrivalIndex];

                    // 计算等待时间（确保有足够的换乘时间）
                    const { waitTime, minutes } = calculateWaitTime(
                      firstArrivalStop.到达时间,
                      secondDepartureStop.发车时间
                    );

                    // 等待时间在20分钟到4小时之间才算合理的中转
                    if (minutes >= 20 && minutes <= 240) {
                      const totalDuration = calculateDuration(
                        firstDepartureStop.发车时间,
                        secondArrivalStop.到达时间
                      );

                      const newResult: TransferTrain = {
                        type: 'transfer',
                        firstTrain: {
                          trainNo: firstTrainInfo.trainNo,
                          trainType: getTrainType(firstTrainInfo.trainNo),
                          departureStation: firstDepartureStop.站点,
                          arrivalStation: firstArrivalStop.站点,
                          departureTime: firstDepartureStop.发车时间,
                          arrivalTime: firstArrivalStop.到达时间,
                          trainDetail: firstTrainInfo.detail,
                        },
                        secondTrain: {
                          trainNo: secondTrainNo,
                          trainType: getTrainType(secondTrainNo),
                          departureStation: secondDepartureStop.站点,
                          arrivalStation: secondArrivalStop.站点,
                          departureTime: secondDepartureStop.发车时间,
                          arrivalTime: secondArrivalStop.到达时间,
                          trainDetail: secondTrainDetail,
                        },
                        transferStation,
                        waitTime,
                        totalDuration,
                      };

                      // 检查是否已存在相同的中转方案
                      setResults(prev => {
                        const isDuplicate = prev.some(r => 
                          r.type === 'transfer' &&
                          r.firstTrain.trainNo === newResult.firstTrain.trainNo &&
                          r.secondTrain.trainNo === newResult.secondTrain.trainNo
                        );

                        if (isDuplicate) return prev;

                        const updated = [...prev, newResult];
                        return updated.sort((a, b) => {
                          const timeA = a.type === 'direct' ? a.departureTime : a.firstTrain.departureTime;
                          const timeB = b.type === 'direct' ? b.departureTime : b.firstTrain.departureTime;
                          return timeA.localeCompare(timeB);
                        });
                      });
                    }
                  }
                }
              }
            } catch (err) {
              // 忽略单个车次查询失败
            }
          }
        } catch (err) {
          // 忽略单个中转站查询失败
        }

        // 限制中转搜索的站点数量，避免搜索时间过长
        if (i >= 10) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setProgress({ current: 0, total: 0, phase: '搜索完成' });

  } catch (err) {
    console.error('查询失败:', err);
    setError('查询失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};

  // 打开详情弹窗
  const handleOpenModal = (trainDetail: TrainDetail) => {
    setSelectedTrain(trainDetail);
    setShowModal(true);
  };

  // 关闭详情弹窗
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTrain(null);
  };

  // 新窗口打开
  const handleOpenNewWindow = (trainNo: string) => {
    window.open(`/train/${trainNo}`, '_blank');
  };

  // 获取站点状态
  const getStopStatus = (stop: StopInfo, index: number, stops: StopInfo[], trainDetail: TrainDetail) => {
    const now = new Date();
    const today = trainDetail.出发日期 || '';
    
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(today);
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const arrivalTime = parseTime(stop.到达时间);
    const departureTime = parseTime(stop.发车时间);
    
    const isFirstStation = index === 0;
    const isLastStation = index === stops.length - 1;
    
    if (now > departureTime && !isLastStation) {
      return { color: 'bg-gray-400', status: '已过站' };
    }
    
    if (now >= arrivalTime && now <= departureTime) {
      return { color: 'bg-green-500', status: '当前站' };
    }
    
    if (isLastStation && now >= arrivalTime) {
      return { color: 'bg-green-500', status: '已到达' };
    }
    
    if (isFirstStation || isLastStation) {
      return { color: 'bg-apple-blue', status: isFirstStation ? '始发站' : '终点站' };
    }
    
    return { color: 'bg-white border-2 border-apple-blue', status: '未到达' };
  };

  // 直达车次数量
  const directCount = results.filter(r => r.type === 'direct').length;
  // 中转车次数量
  const transferCount = results.filter(r => r.type === 'transfer').length;

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
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-apple-dark mb-4">
              路线查询
            </h1>
            <p className="text-gray-600 text-lg">
              输入出发站和终点站，为您推荐最佳车次
            </p>
          </div>

          {/* 搜索表单 */}
          <div className="bg-white/95 backdrop-blur rounded-3xl p-6 shadow-lg mb-6">
            {/* 搜索模式选择 */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="text-sm text-gray-500">搜索模式：</span>
              <div className="flex bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setSearchMode('direct')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    searchMode === 'direct' 
                      ? 'bg-apple-blue text-white' 
                      : 'text-gray-600 hover:text-apple-dark'
                  }`}
                >
                  仅直达
                </button>
                <button
                  onClick={() => setSearchMode('transfer')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    searchMode === 'transfer' 
                      ? 'bg-apple-blue text-white' 
                      : 'text-gray-600 hover:text-apple-dark'
                  }`}
                >
                  仅中转
                </button>
                <button
                  onClick={() => setSearchMode('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    searchMode === 'all' 
                      ? 'bg-apple-blue text-white' 
                      : 'text-gray-600 hover:text-apple-dark'
                  }`}
                >
                  直达+中转
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* 出发站 */}
              <div className="flex-1 w-full relative">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  出发站
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 text-xl" />
                  <input
                    type="text"
                    value={fromStation}
                    onChange={(e) => handleFromSearch(e.target.value)}
                    onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                    placeholder="请输入出发站"
                    className="
                      w-full h-14 pl-12 pr-4
                      bg-gray-50 rounded-xl
                      border border-gray-200
                      text-apple-dark text-lg
                      placeholder:text-gray-400
                      focus:outline-none focus:border-apple-blue focus:bg-white
                    "
                  />
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100 max-h-60 overflow-y-auto">
                      {fromSuggestions.map((station, index) => (
                        <button
                          key={index}
                          onMouseDown={() => handleSelectFromStation(station)}
                          className="w-full px-4 py-3 text-left text-apple-dark hover:bg-apple-gray transition-colors"
                        >
                          {station}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 交换按钮 */}
              <button
                onClick={handleSwapStations}
                className="
                  w-12 h-12 mt-6
                  bg-apple-gray hover:bg-gray-200
                  rounded-full
                  flex items-center justify-center
                  transition-colors
                  flex-shrink-0
                "
                title="交换出发站和终点站"
              >
                <FiArrowRight className="text-apple-dark text-xl rotate-90 md:rotate-0" />
              </button>

              {/* 终点站 */}
              <div className="flex-1 w-full relative">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  终点站
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-xl" />
                  <input
                    type="text"
                    value={toStation}
                    onChange={(e) => handleToSearch(e.target.value)}
                    onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                    placeholder="请输入终点站"
                    className="
                      w-full h-14 pl-12 pr-4
                      bg-gray-50 rounded-xl
                      border border-gray-200
                      text-apple-dark text-lg
                      placeholder:text-gray-400
                      focus:outline-none focus:border-apple-blue focus:bg-white
                    "
                  />
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100 max-h-60 overflow-y-auto">
                      {toSuggestions.map((station, index) => (
                        <button
                          key={index}
                          onMouseDown={() => handleSelectToStation(station)}
                          className="w-full px-4 py-3 text-left text-apple-dark hover:bg-apple-gray transition-colors"
                        >
                          {station}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 查询按钮 */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSearch}
                disabled={loading || !fromStation.trim() || !toStation.trim()}
                className="
                  flex-1 h-14
                  bg-apple-blue text-white
                  rounded-xl font-medium text-lg
                  hover:bg-blue-600 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center space-x-2
                "
              >
                <FiSearch className="text-xl" />
                <span>{loading ? '查询中...' : '查询车次'}</span>
              </button>
              
              {loading && (
                <button
                  onClick={handleStopSearch}
                  className="
                    h-14 px-6
                    bg-red-500 text-white
                    rounded-xl font-medium
                    hover:bg-red-600 transition-colors
                    flex items-center justify-center space-x-2
                  "
                >
                  <FiX className="text-xl" />
                  <span>停止</span>
                </button>
              )}
            </div>
          </div>

          {/* 加载进度 */}
          {loading && (
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{progress.phase}</span>
                <span className="text-sm text-gray-500">
                  {progress.total > 0 ? `${progress.current}/${progress.total}` : ''}
                </span>
              </div>
              {progress.total > 0 && (
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-apple-blue transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* 结果统计 */}
          {searched && results.length > 0 && (
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-apple-dark">
                  搜索结果
                </span>
                <div className="flex items-center space-x-2 text-sm">
                  {directCount > 0 && (
                    <span className="px-3 py-1 bg-apple-blue/10 text-apple-blue rounded-full">
                      直达 {directCount}
                    </span>
                  )}
                  {transferCount > 0 && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full">
                      中转 {transferCount}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {fromStation} → {toStation}
              </span>
            </div>
          )}

          {/* 错误提示 */}
          {error && !loading && results.length === 0 && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-lg mb-6">
              <div className="flex items-center justify-center space-x-3 text-orange-500">
                <FiAlertCircle className="text-2xl" />
                <p className="text-lg">{error}</p>
              </div>
            </div>
          )}

          {/* 查询结果 */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow"
              >
                {result.type === 'direct' ? (
                  // 直达车次
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-xs font-medium rounded">
                        直达
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className={`
                          w-14 h-14 ${getTrainTypeColor(result.trainNo)}
                          rounded-xl flex flex-col items-center justify-center text-white
                        `}>
                          <span className="text-sm font-bold">{result.trainNo}</span>
                          <span className="text-xs opacity-80">{result.trainType}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-apple-dark">{result.departureTime}</div>
                            <div className="text-sm text-gray-500">{result.departureStation}</div>
                          </div>

                          <div className="flex flex-col items-center px-2">
                            <div className="text-xs text-gray-400">{result.duration}</div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <div className="w-12 h-0.5 bg-gray-300"></div>
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                            <div className="text-xs text-gray-400">{result.totalStops}站</div>
                          </div>

                          <div className="text-center">
                            <div className="text-xl font-bold text-apple-dark">{result.arrivalTime}</div>
                            <div className="text-sm text-gray-500">{result.arrivalStation}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(result.trainDetail)}
                          className="px-4 py-2 text-apple-blue hover:bg-apple-blue/10 rounded-lg transition-colors text-sm font-medium"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => handleOpenNewWindow(result.trainNo)}
                          className="p-2 text-gray-400 hover:text-apple-blue hover:bg-apple-blue/10 rounded-lg transition-colors"
                          title="新窗口打开"
                        >
                          <FiExternalLink />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 中转车次
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded">
                        中转
                      </span>
                      <span className="text-xs text-gray-500">
                        在 <span className="font-medium text-apple-dark">{result.transferStation}</span> 换乘
                      </span>
                      <span className="text-xs text-gray-400">
                        等待 {result.waitTime}
                      </span>
                    </div>

                    {/* 第一程 */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 pb-3 border-b border-dashed border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-12 h-12 ${getTrainTypeColor(result.firstTrain.trainNo)}
                          rounded-lg flex flex-col items-center justify-center text-white
                        `}>
                          <span className="text-xs font-bold">{result.firstTrain.trainNo}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-apple-dark">{result.firstTrain.departureTime}</div>
                            <div className="text-xs text-gray-500">{result.firstTrain.departureStation}</div>
                          </div>
                          <FiArrowRight className="text-gray-400" />
                          <div className="text-center">
                            <div className="text-lg font-bold text-apple-dark">{result.firstTrain.arrivalTime}</div>
                            <div className="text-xs text-gray-500">{result.firstTrain.arrivalStation}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenModal(result.firstTrain.trainDetail)}
                          className="px-3 py-1 text-apple-blue hover:bg-apple-blue/10 rounded text-xs"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => handleOpenNewWindow(result.firstTrain.trainNo)}
                          className="p-1 text-gray-400 hover:text-apple-blue rounded"
                        >
                          <FiExternalLink className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* 第二程 */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-12 h-12 ${getTrainTypeColor(result.secondTrain.trainNo)}
                          rounded-lg flex flex-col items-center justify-center text-white
                        `}>
                          <span className="text-xs font-bold">{result.secondTrain.trainNo}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-apple-dark">{result.secondTrain.departureTime}</div>
                            <div className="text-xs text-gray-500">{result.secondTrain.departureStation}</div>
                          </div>
                          <FiArrowRight className="text-gray-400" />
                          <div className="text-center">
                            <div className="text-lg font-bold text-apple-dark">{result.secondTrain.arrivalTime}</div>
                            <div className="text-xs text-gray-500">{result.secondTrain.arrivalStation}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenModal(result.secondTrain.trainDetail)}
                          className="px-3 py-1 text-apple-blue hover:bg-apple-blue/10 rounded text-xs"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => handleOpenNewWindow(result.secondTrain.trainNo)}
                          className="p-1 text-gray-400 hover:text-apple-blue rounded"
                        >
                          <FiExternalLink className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* 总时长 */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-right">
                      <span className="text-sm text-gray-500">
                        全程约 <span className="font-medium text-apple-dark">{result.totalDuration}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 空状态 */}
          {!loading && searched && results.length === 0 && !error && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-12 shadow-lg text-center">
              <IoTrainSharp className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">未找到符合条件的列车</p>
              <p className="text-gray-400 text-sm mt-2">请尝试更换出发站或终点站</p>
            </div>
          )}

          {/* 初始状态 */}
          {!loading && !searched && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-12 shadow-lg text-center">
              <IoTrainSharp className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">请输入出发站和终点站开始查询</p>
            </div>
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      {showModal && selectedTrain && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`
                  w-14 h-14 ${getTrainTypeColor(selectedTrain.车次)}
                  rounded-xl flex items-center justify-center text-white text-lg font-bold
                `}>
                  {selectedTrain.车次}
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-xl font-bold text-apple-dark">
                    <span>{selectedTrain.始发站}</span>
                    <FiArrowRight className="text-gray-400" />
                    <span>{selectedTrain.终到站}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedTrain.出发日期} | {selectedTrain.开车时间} - {selectedTrain.到达时间}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenNewWindow(selectedTrain.车次)}
                  className="p-2 text-gray-400 hover:text-apple-blue hover:bg-apple-blue/10 rounded-lg transition-colors"
                  title="新窗口打开"
                >
                  <FiExternalLink className="text-xl" />
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FiUsers className="text-apple-blue" />
                  <span className="text-gray-500">客运担当：</span>
                  <span className="font-medium">{selectedTrain.客运担当}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <IoTrainSharp className="text-apple-blue" />
                  <span className="text-gray-500">车底类型：</span>
                  <span className="font-medium">{selectedTrain.车底类型}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiMapPin className="text-apple-blue" />
                  <span className="text-gray-500">车底配属：</span>
                  <span className="font-medium">{selectedTrain.车底配属}</span>
                </div>
              </div>
            </div>

            {/* 停站列表 */}
            <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
              <h3 className="text-lg font-semibold text-apple-dark mb-4 flex items-center space-x-2">
                <FiClock className="text-apple-blue" />
                <span>停站信息</span>
                <span className="text-sm font-normal text-gray-500">
                  共 {selectedTrain.停站信息.length} 站
                </span>
              </h3>

              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {selectedTrain.停站信息.map((stop, index) => {
                  const status = getStopStatus(stop, index, selectedTrain.停站信息, selectedTrain);
                  return (
                    <div
                      key={index}
                      className="relative flex items-start pl-14 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className={`absolute left-3 w-4 h-4 rounded-full ${status.color}`}></div>

                      <div className="flex-1 grid grid-cols-5 gap-2 text-sm">
                        <div>
                          <div className="font-semibold text-apple-dark">{stop.站点}</div>
                          <div className="text-xs text-gray-400">第{index + 1}站</div>
                        </div>
                        <div>
                          <div className="text-gray-500">到达</div>
                          <div className="font-medium">{stop.到达时间}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">发车</div>
                          <div className="font-medium">{stop.发车时间}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">停留</div>
                          <div className="font-medium">{stop.停留时间}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">出站口</div>
                          <div className="font-medium text-xs">{stop.exit === '--' ? '—' : stop.exit}</div>
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
    </div>
  );
};

export default RouteSearch;