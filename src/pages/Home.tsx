import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiClock, FiMapPin, FiMonitor, FiNavigation, FiExternalLink } from 'react-icons/fi';
import SearchBox from '../components/common/SearchBox';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import Loading from '../components/common/Loading';
import { useStations } from '../hooks/useStations';
import { getStationInfo } from '../services/api';
import type { StationTrainInfo } from '../types';

interface ChartDataItem {
  name: string;
  value: number;
}

// 功能卡片类型
interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  color: string;
  isExternal?: boolean;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { searchStations, loading } = useStations();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // 图表数据状态
  const [chartLoading, setChartLoading] = useState(true);
  const [stationTrainData, setStationTrainData] = useState<ChartDataItem[]>([]);
  const [trainTypeData, setTrainTypeData] = useState<ChartDataItem[]>([]);
  const [statusData, setStatusData] = useState<ChartDataItem[]>([]);

  // 默认热门车站
  const defaultStations = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '西安', '长沙', '南京'];

  // 热门车站按钮
  const hotStations = [
    '北京', '上海', '广州', '深圳', '成都', 
    '杭州', '武汉', '西安', '南京', '重庆',
    '天津', '苏州', '郑州', '长沙', '青岛'
  ];

  // 外部链接图标组件
  const ExternalIcon = () => (
    <img 
      src="/china-railway.svg" 
      alt="铁路" 
      className="w-8 h-8 object-contain"
    />
  );

  // 功能卡片数据
  const features: FeatureItem[] = [
    {
      icon: <FiNavigation className="text-3xl" />,
      title: '路线查询',
      description: '输入起点终点，智能推荐最佳车次',
      path: '/route',
      color: 'bg-red-500',
    },
    {
      icon: <FiMapPin className="text-3xl" />,
      title: '车站查询',
      description: '查询全国各车站实时列车信息',
      path: '/station',
      color: 'bg-blue-500',
    },
    {
      icon: <FiClock className="text-3xl" />,
      title: '车次查询',
      description: '查询列车时刻表与停靠站信息',
      path: '/train',
      color: 'bg-green-500',
    },
    {
      icon: <FiMonitor className="text-3xl" />,
      title: '候车大屏',
      description: '模拟车站候车室大屏显示',
      path: '/display',
      color: 'bg-purple-500',
    },
    {
      icon: <FiTrendingUp className="text-3xl" />,
      title: '数据统计',
      description: '铁路运行数据可视化展示',
      path: '/statistics',
      color: 'bg-orange-500',
    },
    {
      icon: <ExternalIcon />,
      title: '官方购票',
      description: '前往官方网站购买火车票',
      path: 'https://www.12306.cn/',
      color: 'bg-[#0071e3]',
      isExternal: true,
    },
    {
      icon: <ExternalIcon />,
      title: '中国铁路',
      description: '中国国家铁路集团官网',
      path: 'http://www.china-railway.com.cn/',
      color: 'bg-[#3b80c3]',
      isExternal: true,
    },
    {
      icon: <ExternalIcon />,
      title: '铁路物资',
      description: '中国铁路物资集团官网',
      path: 'https://www.china-ric.com/',
      color: 'bg-[#1d1d1f]',
      isExternal: true,
    },
  ];

  // 获取图表数据
  useEffect(() => {
    const fetchChartData = async () => {
      setChartLoading(true);
      
      try {
        const trainCounts: ChartDataItem[] = [];
        const typeCount: { [key: string]: number } = {};
        const statusCount: { [key: string]: number } = {};

        const promises = defaultStations.map(async (station) => {
          try {
            const response = await getStationInfo(station);
            const trains: StationTrainInfo[] = response.data.map((item) => ({
              trainNo: item[0],
              departure: item[1],
              terminal: item[2],
              departureTime: item[3],
              waitingRoom: item[4],
              status: item[5],
            }));

            trainCounts.push({ name: station, value: trains.length });

            trains.forEach((train) => {
              // 车次类型
              let type = '其他';
              if (train.trainNo.startsWith('G')) type = 'G字头';
              else if (train.trainNo.startsWith('D')) type = 'D字头';
              else if (train.trainNo.startsWith('C')) type = 'C字头';
              else if (train.trainNo.startsWith('Z')) type = 'Z字头';
              else if (train.trainNo.startsWith('T')) type = 'T字头';
              else if (train.trainNo.startsWith('K')) type = 'K字头';
              
              typeCount[type] = (typeCount[type] || 0) + 1;

              // 状态统计
              let status = train.status;
              if (status.includes('晚点')) status = '晚点';
              statusCount[status] = (statusCount[status] || 0) + 1;
            });

          } catch {
            trainCounts.push({ name: station, value: 0 });
          }
        });

        await Promise.all(promises);

        setStationTrainData(trainCounts.sort((a, b) => b.value - a.value));
        setTrainTypeData(
          Object.entries(typeCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
        );
        setStatusData(
          Object.entries(statusCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
        );

      } catch (error) {
        console.error('获取图表数据失败:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const handleSearch = useCallback((value: string) => {
    if (value.trim()) {
      const results = searchStations(value);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [searchStations]);

  const handleSuggestionClick = (stationName: string) => {
    navigate(`/station/${stationName}`);
  };

  // 处理功能卡片点击
  const handleFeatureClick = (feature: FeatureItem) => {
    if (feature.isExternal) {
      window.open(feature.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(feature.path);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section 
        className="relative text-white py-32 overflow-hidden"
        style={{
          backgroundImage: 'url(https://cf-r2.zyhorg.ac.cn/images/1765074021195-1quqny-hexiehao.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 暗色遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
        
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-apple-blue rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/Railway.svg" 
              alt="全国铁路信息查询系统" 
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-lg">
            全国铁路信息查询系统
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-2">
            Railway Information Query System
          </p>
          <p className="text-base text-gray-400 mb-12 max-w-2xl mx-auto">
            非官方铁路信息聚合平台，提供便捷的列车信息查询服务
          </p>

          {/* 搜索框 */}
          <SearchBox
            placeholder="输入车站名称搜索..."
            onSearch={handleSearch}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            loading={loading}
          />

          <p className="mt-6 text-gray-400 text-sm">
            支持搜索全国 3000+ 个车站 · 数据仅供参考，购票请访问官网
          </p>

          {/* 热门车站 */}
          <div className="mt-10">
            <p className="text-gray-400 text-sm mb-4">热门车站</p>
            <div className="flex flex-wrap justify-center gap-3">
              {hotStations.map((station) => (
                <button
                  key={station}
                  onClick={() => handleSuggestionClick(station)}
                  className="
                    px-4 py-2 
                    bg-white/10 backdrop-blur-sm
                    hover:bg-white/20
                    border border-white/20
                    rounded-full
                    text-white text-sm font-medium
                    transition-all duration-200
                    hover:scale-105
                  "
                >
                  {station}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 提示横幅 */}
      <section className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <p className="text-center text-amber-800 text-sm">
            ⚠️ 本网站为非官方平台，仅供学习交流使用。购票及出行请以
            <a 
              href="https://www.12306.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-apple-blue font-medium hover:underline mx-1"
            >
              12306官方网站
            </a>
            为准。⚠️
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-apple-dark mb-4">
              便捷的铁路信息服务
            </h2>
            <p className="text-gray-500 text-lg">
              为您提供全方位的铁路出行信息查询
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => handleFeatureClick(feature)}
                className="
                  group p-8 bg-white rounded-3xl
                  border border-gray-100
                  hover:shadow-xl hover:border-transparent
                  transition-all duration-300
                  text-left
                  relative
                "
              >
                {/* 外部链接标识 */}
                {feature.isExternal && (
                  <div className="absolute top-4 right-4 text-gray-400 group-hover:text-apple-blue transition-colors">
                    <FiExternalLink className="text-lg" />
                  </div>
                )}
                
                <div className={`
                  w-16 h-16 ${feature.color} rounded-2xl
                  flex items-center justify-center text-white
                  mb-6 group-hover:scale-110 transition-transform
                `}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-apple-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-24 px-6 bg-apple-gray">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-apple-dark mb-4">
              实时数据统计
            </h2>
            <p className="text-gray-500 text-lg">
              基于热门车站的实时列车数据（仅供参考）
            </p>
          </div>

          {chartLoading ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm">
              <Loading text="正在加载统计数据..." />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 折线图 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <LineChart
                  data={stationTrainData}
                  title="热门车站今日列车数量"
                  xAxisName="车站"
                  yAxisName="列车数量"
                />
              </div>

              {/* 柱状图和饼图并排 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <BarChart
                    data={trainTypeData}
                    title="车次类型分布"
                    xAxisName="类型"
                    yAxisName="数量"
                  />
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <PieChart
                    data={statusData}
                    title="列车状态分布"
                    showPercentage={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 查看更多 */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/statistics')}
              className="
                px-8 py-3
                bg-apple-blue text-white
                rounded-full font-medium
                hover:bg-blue-600 transition-colors
              "
            >
              查看详细统计 →
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '3000+', label: '覆盖车站' },
              { value: '5000+', label: '每日车次' },
              { value: '24/7', label: '全天服务' },
              { value: '实时', label: '数据更新' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-apple-blue mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;