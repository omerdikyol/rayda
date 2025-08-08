import type { InterStationTime } from '../types';

// Inter-station travel times based on official Marmaray timetable analysis
// Total journey time: 106 minutes (within 2 minutes of official 108 minutes)
// Times verified against actual timetable data with key segments:
// - Sirkeci → Üsküdar (Bosphorus): 4 minutes ✓
// - Üsküdar → Ayrılıkçeşme: 4 minutes ✓  
// - Tunnel sections: 3-4 minutes
// - Urban stations: 2-3 minutes
// - Suburban stations: 2-3 minutes
export const interStationTimes: InterStationTime[] = [
  // Forward direction: Halkalı to Gebze
  { fromStationId: '275', toStationId: '274', time: 180 }, // Halkalı → Mustafa Kemal: 3 min
  { fromStationId: '274', toStationId: '273', time: 120 }, // Mustafa Kemal → Küçükçekmece: 2 min
  { fromStationId: '273', toStationId: '272', time: 180 }, // Küçükçekmece → Florya: 3 min
  { fromStationId: '272', toStationId: '271', time: 120 }, // Florya → Florya Akvaryum: 2 min
  { fromStationId: '271', toStationId: '270', time: 180 }, // Florya Akvaryum → Yeşilköy: 3 min
  { fromStationId: '270', toStationId: '269', time: 120 }, // Yeşilköy → Yeşilyurt: 2 min
  { fromStationId: '269', toStationId: '268', time: 120 }, // Yeşilyurt → Ataköy: 2 min
  { fromStationId: '268', toStationId: '267', time: 180 }, // Ataköy → Bakırköy: 3 min
  { fromStationId: '267', toStationId: '266', time: 120 }, // Bakırköy → Yenimahalle: 2 min
  { fromStationId: '266', toStationId: '265', time: 180 }, // Yenimahalle → Zeytinburnu: 3 min
  { fromStationId: '265', toStationId: '237', time: 120 }, // Zeytinburnu → Kazlıçeşme: 2 min

  // Tunnel section (verified times)
  { fromStationId: '237', toStationId: '234', time: 240 }, // Kazlıçeşme → Yenikapı: 4 min
  { fromStationId: '234', toStationId: '65', time: 180 },  // Yenikapı → Sirkeci: 3 min
  { fromStationId: '65', toStationId: '68', time: 240 },   // Sirkeci → Üsküdar: 4 min ✓
  { fromStationId: '68', toStationId: '67', time: 240 },   // Üsküdar → Ayrılıkçeşme: 4 min ✓

  // Asian side: tunnel to suburbs
  { fromStationId: '67', toStationId: '297', time: 180 },  // Ayrılıkçeşme → Söğütlüçeşme: 3 min
  { fromStationId: '297', toStationId: '296', time: 120 }, // Söğütlüçeşme → Feneryolu: 2 min
  { fromStationId: '296', toStationId: '295', time: 120 }, // Feneryolu → Göztepe: 2 min
  { fromStationId: '295', toStationId: '294', time: 120 }, // Göztepe → Erenköy: 2 min
  { fromStationId: '294', toStationId: '293', time: 180 }, // Erenköy → Suadiye: 3 min
  { fromStationId: '293', toStationId: '292', time: 120 }, // Suadiye → Bostancı: 2 min
  { fromStationId: '292', toStationId: '291', time: 180 }, // Bostancı → Küçükyalı: 3 min
  { fromStationId: '291', toStationId: '290', time: 120 }, // Küçükyalı → İdealtepe: 2 min
  { fromStationId: '290', toStationId: '289', time: 120 }, // İdealtepe → Süreyya Plajı: 2 min
  { fromStationId: '289', toStationId: '288', time: 120 }, // Süreyya Plajı → Maltepe: 2 min
  { fromStationId: '288', toStationId: '287', time: 180 }, // Maltepe → Cevizli: 3 min
  { fromStationId: '287', toStationId: '286', time: 120 }, // Cevizli → Atalar: 2 min
  { fromStationId: '286', toStationId: '285', time: 120 }, // Atalar → Başak: 2 min
  { fromStationId: '285', toStationId: '284', time: 120 }, // Başak → Kartal: 2 min
  { fromStationId: '284', toStationId: '283', time: 180 }, // Kartal → Yunus: 3 min
  { fromStationId: '283', toStationId: '282', time: 180 }, // Yunus → Pendik: 3 min

  // Far eastern section: Pendik to Gebze
  { fromStationId: '282', toStationId: '281', time: 180 }, // Pendik → Kaynarca: 3 min
  { fromStationId: '281', toStationId: '280', time: 120 }, // Kaynarca → Tersane: 2 min
  { fromStationId: '280', toStationId: '279', time: 120 }, // Tersane → Güzelyalı: 2 min
  { fromStationId: '279', toStationId: '278', time: 120 }, // Güzelyalı → Aydıntepe: 2 min
  { fromStationId: '278', toStationId: '277', time: 120 }, // Aydıntepe → İçmeler: 2 min
  { fromStationId: '277', toStationId: '276', time: 180 }, // İçmeler → Tuzla: 3 min
  { fromStationId: '276', toStationId: '298', time: 180 }, // Tuzla → Çayırova: 3 min
  { fromStationId: '298', toStationId: '299', time: 180 }, // Çayırova → Fatih: 3 min
  { fromStationId: '299', toStationId: '300', time: 120 }, // Fatih → Osmangazi: 2 min
  { fromStationId: '300', toStationId: '301', time: 120 }, // Osmangazi → Darıca: 2 min
  { fromStationId: '301', toStationId: '302', time: 120 }, // Darıca → Gebze: 2 min

  // Reverse direction: Gebze to Halkalı (same durations)
  { fromStationId: '274', toStationId: '275', time: 180 }, // Mustafa Kemal → Halkalı: 3 min
  { fromStationId: '273', toStationId: '274', time: 120 }, // Küçükçekmece → Mustafa Kemal: 2 min
  { fromStationId: '272', toStationId: '273', time: 180 }, // Florya → Küçükçekmece: 3 min
  { fromStationId: '271', toStationId: '272', time: 120 }, // Florya Akvaryum → Florya: 2 min
  { fromStationId: '270', toStationId: '271', time: 180 }, // Yeşilköy → Florya Akvaryum: 3 min
  { fromStationId: '269', toStationId: '270', time: 120 }, // Yeşilyurt → Yeşilköy: 2 min
  { fromStationId: '268', toStationId: '269', time: 120 }, // Ataköy → Yeşilyurt: 2 min
  { fromStationId: '267', toStationId: '268', time: 180 }, // Bakırköy → Ataköy: 3 min
  { fromStationId: '266', toStationId: '267', time: 120 }, // Yenimahalle → Bakırköy: 2 min
  { fromStationId: '265', toStationId: '266', time: 180 }, // Zeytinburnu → Yenimahalle: 3 min
  { fromStationId: '237', toStationId: '265', time: 120 }, // Kazlıçeşme → Zeytinburnu: 2 min
  { fromStationId: '234', toStationId: '237', time: 240 }, // Yenikapı → Kazlıçeşme: 4 min
  { fromStationId: '65', toStationId: '234', time: 180 },  // Sirkeci → Yenikapı: 3 min
  { fromStationId: '68', toStationId: '65', time: 240 },   // Üsküdar → Sirkeci: 4 min ✓
  { fromStationId: '67', toStationId: '68', time: 240 },   // Ayrılıkçeşme → Üsküdar: 4 min ✓
  { fromStationId: '297', toStationId: '67', time: 180 },  // Söğütlüçeşme → Ayrılıkçeşme: 3 min
  { fromStationId: '296', toStationId: '297', time: 120 }, // Feneryolu → Söğütlüçeşme: 2 min
  { fromStationId: '295', toStationId: '296', time: 120 }, // Göztepe → Feneryolu: 2 min
  { fromStationId: '294', toStationId: '295', time: 120 }, // Erenköy → Göztepe: 2 min
  { fromStationId: '293', toStationId: '294', time: 180 }, // Suadiye → Erenköy: 3 min
  { fromStationId: '292', toStationId: '293', time: 120 }, // Bostancı → Suadiye: 2 min
  { fromStationId: '291', toStationId: '292', time: 180 }, // Küçükyalı → Bostancı: 3 min
  { fromStationId: '290', toStationId: '291', time: 120 }, // İdealtepe → Küçükyalı: 2 min
  { fromStationId: '289', toStationId: '290', time: 120 }, // Süreyya Plajı → İdealtepe: 2 min
  { fromStationId: '288', toStationId: '289', time: 120 }, // Maltepe → Süreyya Plajı: 2 min
  { fromStationId: '287', toStationId: '288', time: 180 }, // Cevizli → Maltepe: 3 min
  { fromStationId: '286', toStationId: '287', time: 120 }, // Atalar → Cevizli: 2 min
  { fromStationId: '285', toStationId: '286', time: 120 }, // Başak → Atalar: 2 min
  { fromStationId: '284', toStationId: '285', time: 120 }, // Kartal → Başak: 2 min
  { fromStationId: '283', toStationId: '284', time: 180 }, // Yunus → Kartal: 3 min
  { fromStationId: '282', toStationId: '283', time: 180 }, // Pendik → Yunus: 3 min
  { fromStationId: '281', toStationId: '282', time: 180 }, // Kaynarca → Pendik: 3 min
  { fromStationId: '280', toStationId: '281', time: 120 }, // Tersane → Kaynarca: 2 min
  { fromStationId: '279', toStationId: '280', time: 120 }, // Güzelyalı → Tersane: 2 min
  { fromStationId: '278', toStationId: '279', time: 120 }, // Aydıntepe → Güzelyalı: 2 min
  { fromStationId: '277', toStationId: '278', time: 120 }, // İçmeler → Aydıntepe: 2 min
  { fromStationId: '276', toStationId: '277', time: 180 }, // Tuzla → İçmeler: 3 min
  { fromStationId: '298', toStationId: '276', time: 180 }, // Çayırova → Tuzla: 3 min
  { fromStationId: '299', toStationId: '298', time: 180 }, // Fatih → Çayırova: 3 min
  { fromStationId: '300', toStationId: '299', time: 120 }, // Osmangazi → Fatih: 2 min
  { fromStationId: '301', toStationId: '300', time: 120 }, // Darıca → Osmangazi: 2 min
  { fromStationId: '302', toStationId: '301', time: 120 }, // Gebze → Darıca: 2 min
];