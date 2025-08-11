export const translations = {
  tr: {
    // Status Bar
    system: 'Sistem',
    operational: 'çalışıyor',
    offline: 'çevrimdışı',
    live: 'simülasyon',
    trains: 'tren',
    about: 'Hakkında',
    reportIssue: 'Sorun Bildir',


    // Footer
    openSource: 'Açık Kaynak',
    contributeGithub: 'GitHub\'da Katkıda Bulun',

    // Map Legend
    mapLegend: 'Harita Lejantı',
    station: 'İstasyon (detaylar için tıklayın)',
    direction: 'Yön',
    forwardDirection: 'İleri yön',
    backwardDirection: 'Geri yön',

    // Station Selector
    stationTimetable: 'İstasyon Tarifesi',
    selectStation: 'İstasyon Seç',
    stations: 'İstasyonlar',
    favorites: 'Favoriler',
    allStations: 'Tüm İstasyonlar',
    backToStations: '← İstasyonlara geri dön',
    nextArrivals: 'Sonraki gelişler',
    now: 'Şimdi',
    min: 'dk',
    noUpcomingArrivals: 'Yaklaşan geliş yok',
    updated: 'Güncellendi',
    simulationData: 'Simülasyon verisi',

    // Time formats
    second: 'saniye',
    seconds: 'saniye',
    minute: 'dakika',
    minutes: 'dakika',

    // Route endpoints
    endpoints: {
      'halkalı-gebze': 'Halkalı ↔ Gebze',
      'ataköy-pendik': 'Ataköy ↔ Pendik',
      'pendik-zeytinburnu': 'Pendik → Zeytinburnu'
    },

    // Directions
    directions: {
      gebze: 'Gebze',
      halkalı: 'Halkalı',
      pendik: 'Pendik',
      ataköy: 'Ataköy',
      zeytinburnu: 'Zeytinburnu'
    },

    // Frequency
    frequency: 'Sıklık',

    // Railway track types
    marmarayTracks: 'Marmaray Rayları',
    surfaceRailway: 'Yüzey Demiryolu',
    tunnelSections: 'Tünel Bölümleri',
    bridgeSections: 'Köprü Bölümleri',
    mainLine: 'Ana hat',
    underBosphorus: 'Boğaziçi altında',
    overWaterRoads: 'Su/yol üzerinde',

    // Train legend
    marmarayTrains: 'Marmaray Trenleri',
    allRoutes: 'Tüm hatlar',
    fullLine: 'Tam Hat',
    shortService: 'Kısa Mesafe Servisi',
    eveningService: 'Akşam Servisi',

    // Missing translations for hardcoded English text
    railwayDebug: 'Ray Hata Ayıklama',
    debugOn: 'Hata Ayıklama: AÇIK',
    areaSelector: 'Alan Seçici',
    selectionOn: 'Seçim: AÇIK',
    liveData: 'Canlı veri',
    kmFromHalkali: 'km Halkalı\'dan',
    train: 'Tren',
    searchStationsPlaceholder: 'İstasyonlar ara...',
    favoritesSection: 'FAVORİLER',
    allStationsSection: 'TÜM İSTASYONLAR',
    onlySecond: 'saniye',
    onlySeconds: 'saniye',

    // Route Planner
    routePlanner: 'Güzergah Planlayıcı',
    from: 'Nereden',
    to: 'Nereye',
    selectDepartureStation: 'Kalkış istasyonu seçin',
    selectDestinationStation: 'Varış istasyonu seçin',
    clearSelection: 'Seçimi temizle',
    calculatingBestRoute: 'En iyi güzergah hesaplanıyor...',
    nextDeparture: 'Sonraki Kalkış',
    routePath: 'Güzergah Yolu',
    origin: 'Başlangıç',
    destination: 'Varış noktası',
    moreStops: 'durağı daha',
    planYourJourney: 'Yolculuğunuzu planlayın',
    selectStationsToGetStarted: 'Başlamak için kalkış ve varış istasyonlarınızı seçin.',
    noRouteFound: 'Güzergah bulunamadı',
    unableToFindDirectRoute: 'Bu istasyonlar arasında doğrudan güzergah bulunamadı.',
    totalJourneyTime: 'Toplam yolculuk süresi',
    stop: 'durak',
    stops: 'durak',
    eastbound: 'doğuya doğru',
    westbound: 'batıya doğru',
    following: 'takip ediliyor',

    // Service Status
    serviceNotRunning: 'Servis çalışmıyor',
    limitedServiceHours: 'Sınırlı servis saatleri',
    thisRouteMayHaveLimitedHours: 'Bu güzergahın sınırlı çalışma saatleri olabilir. Güncel servis durumunu kontrol edin.',
    scheduled: 'Planlanmış',
    waitTime: 'Bekleme süresi',
    departureTime: 'Kalkış saati',
    estimatedArrival: 'Tahmini varış',

    // Journey Summary
    total: 'toplam',
    trainDepartingNow: 'tren şimdi kalkıyor',
    wait: 'bekle',
    serviceStarts: 'servis başlıyor',
    journey: 'yolculuk',
    noServiceAvailable: 'Servis mevcut değil',

    // Schedule Status Messages  
    serviceIsCurrentlyRunning: 'Servis şu anda çalışıyor',
    serviceStartsIn: 'Servis şu sürede başlıyor',
    serviceInformationUnavailable: 'Servis bilgisi mevcut değil',
    
    // Time formatting
    hour: 'saat',
    hours: 'saat',
    h: 's',
    hourShort: 's',

    // Station sections
    europeanSide: 'Avrupa Yakası',
    tunnelSection: 'Tünel Bölümü',
    asianSide: 'Anadolu Yakası',
    unknown: 'Bilinmeyen',

    // Train popup
    trainPopupDirection: 'Yön',
    trainPopupProgress: 'İlerleme',

    // Routes info
    routeStatusInfo: 'Hat durumu, servis programları ve gerçek zamanlı verilere göre otomatik olarak güncellenir.',

    // Mobile controls
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    recenter: 'Merkeze al',
    fullscreen: 'Tam ekran',

    // Map legend train info
    arrowsPointToNextStation: 'Oklar bir sonraki istasyonu gösterir',
    multipleTrainsSpreadToAvoidOverlap: 'Birden fazla tren üst üste binmemek için dağılır'
  },

  en: {
    // Status Bar
    system: 'System',
    operational: 'operational',
    offline: 'offline',
    live: 'simulation',
    trains: 'trains',
    about: 'About',
    reportIssue: 'Report Issue',


    // Footer
    openSource: 'Open Source',
    contributeGithub: 'Contribute on GitHub',

    // Map Legend
    mapLegend: 'Map Legend',
    station: 'Station (click for details)',
    direction: 'Direction',
    forwardDirection: 'Forward direction',
    backwardDirection: 'Backward direction',

    // Station Selector
    stationTimetable: 'Station Timetable',
    selectStation: 'Select Station',
    stations: 'Stations',
    favorites: 'Favorites',
    allStations: 'All Stations',
    backToStations: '← Back to stations',
    nextArrivals: 'Next arrivals',
    now: 'Now',
    min: 'min',
    noUpcomingArrivals: 'No upcoming arrivals',
    updated: 'Updated',
    simulationData: 'Simulation data',

    // Time formats
    second: 'second',
    seconds: 'seconds',
    minute: 'minute',
    minutes: 'minutes',

    // Route endpoints
    endpoints: {
      'halkalı-gebze': 'Halkalı ↔ Gebze',
      'ataköy-pendik': 'Ataköy ↔ Pendik',
      'pendik-zeytinburnu': 'Pendik → Zeytinburnu'
    },

    // Directions
    directions: {
      gebze: 'Gebze',
      halkalı: 'Halkalı',
      pendik: 'Pendik',
      ataköy: 'Ataköy',
      zeytinburnu: 'Zeytinburnu'
    },

    // Frequency
    frequency: 'Frequency',

    // Railway track types
    marmarayTracks: 'Marmaray Tracks',
    surfaceRailway: 'Surface Railway',
    tunnelSections: 'Tunnel Sections',
    bridgeSections: 'Bridge Sections',
    mainLine: 'Main line',
    underBosphorus: 'Under Bosphorus',
    overWaterRoads: 'Over water/roads',

    // Train legend
    marmarayTrains: 'Marmaray Trains',
    allRoutes: 'All routes',
    fullLine: 'Full Line',
    shortService: 'Short Service',
    eveningService: 'Evening Service',

    // Missing translations for hardcoded English text
    railwayDebug: 'Railway Debug',
    debugOn: 'Debug: ON',
    areaSelector: 'Area Selector',
    selectionOn: 'Selection: ON',
    liveData: 'Live data',
    kmFromHalkali: 'km from Halkalı',
    train: 'Train',
    searchStationsPlaceholder: 'Search stations...',
    favoritesSection: 'FAVORITES',
    allStationsSection: 'ALL STATIONS',
    onlySecond: 'second',
    onlySeconds: 'seconds',

    // Route Planner
    routePlanner: 'Route Planner',
    from: 'From',
    to: 'To',
    selectDepartureStation: 'Select departure station',
    selectDestinationStation: 'Select destination station',
    clearSelection: 'Clear selection',
    calculatingBestRoute: 'Calculating best route...',
    nextDeparture: 'Next Departure',
    routePath: 'Route Path',
    origin: 'Origin',
    destination: 'Destination',
    moreStops: 'more stops',
    planYourJourney: 'Plan your journey',
    selectStationsToGetStarted: 'Select your departure and destination stations to get started.',
    noRouteFound: 'No route found',
    unableToFindDirectRoute: 'Unable to find a direct route between these stations.',
    totalJourneyTime: 'Total journey time',
    stop: 'stop',
    stops: 'stops',
    eastbound: 'eastbound',
    westbound: 'westbound',
    following: 'Following',

    // Service Status
    serviceNotRunning: 'Service not running',
    limitedServiceHours: 'Limited service hours',
    thisRouteMayHaveLimitedHours: 'This route may have limited operating hours. Check current service status.',
    scheduled: 'Scheduled',
    waitTime: 'Wait time',
    departureTime: 'Departure time',
    estimatedArrival: 'Estimated arrival',

    // Journey Summary
    total: 'total',
    trainDepartingNow: 'train departing now',
    wait: 'wait',
    serviceStarts: 'service starts',
    journey: 'journey',
    noServiceAvailable: 'No service available',

    // Schedule Status Messages
    serviceIsCurrentlyRunning: 'Service is currently running',
    serviceStartsIn: 'Service starts in',
    serviceInformationUnavailable: 'Service information unavailable',

    // Time formatting
    hour: 'hour',
    hours: 'hours',
    h: 'h',
    hourShort: 'h',

    // Station sections
    europeanSide: 'European Side',
    tunnelSection: 'Tunnel Section',
    asianSide: 'Asian Side',
    unknown: 'Unknown',

    // Train popup
    trainPopupDirection: 'Direction',
    trainPopupProgress: 'Progress',

    // Routes info
    routeStatusInfo: 'Route status is updated automatically based on service schedules and real-time data.',

    // Mobile controls
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    recenter: 'Recenter',
    fullscreen: 'Fullscreen',

    // Map legend train info
    arrowsPointToNextStation: '▲ Arrows point to next station',
    multipleTrainsSpreadToAvoidOverlap: 'Multiple trains spread to avoid overlap'
  }
};

export type Language = 'tr' | 'en';
export type TranslationKey = keyof typeof translations.tr;