import type { InterStationTime } from '../types';
import { metroInterStationTimes } from './metro';

/**
 * Directed run times in seconds, taken from consecutive stops of the last
 * weekday trains in the official Marmaray timetable. The two directions are
 * not symmetric. Halkalı → Gebze is 107 min, Gebze → Halkalı is 108 min.
 */
const marmarayTimes: InterStationTime[] = [
  // Halkalı → Gebze
  { fromStationId: '275', toStationId: '274', time: 180 }, // Halkalı → Mustafa Kemal
  { fromStationId: '274', toStationId: '273', time: 120 }, // Mustafa Kemal → Küçükçekmece
  { fromStationId: '273', toStationId: '272', time: 180 }, // Küçükçekmece → Florya
  { fromStationId: '272', toStationId: '271', time: 120 }, // Florya → Florya Akvaryum
  { fromStationId: '271', toStationId: '270', time: 180 }, // Florya Akvaryum → Yeşilköy
  { fromStationId: '270', toStationId: '269', time: 120 }, // Yeşilköy → Yeşilyurt
  { fromStationId: '269', toStationId: '268', time: 180 }, // Yeşilyurt → Ataköy
  { fromStationId: '268', toStationId: '267', time: 180 }, // Ataköy → Bakırköy
  { fromStationId: '267', toStationId: '266', time: 120 }, // Bakırköy → Yenimahalle
  { fromStationId: '266', toStationId: '265', time: 180 }, // Yenimahalle → Zeytinburnu
  { fromStationId: '265', toStationId: '237', time: 120 }, // Zeytinburnu → Kazlıçeşme
  { fromStationId: '237', toStationId: '234', time: 240 }, // Kazlıçeşme → Yenikapı
  { fromStationId: '234', toStationId: '65', time: 180 }, // Yenikapı → Sirkeci
  { fromStationId: '65', toStationId: '68', time: 240 }, // Sirkeci → Üsküdar
  { fromStationId: '68', toStationId: '67', time: 240 }, // Üsküdar → Ayrılıkçeşme
  { fromStationId: '67', toStationId: '297', time: 180 }, // Ayrılıkçeşme → Söğütlüçeşme
  { fromStationId: '297', toStationId: '296', time: 120 }, // Söğütlüçeşme → Feneryolu
  { fromStationId: '296', toStationId: '295', time: 120 }, // Feneryolu → Göztepe
  { fromStationId: '295', toStationId: '294', time: 120 }, // Göztepe → Erenköy
  { fromStationId: '294', toStationId: '293', time: 180 }, // Erenköy → Suadiye
  { fromStationId: '293', toStationId: '292', time: 120 }, // Suadiye → Bostancı
  { fromStationId: '292', toStationId: '291', time: 180 }, // Bostancı → Küçükyalı
  { fromStationId: '291', toStationId: '290', time: 120 }, // Küçükyalı → İdealtepe
  { fromStationId: '290', toStationId: '289', time: 120 }, // İdealtepe → Süreyya Plajı
  { fromStationId: '289', toStationId: '288', time: 120 }, // Süreyya Plajı → Maltepe
  { fromStationId: '288', toStationId: '287', time: 180 }, // Maltepe → Cevizli
  { fromStationId: '287', toStationId: '286', time: 120 }, // Cevizli → Atalar
  { fromStationId: '286', toStationId: '285', time: 120 }, // Atalar → Başak
  { fromStationId: '285', toStationId: '284', time: 120 }, // Başak → Kartal
  { fromStationId: '284', toStationId: '283', time: 180 }, // Kartal → Yunus
  { fromStationId: '283', toStationId: '282', time: 180 }, // Yunus → Pendik
  { fromStationId: '282', toStationId: '281', time: 180 }, // Pendik → Kaynarca
  { fromStationId: '281', toStationId: '280', time: 120 }, // Kaynarca → Tersane
  { fromStationId: '280', toStationId: '279', time: 120 }, // Tersane → Güzelyalı
  { fromStationId: '279', toStationId: '278', time: 120 }, // Güzelyalı → Aydıntepe
  { fromStationId: '278', toStationId: '277', time: 120 }, // Aydıntepe → İçmeler
  { fromStationId: '277', toStationId: '276', time: 180 }, // İçmeler → Tuzla
  { fromStationId: '276', toStationId: '298', time: 180 }, // Tuzla → Çayırova
  { fromStationId: '298', toStationId: '299', time: 180 }, // Çayırova → Fatih
  { fromStationId: '299', toStationId: '300', time: 120 }, // Fatih → Osmangazi
  { fromStationId: '300', toStationId: '301', time: 120 }, // Osmangazi → Darıca
  { fromStationId: '301', toStationId: '302', time: 120 }, // Darıca → Gebze (reverse run time; terminal arrival not in timetable)

  // Gebze → Halkalı
  { fromStationId: '302', toStationId: '301', time: 120 }, // Gebze → Darıca
  { fromStationId: '301', toStationId: '300', time: 120 }, // Darıca → Osmangazi
  { fromStationId: '300', toStationId: '299', time: 120 }, // Osmangazi → Fatih
  { fromStationId: '299', toStationId: '298', time: 120 }, // Fatih → Çayırova
  { fromStationId: '298', toStationId: '276', time: 240 }, // Çayırova → Tuzla
  { fromStationId: '276', toStationId: '277', time: 180 }, // Tuzla → İçmeler
  { fromStationId: '277', toStationId: '278', time: 120 }, // İçmeler → Aydıntepe
  { fromStationId: '278', toStationId: '279', time: 120 }, // Aydıntepe → Güzelyalı
  { fromStationId: '279', toStationId: '280', time: 120 }, // Güzelyalı → Tersane
  { fromStationId: '280', toStationId: '281', time: 120 }, // Tersane → Kaynarca
  { fromStationId: '281', toStationId: '282', time: 180 }, // Kaynarca → Pendik
  { fromStationId: '282', toStationId: '283', time: 180 }, // Pendik → Yunus
  { fromStationId: '283', toStationId: '284', time: 180 }, // Yunus → Kartal
  { fromStationId: '284', toStationId: '285', time: 120 }, // Kartal → Başak
  { fromStationId: '285', toStationId: '286', time: 120 }, // Başak → Atalar
  { fromStationId: '286', toStationId: '287', time: 120 }, // Atalar → Cevizli
  { fromStationId: '287', toStationId: '288', time: 180 }, // Cevizli → Maltepe
  { fromStationId: '288', toStationId: '289', time: 120 }, // Maltepe → Süreyya Plajı
  { fromStationId: '289', toStationId: '290', time: 120 }, // Süreyya Plajı → İdealtepe
  { fromStationId: '290', toStationId: '291', time: 120 }, // İdealtepe → Küçükyalı
  { fromStationId: '291', toStationId: '292', time: 180 }, // Küçükyalı → Bostancı
  { fromStationId: '292', toStationId: '293', time: 120 }, // Bostancı → Suadiye
  { fromStationId: '293', toStationId: '294', time: 180 }, // Suadiye → Erenköy
  { fromStationId: '294', toStationId: '295', time: 120 }, // Erenköy → Göztepe
  { fromStationId: '295', toStationId: '296', time: 120 }, // Göztepe → Feneryolu
  { fromStationId: '296', toStationId: '297', time: 180 }, // Feneryolu → Söğütlüçeşme
  { fromStationId: '297', toStationId: '67', time: 180 }, // Söğütlüçeşme → Ayrılıkçeşme
  { fromStationId: '67', toStationId: '68', time: 240 }, // Ayrılıkçeşme → Üsküdar
  { fromStationId: '68', toStationId: '65', time: 240 }, // Üsküdar → Sirkeci
  { fromStationId: '65', toStationId: '234', time: 180 }, // Sirkeci → Yenikapı
  { fromStationId: '234', toStationId: '237', time: 240 }, // Yenikapı → Kazlıçeşme
  { fromStationId: '237', toStationId: '265', time: 120 }, // Kazlıçeşme → Zeytinburnu
  { fromStationId: '265', toStationId: '266', time: 180 }, // Zeytinburnu → Yenimahalle
  { fromStationId: '266', toStationId: '267', time: 120 }, // Yenimahalle → Bakırköy
  { fromStationId: '267', toStationId: '268', time: 120 }, // Bakırköy → Ataköy
  { fromStationId: '268', toStationId: '269', time: 180 }, // Ataköy → Yeşilyurt
  { fromStationId: '269', toStationId: '270', time: 120 }, // Yeşilyurt → Yeşilköy
  { fromStationId: '270', toStationId: '271', time: 180 }, // Yeşilköy → Florya Akvaryum
  { fromStationId: '271', toStationId: '272', time: 120 }, // Florya Akvaryum → Florya
  { fromStationId: '272', toStationId: '273', time: 180 }, // Florya → Küçükçekmece
  { fromStationId: '273', toStationId: '274', time: 180 }, // Küçükçekmece → Mustafa Kemal
  { fromStationId: '274', toStationId: '275', time: 180 }, // Mustafa Kemal → Halkalı (reverse run time; terminal arrival not in timetable)
];

export const interStationTimes: InterStationTime[] = [...marmarayTimes, ...metroInterStationTimes];
