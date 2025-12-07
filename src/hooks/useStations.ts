import { useState, useEffect } from 'react';
import type { GroupedStations } from '../types';
import { getGroupedStations } from '../services/api';

export const useStations = () => {
  const [stations, setStations] = useState<GroupedStations>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await getGroupedStations();
        setStations(data);
      } catch (err) {
        setError('加载车站数据失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // 搜索车站
  const searchStations = (keyword: string): string[] => {
    if (!keyword.trim()) return [];
    
    const results: string[] = [];
    const lowerKeyword = keyword.toLowerCase();

    Object.values(stations).forEach((group) => {
      Object.entries(group).forEach(([name, code]) => {
        if (
          name.includes(keyword) ||
          code.toLowerCase().includes(lowerKeyword)
        ) {
          results.push(name);
        }
      });
    });

    return results.slice(0, 10);
  };

  // 获取所有车站列表
  const getAllStations = (): string[] => {
    const allStations: string[] = [];
    Object.values(stations).forEach((group) => {
      Object.keys(group).forEach((name) => {
        allStations.push(name);
      });
    });
    return allStations;
  };

  return {
    stations,
    loading,
    error,
    searchStations,
    getAllStations,
  };
};