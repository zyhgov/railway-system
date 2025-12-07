import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiAlertCircle, FiExternalLink } from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: '首页', path: '/' },
    { label: '路线查询', path: '/route' },
    { label: '车站查询', path: '/station' },
    { label: '车次查询', path: '/train' },
    { label: '候车大屏', path: '/display' },
    { label: '数据统计', path: '/statistics' },
  ];

  const externalLinks = [
    { label: '12306官网', url: 'https://www.12306.cn/' },
    { label: '中国铁路', url: 'http://www.china-railway.com.cn/' },
    { label: '铁路物资', url: 'https://www.china-ric.com/' },
  ];

  return (
    <footer className="bg-apple-dark text-white">
      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 关于我们 */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/Railway.svg" 
                alt="全国铁路信息查询系统" 
                className="h-10 w-auto brightness-0 invert"
              />
              <span className="text-lg font-semibold">全国铁路信息查询系统</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              全国铁路信息查询系统是一个非官方的铁路信息聚合查询平台，
              为旅客提供便捷的列车时刻、车站信息、正晚点等查询服务。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 官方网站 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">官方网站</h3>
            <ul className="space-y-2 text-sm">
              {externalLinks.map((link) => (
                <li key={link.url}>
                  <a 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center space-x-1"
                  >
                    <span>{link.label}</span>
                    <FiExternalLink className="text-xs" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 服务热线 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">官方服务热线</h3>
            <p className="text-3xl font-bold text-apple-blue mb-2">12306</p>
            <p className="text-sm text-gray-400 mb-4">全天候为您服务</p>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <FiMail />
              <span>仅供学习交流使用</span>
            </div>
          </div>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-yellow-500 text-xl flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="font-semibold text-gray-300 mb-2">免责声明</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>
                    本网站为<span className="text-white">非官方</span>铁路信息查询平台，
                    仅供学习交流和技术研究使用，不作为任何商业用途。
                  </li>
                  <li>
                    本网站所有数据均来源于公开渠道，不保证数据的准确性、完整性和实时性，
                    <span className="text-white">购票及出行请以12306官方网站为准</span>。
                  </li>
                  <li>
                    本网站与中国铁路总公司、中国铁路12306、中国国家铁路集团有限公司等
                    <span className="text-white">无任何关联</span>，所有商标、标识归其各自所有者所有。
                  </li>
                  <li>
                    如本网站内容侵犯了您的合法权益，请及时联系我们<span className="text-white">[info@zyhorg.cn]</span>删除处理。
                  </li>
                  <li>
                    使用本网站即表示您已阅读并同意以上声明。
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 版权信息 */}
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 space-y-2 md:space-y-0">
            <p>
              © {currentYear} 全国铁路信息查询系统 | 仅供学习交流使用 | 联合库UNHub 出品
            </p>
            <p className="flex items-center space-x-4">
              <span>本项目开源于技术学习目的</span>
              <span>·</span>
              <a 
                href="https://www.12306.cn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-apple-blue hover:underline"
              >
                购票请访问12306官网
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;