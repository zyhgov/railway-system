import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiRefreshCw, FiBarChart2, FiTrendingUp, FiPieChart } from 'react-icons/fi';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import Loading from '../components/common/Loading';
import SearchBox from '../components/common/SearchBox';
import { useStations } from '../hooks/useStations';
import { getStationInfo } from '../services/api';
import type { StationTrainInfo } from '../types';

interface ChartDataItem {
  name: string;
  value: number;
}

const Statistics: React.FC = () => {
  const { searchStations } = useStations();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedStations, setSelectedStations] = useState<string[]>(['北京', '上海', '广州', '深圳', '成都']);
  const [inputValue, setInputValue] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [trainCountData, setTrainCountData] = useState<ChartDataItem[]>([]);
  const [trainTypeData, setTrainTypeData] = useState<ChartDataItem[]>([]);
  const [statusData, setStatusData] = useState<ChartDataItem[]>([]);

  // 获取统计数据
  const fetchStatistics = useCallback(async () => {
    if (selectedStations.length === 0) return;
    
    setLoading(true);
    
    try {
      const trainCounts: ChartDataItem[] = [];
      const typeCount: { [key: string]: number } = {};
      const statusCount: { [key: string]: number } = {};

      const promises = selectedStations.map(async (station) => {
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

          // 统计列车数量
          trainCounts.push({ name: station, value: trains.length });

          // 统计车次类型
          trains.forEach((train) => {
            let type = '其他';
            if (train.trainNo.startsWith('G')) type = 'G字头(高铁)';
            else if (train.trainNo.startsWith('D')) type = 'D字头(动车)';
            else if (train.trainNo.startsWith('C')) type = 'C字头(城际)';
            else if (train.trainNo.startsWith('Z')) type = 'Z字头(直达)';
            else if (train.trainNo.startsWith('T')) type = 'T字头(特快)';
            else if (train.trainNo.startsWith('K')) type = 'K字头(快速)';
            
            typeCount[type] = (typeCount[type] || 0) + 1;

            // 统计状态
            let status = train.status;
            if (status.includes('晚点')) status = '晚点';
            statusCount[status] = (statusCount[status] || 0) + 1;
          });

          return trains.length;
        } catch {
          return 0;
        }
      });

      await Promise.all(promises);

      // 按列车数量排序
      setTrainCountData(trainCounts.sort((a, b) => b.value - a.value));
      
      // 车次类型数据
      setTrainTypeData(
        Object.entries(typeCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // 状态数据
      setStatusData(
        Object.entries(statusCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStations]);

  // 初始加载
  useEffect(() => {
    fetchStatistics();
  }, []);

  // 搜索车站
  const handleSearch = useCallback((value: string) => {
    setInputValue(value);
    if (value.trim()) {
      const results = searchStations(value);
      setSuggestions(results.filter(s => !selectedStations.includes(s)));
    } else {
      setSuggestions([]);
    }
  }, [searchStations, selectedStations]);

  // 添加车站
  const handleAddStation = (station: string) => {
    if (!selectedStations.includes(station)) {
      setSelectedStations([...selectedStations, station]);
    }
    setInputValue('');
    setSuggestions([]);
  };

  // 移除车站
  const handleRemoveStation = (station: string) => {
    setSelectedStations(selectedStations.filter(s => s !== station));
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchStatistics();
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-apple-gray">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-apple-dark mb-4">
            数据统计
          </h1>
          <p className="text-gray-500 text-lg">
            选择车站查看实时列车数据统计
          </p>
        </div>

        {/* 车站选择区域 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-apple-dark flex items-center space-x-2">
              <FiSearch className="text-apple-blue" />
              <span>选择统计车站</span>
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading || selectedStations.length === 0}
              className="
                flex items-center space-x-2 px-6 py-2
                bg-apple-blue text-white rounded-full
                hover:bg-blue-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              <span>查询统计</span>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="mb-4">
            <SearchBox
              placeholder="输入车站名称添加到统计列表..."
              onSearch={handleSearch}
              suggestions={suggestions}
              onSuggestionClick={handleAddStation}
            />
          </div>

          {/* 已选车站 */}
          <div className="flex flex-wrap gap-2">
            {selectedStations.map((station) => (
              <span
                key={station}
                className="
                  inline-flex items-center space-x-2
                  px-4 py-2 bg-apple-blue/10 text-apple-blue
                  rounded-full text-sm font-medium
                "
              >
                <span>{station}</span>
                <button
                  onClick={() => handleRemoveStation(station)}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedStations.length === 0 && (
              <p className="text-gray-400 text-sm">请添加至少一个车站进行统计</p>
            )}
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 shadow-sm mb-8">
            <Loading text="正在统计数据..." />
          </div>
        )}

        {/* 图表区域 */}
        {!loading && trainCountData.length > 0 && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center">
                    <FiBarChart2 className="text-apple-blue text-xl" />
                  </div>
                  <span className="text-gray-500">统计车站数</span>
                </div>
                <div className="text-3xl font-bold text-apple-dark">
                  {selectedStations.length}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <FiTrendingUp className="text-green-600 text-xl" />
                  </div>
                  <span className="text-gray-500">列车总数</span>
                </div>
                <div className="text-3xl font-bold text-apple-dark">
                  {trainCountData.reduce((sum, item) => sum + item.value, 0)}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FiPieChart className="text-purple-600 text-xl" />
                  </div>
                  <span className="text-gray-500">车次类型</span>
                </div>
                <div className="text-3xl font-bold text-apple-dark">
                  {trainTypeData.length}
                </div>
              </div>
            </div>

            {/* 折线图 - 各车站列车数量趋势 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <LineChart
                data={trainCountData}
                title="各车站列车数量"
                xAxisName="车站"
                yAxisName="列车数量"
              />
            </div>

            {/* 柱状图和饼图并排 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 柱状图 - 车次类型分布 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <BarChart
                  data={trainTypeData}
                  title="车次类型分布"
                  xAxisName="类型"
                  yAxisName="数量"
                />
              </div>

              {/* 饼图 - 列车状态分布 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <PieChart
                  data={statusData}
                  title="列车状态分布"
                  showPercentage={true}
                />
              </div>
            </div>

            {/* 横向柱状图 - 车站列车数量排名 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <BarChart
                data={trainCountData}
                title="车站列车数量排名"
                xAxisName="列车数量"
                yAxisName="车站"
                horizontal={true}
              />
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && trainCountData.length === 0 && selectedStations.length > 0 && (
          <div className="bg-white rounded-3xl p-12 shadow-sm text-center">
            <FiBarChart2 className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">点击"查询统计"按钮获取数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;