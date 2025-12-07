import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiMonitor, FiClock, FiMapPin, FiNavigation } from 'react-icons/fi';

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '首页', icon: <FiHome /> },
    { path: '/route', label: '路线查询', icon: <FiNavigation /> },
    { path: '/station', label: '车站查询', icon: <FiMapPin /> },
    { path: '/train', label: '车次查询', icon: <FiClock /> },
    { path: '/display', label: '候车大屏', icon: <FiMonitor /> },
  ];

  return (
    <header className="bg-apple-light/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/Railway.svg" 
              alt="全国铁路信息查询系统" 
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-semibold text-apple-dark leading-tight">
                全国铁路信息查询系统
              </span>
              <span className="text-xs text-gray-500">
                Railway Information System
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-apple-blue text-white' 
                      : 'text-apple-dark hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;