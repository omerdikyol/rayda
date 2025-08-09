import { useState, useEffect } from 'react';
import { Search, Clock, Star, X, Train, ChevronRight } from 'lucide-react';
import { stations } from '../data/stations';
import { useTrainStore } from '../stores/trainStore';
import { useLanguage } from '../contexts/LanguageContext';

interface Arrival {
  trainId: string;
  routeId: string;
  direction: string;
  arrivalTime: string;
  minutesAway: number;
}

const StationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<typeof stations[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  
  const { trainPositions } = useTrainStore();
  const { t } = useLanguage();

  // Filter stations based on search
  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle favorite station
  const toggleFavorite = (stationId: string) => {
    setFavorites(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  // Calculate arrivals for selected station
  useEffect(() => {
    if (!selectedStation) return;

    const calculateArrivals = () => {
      // Mock arrival data - in real app, calculate from train positions
      const mockArrivals: Arrival[] = [
        {
          trainId: 'T001',
          routeId: 'marmaray-full',
          direction: 'Gebze',
          arrivalTime: new Date(Date.now() + 2 * 60000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          minutesAway: 2
        },
        {
          trainId: 'T002',
          routeId: 'marmaray-full',
          direction: 'Halkalı',
          arrivalTime: new Date(Date.now() + 5 * 60000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          minutesAway: 5
        },
        {
          trainId: 'T003',
          routeId: 'marmaray-short',
          direction: 'Pendik',
          arrivalTime: new Date(Date.now() + 8 * 60000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          minutesAway: 8
        },
        {
          trainId: 'T004',
          routeId: 'marmaray-full',
          direction: 'Gebze',
          arrivalTime: new Date(Date.now() + 12 * 60000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          minutesAway: 12
        },
      ];

      setArrivals(mockArrivals);
    };

    calculateArrivals();
    const interval = setInterval(calculateArrivals, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedStation, trainPositions]);

  const getRouteColor = (routeId: string) => {
    switch (routeId) {
      case 'marmaray-full': return 'bg-blue-600';
      case 'marmaray-short': return 'bg-emerald-600';
      case 'marmaray-evening': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <>
      {/* Floating Button - Tool Style */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
      >
        <Search className="w-5 h-5" />
        <span className="font-medium">{t('stationTimetable')}</span>
      </button>

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{t('stationTimetable')}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchStationsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-180px)]">
          {!selectedStation ? (
            // Station List
            <div className="flex-1 overflow-y-auto">
              {/* Favorites Section */}
              {favorites.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('favoritesSection')}</h3>
                  {stations
                    .filter(s => favorites.includes(s.id))
                    .map(station => (
                      <button
                        key={station.id}
                        onClick={() => setSelectedStation(station)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium text-gray-900">{station.name}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                </div>
              )}

              {/* All Stations */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('allStationsSection')}</h3>
                {filteredStations.map(station => (
                  <div
                    key={station.id}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
                    onClick={() => setSelectedStation(station)}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(station.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Star className={`w-4 h-4 ${
                          favorites.includes(station.id)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-400'
                        }`} />
                      </button>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{station.name}</div>
                        <div className="text-xs text-gray-500">{station.distanceFromStart} {t('kmFromHalkali')}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Timetable View
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                >
                  {t('backToStations')}
                </button>
                <h3 className="text-xl font-bold text-gray-900">{selectedStation.name}</h3>
                <p className="text-sm text-gray-600">{t('nextArrivals')}</p>
              </div>

              <div className="p-4 space-y-3">
                {arrivals.map((arrival, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getRouteColor(arrival.routeId)}`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Train className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold text-gray-900">{arrival.direction}</span>
                        </div>
                        <div className="text-sm text-gray-600">{t('train')} {arrival.trainId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{arrival.arrivalTime}</div>
                      <div className="text-sm text-gray-600">
                        {arrival.minutesAway === 0 
                          ? t('now') 
                          : `${arrival.minutesAway} ${t('min')}`}
                      </div>
                    </div>
                  </div>
                ))}

                {arrivals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {t('noUpcomingArrivals')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{t('updated')}: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span>{t('liveData')}</span>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default StationSelector;