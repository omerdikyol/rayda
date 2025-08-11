import { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  ArrowUpDown, 
  Clock, 
  MapPin, 
  Train, 
  X, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { stations } from '../data/stations';
import { useJourneyStore } from '../stores/journeyStore';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  getJourneySummary, 
  formatJourneyTime, 
  getIntermediateStops
} from '../utils/journeyPlanner';
import { 
  isAnyServiceActive, 
  getServiceStatus,
  formatWaitingTime 
} from '../utils/scheduleCalculator';
import { 
  getFilteredStationsInOrder, 
  getStationsGroupedBySection 
} from '../utils/stationOrdering';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

const RoutePlanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    fromStation,
    toStation,
    currentJourney,
    isCalculating,
    lastCalculationTime,
    setFromStation,
    setToStation,
    swapStations,
    clearJourney
  } = useJourneyStore();

  const { t } = useLanguage();

  // Get stations in route order with filtering
  const filteredFromStations = getFilteredStationsInOrder(searchFrom, toStation?.id);
  const filteredToStations = getFilteredStationsInOrder(searchTo, fromStation?.id);
  
  // Get stations grouped by section for better organization
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.station-dropdown')) {
        setFromDropdownOpen(false);
        setToDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFromStationSelect = (station: typeof stations[0]) => {
    setFromStation(station);
    setSearchFrom('');
    setFromDropdownOpen(false);
  };

  const handleToStationSelect = (station: typeof stations[0]) => {
    setToStation(station);
    setSearchTo('');
    setToDropdownOpen(false);
  };

  const canSwap = fromStation && toStation;
  const hasValidJourney = currentJourney && currentJourney.nextDeparture;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-40 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center space-x-2 touch-manipulation"
      >
        <Navigation className="w-5 h-5" />
        <span className="font-medium text-sm sm:text-base">{t('routePlanner')}</span>
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
            <h2 className="text-2xl font-bold text-gray-900">{t('routePlanner')}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-120px)] overflow-hidden">
          
          {/* Station Selection */}
          <div className="p-4 space-y-4 border-b border-gray-200">
            
            {/* From Station */}
            <div className="station-dropdown relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('from')}</label>
              <button
                onClick={() => setFromDropdownOpen(!fromDropdownOpen)}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className={fromStation ? 'text-gray-900' : 'text-gray-500'}>
                    {fromStation ? fromStation.name : t('selectDepartureStation')}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {fromDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder={t('searchStationsPlaceholder')}
                      value={searchFrom}
                      onChange={(e) => setSearchFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchFrom ? (
                      // Show filtered results when searching
                      filteredFromStations.map(station => (
                        <button
                          key={station.id}
                          onClick={() => handleFromStationSelect(station)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{station.name}</span>
                          <span className="text-xs text-gray-500">{station.distanceFromStart} km</span>
                        </button>
                      ))
                    ) : (
                      // Show stations grouped by section when not searching
                      stationGroups.map(group => (
                        <div key={group.section}>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100">
                            {group.section}
                          </div>
                          {group.stations
                            .filter(station => station.id !== toStation?.id)
                            .map(station => (
                            <button
                              key={station.id}
                              onClick={() => handleFromStationSelect(station)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>{station.name}</span>
                              <span className="text-xs text-gray-500">{station.distanceFromStart} km</span>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapStations}
                disabled={!canSwap}
                className={`p-2 rounded-lg transition-colors ${
                  canSwap 
                    ? 'hover:bg-gray-100 text-gray-700' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <ArrowUpDown className="w-5 h-5" />
              </button>
            </div>

            {/* To Station */}
            <div className="station-dropdown relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('to')}</label>
              <button
                onClick={() => setToDropdownOpen(!toDropdownOpen)}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className={toStation ? 'text-gray-900' : 'text-gray-500'}>
                    {toStation ? toStation.name : t('selectDestinationStation')}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {toDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder={t('searchStationsPlaceholder')}
                      value={searchTo}
                      onChange={(e) => setSearchTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchTo ? (
                      // Show filtered results when searching
                      filteredToStations.map(station => (
                        <button
                          key={station.id}
                          onClick={() => handleToStationSelect(station)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{station.name}</span>
                          <span className="text-xs text-gray-500">{station.distanceFromStart} km</span>
                        </button>
                      ))
                    ) : (
                      // Show stations grouped by section when not searching
                      stationGroups.map(group => (
                        <div key={group.section}>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100">
                            {group.section}
                          </div>
                          {group.stations
                            .filter(station => station.id !== fromStation?.id)
                            .map(station => (
                            <button
                              key={station.id}
                              onClick={() => handleToStationSelect(station)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>{station.name}</span>
                              <span className="text-xs text-gray-500">{station.distanceFromStart} km</span>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Button */}
            {(fromStation || toStation) && (
              <button
                onClick={clearJourney}
                className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
              >
                {t('clearSelection')}
              </button>
            )}
          </div>

          {/* Journey Results */}
          <div className="flex-1 overflow-y-auto">
            {isCalculating && (
              <div className="p-6 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600">{t('calculatingBestRoute')}</p>
              </div>
            )}

            {!isCalculating && currentJourney && (
              <div className="p-4 space-y-4">
                
                {/* Journey Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Train className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{currentJourney.route.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {formatJourneyTime(currentJourney.totalTime, t)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentJourney.totalDistance.toFixed(1)} km
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">
                    {getJourneySummary(currentJourney, t)}
                  </p>
                </div>

                {/* Service Status Alert */}
                {!isAnyServiceActive() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        {t('serviceNotRunning')}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      {getServiceStatus(new Date(), t)}
                    </p>
                  </div>
                )}

                {/* Next Departure */}
                {hasValidJourney && currentJourney.nextDeparture && (
                  <div className={`border rounded-lg p-4 ${
                    currentJourney.nextDeparture.isScheduled 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{t('nextDeparture')}</h3>
                      {currentJourney.nextDeparture.isScheduled && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {t('scheduled')}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t('train')}</span>
                        <span className="text-sm font-medium">{currentJourney.nextDeparture.displayName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {currentJourney.nextDeparture.isScheduled ? t('waitTime') : t('from')}
                        </span>
                        <span className="text-sm font-medium">
                          {currentJourney.nextDeparture.minutesToDeparture === 0 
                            ? (t ? t('now') : 'Now')
                            : formatWaitingTime(currentJourney.nextDeparture.minutesToDeparture, t)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t('departureTime')}</span>
                        <span className="text-sm font-medium">
                          {currentJourney.nextDeparture.departureTime.toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t('estimatedArrival')}</span>
                        <span className="text-sm font-medium">
                          {currentJourney.nextDeparture.arrivalTime.toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('routePath')}</h3>
                  <div className="text-xs text-gray-500 mb-3">
                    {t('following')} {currentJourney.direction === 'forward' ? t('eastbound') : t('westbound')} {t('direction')}
                  </div>
                  
                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute left-[6px] top-4 bottom-4 w-0.5 bg-gray-300"></div>
                    
                    {/* Origin */}
                    <div className="flex items-center space-x-3 mb-3 relative z-10">
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      <div>
                        <div className="font-medium text-gray-900">{fromStation?.name}</div>
                        <div className="text-xs text-gray-500">{t('origin')} • {fromStation?.distanceFromStart} km</div>
                      </div>
                    </div>

                    {/* Intermediate Stops */}
                    {getIntermediateStops(currentJourney).slice(0, 3).map((station) => (
                      <div key={station.id} className="flex items-center space-x-3 mb-3 relative z-10">
                        <div className="w-2 h-2 bg-gray-400 rounded-full border-2 border-white"></div>
                        <div className="text-sm text-gray-600">
                          {station.name}
                          <span className="text-xs text-gray-500 ml-1">• {station.distanceFromStart} km</span>
                        </div>
                      </div>
                    ))}

                    {getIntermediateStops(currentJourney).length > 3 && (
                      <div className="flex items-center space-x-3 mb-3 relative z-10">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="text-sm text-gray-500">
                          +{getIntermediateStops(currentJourney).length - 3} {t('moreStops')}
                        </div>
                      </div>
                    )}

                    {/* Destination */}
                    <div className="flex items-center space-x-3 relative z-10">
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      <div>
                        <div className="font-medium text-gray-900">{toStation?.name}</div>
                        <div className="text-xs text-gray-500">{t('destination')} • {toStation?.distanceFromStart} km</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isCalculating && !currentJourney && fromStation && toStation && (
              <div className="p-6 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-2">{t('noRouteFound')}</p>
                <p className="text-sm">
                  {t('unableToFindDirectRoute')}
                </p>
              </div>
            )}

            {!fromStation && !toStation && (
              <div className="p-6 text-center text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-2">{t('planYourJourney')}</p>
                <p className="text-sm">
                  {t('selectStationsToGetStarted')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {lastCalculationTime && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              Updated: {lastCalculationTime.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        )}
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

export default RoutePlanner;