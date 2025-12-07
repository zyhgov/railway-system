import axios from 'axios';
import type { StationResponse, TrainDetail, GroupedStations } from '../types';

const BASE_URL = 'https://www.12036.com:8095';

// 创建 axios 实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 获取车站信息
export const getStationInfo = async (stationName: string): Promise<StationResponse> => {
  const response = await api.get(`/station/${encodeURIComponent(stationName)}`);
  return response.data;
};

// 获取车次信息
export const getTrainInfo = async (trainNo: string): Promise<TrainDetail> => {
  const response = await api.get(`/train/${trainNo}`);
  return response.data;
};

// 获取车站分组数据
export const getGroupedStations = async (): Promise<GroupedStations> => {
  const response = await axios.get('/grouped_stations.json');
  return response.data;
};

export default api;