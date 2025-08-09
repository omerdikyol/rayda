import { useState, useEffect } from 'react';
import { 
  ChevronLeft, X, MapPin, Filter, Layers, 
  Settings, Download, BarChart, Info, Clock, Train,
  Zap, Navigation
} from 'lucide-react';
import { stations } from '../data/stations';
import { useTrainStore } from '../stores/trainStore';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar = ({ isOpen = true, onClose, isMobile = false }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'routes' | 'stations' | 'settings'>('info');
  const { trainPositions, isSimulationRunning } = useTrainStore();
  const { t } = useLanguage();

  // Auto-detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const routeInfo = [
    { id: 'marmaray-full', name: t('fullLine'), endpoints: t('endpoints.halkalı-gebze'), color: 'bg-blue-600', active: true },
    { id: 'marmaray-short', name: t('shortService'), endpoints: t('endpoints.ataköy-pendik'), color: 'bg-emerald-600', active: true },
    { id: 'marmaray-evening', name: t('eveningService'), endpoints: t('endpoints.pendik-zeytinburnu'), color: 'bg-red-600', active: false }
  ];

  const systemStats = [
    { label: t('totalStations'), value: stations.length, icon: MapPin },
    { label: t('activeTrains'), value: trainPositions.length, icon: Train },
    { label: t('networkLength'), value: '76.6 km', icon: Navigation }
  ];

  // Mobile overlay mode
  if (isMobile) {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />

        {/* Sidebar Panel */}
        <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gray-800 z-50 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">{t('controlPanel')}</h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                  activeTab === 'info' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('info')}
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                  activeTab === 'routes' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('routes')}
              </button>
              <button
                onClick={() => setActiveTab('stations')}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                  activeTab === 'stations' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('stations')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('settings')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 text-center">
              Open Source • v1.0.0
              <br />
              <a href="https://github.com" className="text-blue-400 hover:text-blue-300">
                Contribute on GitHub
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop collapsed state
  if (isCollapsed) {
    return (
      <div className="hidden lg:flex bg-gray-800 border-r border-gray-700 w-12 flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      </div>
    );
  }

  function renderContent() {
    if (activeTab === 'info') {
      return (
        <div className="space-y-4">
          {/* System Overview */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('systemOverview')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {systemStats.map((stat) => (
                <div key={stat.label} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <stat.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">{stat.label}</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('quickActions')}
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors text-left">
                <Download className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{t('exportScheduleData')}</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors text-left">
                <BarChart className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{t('viewAnalytics')}</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors text-left">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{t('apiDocumentation')}</span>
              </button>
            </div>
          </div>

        </div>
      );
    }

    if (activeTab === 'routes') {
      return (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('activeRoutesSection')}
          </h3>
          <div className="space-y-2">
            {routeInfo.map((route) => (
              <div key={route.id} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${route.color}`}></div>
                    <span className="text-sm font-medium text-white">{route.name}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={route.active} 
                      className="sr-only peer"
                      readOnly
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">{route.endpoints}</p>
                  <p className="text-[10px] text-gray-500">{t('frequency')}: {route.id === 'marmaray-full' ? '15 min' : route.id === 'marmaray-short' ? '8 min' : '8 min'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'stations') {
      return (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchStationsPlaceholder')}
              className="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('majorStations')}
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {['Halkalı', 'Bakırköy', 'Yenikapı', 'Sirkeci', 'Üsküdar', 'Ayrılık Çeşmesi', 'Bostancı', 'Maltepe', 'Pendik', 'Gebze'].map((station) => (
                <button
                  key={station}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                  <span>{station}</span>
                  <ChevronLeft className="w-4 h-4 text-gray-500 rotate-180" />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('mapSettingsSection')}
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm text-gray-300">
                <span>{t('autoRefresh')}</span>
                <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
              </label>
              <label className="flex items-center justify-between text-sm text-gray-300">
                <span>{t('showTrainLabels')}</span>
                <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
              </label>
              <label className="flex items-center justify-between text-sm text-gray-300">
                <span>{t('animateTransitions')}</span>
                <input type="checkbox" className="rounded bg-gray-700 border-gray-600" defaultChecked />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('refreshInterval')}
            </h3>
            <select className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="1">1 {t('onlySecond')}</option>
              <option value="5">5 {t('onlySeconds')}</option>
              <option value="10">10 {t('onlySeconds')}</option>
              <option value="30">30 {t('onlySeconds')}</option>
            </select>
          </div>
        </div>
      );
    }
  }

  // Desktop expanded state
  return (
    <div className="hidden lg:flex bg-gray-800 border-r border-gray-700 w-80 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">{t('controlPanel')}</h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === 'info' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('info')}
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === 'routes' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('routes')}
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === 'stations' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('stations')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === 'settings' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('settings')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          {t('openSource')} • v1.0.0
          <br />
          <a href="https://github.com" className="text-blue-400 hover:text-blue-300">
            {t('contributeGithub')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;