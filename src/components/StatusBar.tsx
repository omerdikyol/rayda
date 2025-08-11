import { useEffect, useState } from 'react';
import { Train, Clock, Activity, Github, Info, Globe } from 'lucide-react';
import { useTrainStore } from '../stores/trainStore';
import { useLanguage } from '../contexts/LanguageContext';

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { trainPositions, isSimulationRunning } = useTrainStore();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTrains = trainPositions.length;

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Brand and Status */}
        <div className="flex items-center space-x-3 sm:space-x-6">

          {/* Brand */}
          <div className="flex items-center space-x-2">
            <Train className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Rayda</span>
            <span className="hidden sm:inline text-xs text-gray-400">
              {language === 'tr' ? 'İstanbul Ulaşım Takipçisi' : 'Istanbul Transit Tracker'}
            </span>
          </div>

          {/* Status - Hidden on small mobile */}
          <div className="hidden sm:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="hidden md:inline text-gray-300">
                {t('system')}: <span className={isSimulationRunning ? 'text-green-400' : 'text-red-400'}>
                  {t(isSimulationRunning ? 'operational' : 'offline')}
                </span>
              </span>
              <span className="md:hidden text-gray-300">
                <span className={isSimulationRunning ? 'text-green-400' : 'text-red-400'}>{t('live')}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-gray-300">
              <Activity className="w-4 h-4" />
              <span>{activeTrains} <span className="hidden md:inline">{t('trains')}</span></span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Time - Show abbreviated on mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-gray-300">
            <Clock className="w-4 h-4 hidden sm:block" />
            <span className="font-mono text-xs sm:text-sm">
              {currentTime.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: window.innerWidth > 640 ? '2-digit' : undefined
              })}
            </span>
          </div>

          {/* Actions - Hide text on mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 p-1.5 sm:px-3 sm:py-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{language.toUpperCase()}</span>
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-3 sm:py-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>

            <button 
              className="p-1.5 sm:px-3 sm:py-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              aria-label={t('about')}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Status Bar - Show below on small screens */}
      <div className="sm:hidden mt-2 pt-2 border-t border-gray-700 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-400">{t('live')}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <Activity className="w-3 h-3" />
            <span>{activeTrains} {t('trains')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;