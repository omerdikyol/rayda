import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Clock, Star, X, Train, ChevronRight } from 'lucide-react';
import { stations } from '../data/stations';
import { useTimetableStore } from '../stores/timetableStore';
import { useLanguage } from '../contexts/LanguageContext';
import { formatArrivalTime, formatMinutesAway } from '../utils/timetableCalculations';
import { getFilteredStationsInOrder, getStationsGroupedBySection } from '../utils/stationOrdering';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

const StationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<typeof stations[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { 
    selectStation, 
    getTimetableForStation, 
    isCalculating 
  } = useTimetableStore();
  const { t } = useLanguage();

  // Get stations in route order with filtering
  const filteredStations = getFilteredStationsInOrder(searchQuery);
  const stationGroups = getStationsGroupedBySection(t);

  // Add swipe to close functionality for mobile
  useSwipeGesture(
    panelRef as React.RefObject<HTMLElement>,
    {
      onSwipeRight: () => setIsOpen(false)
    },
    {
      threshold: 80,
      disabled: !isOpen
    }
  );

  // Toggle favorite station
  const toggleFavorite = (stationId: string) => {
    setFavorites(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  // Handle station selection
  const handleStationSelect = useCallback((station: typeof stations[0]) => {
    setSelectedStation(station);
    selectStation(station.id);
  }, [selectStation]);

  // Get arrivals for selected station
  const arrivals = selectedStation ? getTimetableForStation(selectedStation.id) : [];

  // Real-time updates are now handled automatically by the timetable store
  // when a station is selected

  // Listen for map station clicks
  useEffect(() => {
    const handleStationClick = (event: CustomEvent) => {
      const { stationId } = event.detail;
      const station = stations.find(s => s.id === stationId);
      if (station) {
        handleStationSelect(station);
        setIsOpen(true); // Open the timetable panel
      }
    };

    window.addEventListener('openStationTimetable', handleStationClick as EventListener);
    return () => {
      window.removeEventListener('openStationTimetable', handleStationClick as EventListener);
    };
  }, []);

  const getRouteColorClass = (color: string) => {
    // Convert hex color to Tailwind class or return a default
    if (color === '#0066CC') return 'bg-blue-600';
    if (color === '#0099FF') return 'bg-blue-400';
    if (color === '#FF6600') return 'bg-orange-600';
    return 'bg-gray-600';
  };

  return (
    <>
      {/* Floating Button - Tool Style */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-lg hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center space-x-2 touch-manipulation"
      >
        <Search className="w-5 h-5" />
        <span className="font-medium text-sm sm:text-base">{t('stationTimetable')}</span>
      </button>

      {/* Panel */}
      <div 
        ref={panelRef}
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
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
                        onClick={() => handleStationSelect(station)}
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
                
                {searchQuery ? (
                  // Show filtered results when searching
                  filteredStations.map(station => (
                    <div
                      key={station.id}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
                      onClick={() => handleStationSelect(station)}
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
                  ))
                ) : (
                  // Show stations grouped by section when not searching
                  stationGroups.map(group => (
                    <div key={group.section} className="mb-4 last:mb-0">
                      <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                        {group.section}
                      </div>
                      {group.stations.map(station => (
                        <div
                          key={station.id}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
                          onClick={() => handleStationSelect(station)}
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
                  ))
                )}
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
                {isCalculating && arrivals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Calculating arrivals...
                  </div>
                ) : (
                  <>
                    {arrivals.map((arrival, index) => (
                      <div
                        key={`${arrival.trainId}-${index}`}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${getRouteColorClass(arrival.color)}`}></div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Train className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-gray-900">{arrival.finalDestination}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {arrival.routeName} • {arrival.displayName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatArrivalTime(arrival.arrivalTime)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatMinutesAway(arrival.minutesAway)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {arrivals.length === 0 && !isCalculating && (
                      <div className="text-center py-8 text-gray-500">
                        {t('noUpcomingArrivals')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              {isCalculating ? (
                <>
                  <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>{t('updated')}: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{t('liveData')}</span>
            </div>
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