import type { Route } from '../types';

// Marmaray route patterns based on official service data
// Source: Istanbul Metropolitan Municipality and research data
export const routes: Route[] = [
  {
    id: 'marmaray-full',
    name: 'Marmaray Full Line',
    termini: ['275', '302'], // Halkalı to Gebze
    frequency: 15, // Every 15 minutes
    stations: [
      // European side - Halkalı to tunnel
      '275', // Halkalı
      '274', // Mustafa Kemal
      '273', // Küçükçekmece
      '272', // Florya
      '271', // Florya Akvaryum
      '270', // Yeşilköy
      '269', // Yeşilyurt
      '268', // Ataköy
      '267', // Bakırköy
      '266', // Yenimahalle
      '265', // Zeytinburnu
      '237', // Kazlıçeşme
      '234', // Yenikapı
      
      // Tunnel section
      '65',  // Sirkeci
      '68',  // Üsküdar
      '67',  // Ayrılıkçeşme
      
      // Asian side - tunnel to Gebze
      '297', // Söğütlüçeşme
      '296', // Feneryolu
      '295', // Göztepe
      '294', // Erenköy
      '293', // Suadiye
      '292', // Bostancı
      '291', // Küçükyalı
      '290', // İdealtepe
      '289', // Süreyya Plajı
      '288', // Maltepe
      '287', // Cevizli
      '286', // Atalar
      '285', // Başak
      '284', // Kartal
      '283', // Yunus
      '282', // Pendik
      '281', // Kaynarca
      '280', // Tersane
      '279', // Güzelyalı
      '278', // Aydıntepe
      '277', // İçmeler
      '276', // Tuzla
      '298', // Çayırova
      '299', // Fatih
      '300', // Osmangazi
      '301', // Darıca
      '302'  // Gebze
    ],
    color: '#0066CC' // Marmaray blue
  },
  {
    id: 'marmaray-short',
    name: 'Marmaray Ataköy-Pendik',
    termini: ['268', '282'], // Ataköy to Pendik
    frequency: 8, // Every 8 minutes
    stations: [
      // European side - Ataköy to tunnel
      '268', // Ataköy
      '267', // Bakırköy
      '266', // Yenimahalle
      '265', // Zeytinburnu
      '237', // Kazlıçeşme
      '234', // Yenikapı
      
      // Tunnel section
      '65',  // Sirkeci
      '68',  // Üsküdar
      '67',  // Ayrılıkçeşme
      
      // Asian side - tunnel to Pendik
      '297', // Söğütlüçeşme
      '296', // Feneryolu
      '295', // Göztepe
      '294', // Erenköy
      '293', // Suadiye
      '292', // Bostancı
      '291', // Küçükyalı
      '290', // İdealtepe
      '289', // Süreyya Plajı
      '288', // Maltepe
      '287', // Cevizli
      '286', // Atalar
      '285', // Başak
      '284', // Kartal
      '283', // Yunus
      '282'  // Pendik
    ],
    color: '#0099FF' // Lighter blue for short service
  },
  {
    id: 'marmaray-evening',
    name: 'Marmaray Evening Pendik-Zeytinburnu',
    termini: ['282', '265'], // Pendik to Zeytinburnu
    frequency: 8, // Every 8 minutes (similar to short service)
    stations: [
      // Asian side - Pendik to tunnel
      '282', // Pendik
      '283', // Yunus
      '284', // Kartal
      '285', // Başak
      '286', // Atalar
      '287', // Cevizli
      '288', // Maltepe
      '289', // Süreyya Plajı
      '290', // İdealtepe
      '291', // Küçükyalı
      '292', // Bostancı
      '293', // Suadiye
      '294', // Erenköy
      '295', // Göztepe
      '296', // Feneryolu
      '297', // Söğütlüçeşme
      
      // Tunnel section
      '67',  // Ayrılıkçeşme
      '68',  // Üsküdar
      '65',  // Sirkeci
      
      // European side - tunnel to Zeytinburnu
      '234', // Yenikapı
      '237', // Kazlıçeşme
      '265'  // Zeytinburnu
    ],
    color: '#FF6600' // Orange for evening service
  }
];