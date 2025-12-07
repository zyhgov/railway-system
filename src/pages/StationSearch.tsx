import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import SearchBox from '../components/common/SearchBox';
import TrainCard from '../components/common/TrainCard';
import Loading from '../components/common/Loading';
import { useStations } from '../hooks/useStations';
import { getStationInfo } from '../services/api';
import type { StationTrainInfo } from '../types';

const StationSearch: React.FC = () => {
  const { stationName } = useParams<{ stationName: string }>();
  const navigate = useNavigate();
  const { stations, searchStations, loading: stationsLoading } = useStations();
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trains, setTrains] = useState<StationTrainInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStation, setCurrentStation] = useState<string>(stationName || '');
  const [activeLetterFilter, setActiveLetterFilter] = useState<string | null>(null);

  // 获取所有字母
  const letters = useMemo(() => {
    return Object.keys(stations).sort();
  }, [stations]);

  // 搜索车站
  const handleSearch = useCallback((value: string) => {
    if (value.trim()) {
      const results = searchStations(value);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [searchStations]);

  // 查询车站信息
  const fetchStationInfo = async (station: string) => {
    setLoading(true);
    setError(null);
    
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
      setCurrentStation(station);
      navigate(`/station/${station}`, { replace: true });
    } catch (err) {
      setError('查询失败，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 点击建议
  const handleSuggestionClick = (station: string) => {
    fetchStationInfo(station);
    setSuggestions([]);
  };

  // 点击车站
  const handleStationClick = (station: string) => {
    fetchStationInfo(station);
  };

  // 初始加载
  React.useEffect(() => {
    if (stationName) {
      fetchStationInfo(stationName);
    }
  }, []);

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
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-apple-dark mb-4">
              车站查询
            </h1>
            <p className="text-gray-600 text-lg">
              输入车站名称或从列表中选择
            </p>
          </div>

          {/* 搜索框 */}
          <div className="mb-8">
            <SearchBox
              placeholder="输入车站名称，如：北京、上海虹桥..."
              onSearch={handleSearch}
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
              loading={stationsLoading}
            />
          </div>

          {/* 字母索引 */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveLetterFilter(null)}
                className={`
                  w-10 h-10 rounded-full font-semibold text-sm
                  transition-all duration-200 shadow-sm
                  ${activeLetterFilter === null 
                    ? 'bg-apple-blue text-white' 
                    : 'bg-white/90 text-apple-dark hover:bg-white border border-gray-200'
                  }
                `}
              >
                全部
              </button>
              {letters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setActiveLetterFilter(letter)}
                  className={`
                    w-10 h-10 rounded-full font-semibold text-sm
                    transition-all duration-200 shadow-sm
                    ${activeLetterFilter === letter 
                      ? 'bg-apple-blue text-white' 
                      : 'bg-white/90 text-apple-dark hover:bg-white border border-gray-200'
                    }
                  `}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* 车站列表 */}
          {!currentStation && !stationsLoading && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-6 shadow-lg mb-8">
              <h2 className="text-xl font-bold text-apple-dark mb-6 flex items-center space-x-2">
                <FiMapPin className="text-apple-blue" />
                <span>
                  {activeLetterFilter ? `${activeLetterFilter} 开头的车站` : '全部车站'}
                </span>
              </h2>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {(activeLetterFilter ? [activeLetterFilter] : letters).map((letter) => (
                  <div key={letter}>
                    <div className="flex items-center space-x-3 mb-3 sticky top-0 bg-white/95 py-2">
                      <span className="w-8 h-8 bg-apple-blue text-white rounded-lg flex items-center justify-center font-bold">
                        {letter}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Object.keys(stations[letter] || {}).length} 个车站
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(stations[letter] || {}).map((station) => (
                        <button
                          key={station}
                          onClick={() => handleStationClick(station)}
                          className="
                            px-3 py-1.5 
                            bg-gray-100 hover:bg-apple-blue hover:text-white
                            rounded-lg text-sm
                            transition-all duration-200
                          "
                        >
                          {station}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 当前车站 */}
          {currentStation && (
            <div className="mb-8">
              <div className="flex items-center justify-between bg-white/95 backdrop-blur rounded-2xl px-6 py-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <FiMapPin className="text-apple-blue text-xl" />
                  <span className="text-2xl font-semibold text-apple-dark">
                    {currentStation}站
                  </span>
                  <span className="text-gray-500">
                    共 {trains.length} 趟列车
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCurrentStation('');
                    setTrains([]);
                    navigate('/station', { replace: true });
                  }}
                  className="text-apple-blue hover:underline font-medium"
                >
                  返回车站列表
                </button>
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-12 shadow-lg">
              <Loading text="正在查询车站信息..." />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-center py-12 bg-white/95 backdrop-blur rounded-3xl shadow-lg">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {/* 列车列表 */}
          {!loading && !error && trains.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trains.map((train, index) => (
                <TrainCard
                  key={`${train.trainNo}-${index}`}
                  trainNo={train.trainNo}
                  departure={train.departure}
                  terminal={train.terminal}
                  departureTime={train.departureTime}
                  waitingRoom={train.waitingRoom}
                  status={train.status}
                />
              ))}
            </div>
          )}

          {/* 空状态 - 车站加载中 */}
          {stationsLoading && !currentStation && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-12 shadow-lg">
              <Loading text="正在加载车站数据..." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationSearch;