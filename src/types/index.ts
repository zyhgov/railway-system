// 车站分组数据类型
export interface GroupedStations {
  [letter: string]: {
    [stationName: string]: string;
  };
}

// 车站列车信息
export interface StationTrainInfo {
  trainNo: string;        // 车次
  departure: string;      // 始发站
  terminal: string;       // 终点站
  departureTime: string;  // 开车时间
  waitingRoom: string;    // 候车室/检票口
  status: string;         // 当前状态
}

// 车站查询响应
export interface StationResponse {
  station: string;
  data: [string, string, string, string, string, string][];
}

// 停站信息
export interface StopInfo {
  站点: string;
  到达时间: string;
  发车时间: string;
  停留时间: string;
  ticketDelay: string;
  exit: string;
}

// 车次详情
export interface TrainDetail {
  车次: string;
  出发日期: string;
  开车时间: string;
  到达时间: string;
  始发站: string;
  终到站: string;
  客运担当: string;
  车底类型: string;
  车底配属: string;
  停站信息: StopInfo[];
}

// 搜索类型
export type SearchType = 'station' | 'train';

// 状态类型
export type TrainStatus = '正点' | '正在检票' | '停止检票' | '已发车' | '晚点' | '候车中';

// 站点状态
export interface StopStatus {
  color: string;
  status: string;
  textColor: string;
}