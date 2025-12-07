import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import StationSearch from './pages/StationSearch';
import TrainSearch from './pages/TrainSearch';
import RouteSearch from './pages/RouteSearch';
import DisplayBoard from './pages/DisplayBoard';
import Statistics from './pages/Statistics';
import LoadingScreen from './components/common/LoadingScreen';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="animate-fade-in">
      <Routes>
        {/* 候车大屏单独布局 */}
        <Route path="/display" element={<DisplayBoard />} />
        
        {/* 其他页面使用统一布局 */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/station" element={<StationSearch />} />
                <Route path="/station/:stationName" element={<StationSearch />} />
                <Route path="/train" element={<TrainSearch />} />
                <Route path="/train/:trainNo" element={<TrainSearch />} />
                <Route path="/route" element={<RouteSearch />} />
                <Route path="/statistics" element={<Statistics />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </div>
  );
};

export default App;