import type { Station } from '../types';

// Marmaray station data from Istanbul Metropolitan Municipality GTFS
// All 43 stations from Halkalı (European side) to Gebze (Asian side)
// Data extracted with Turkish character support using ISO-8859-9 encoding
export const stations: Station[] = [
  {
    id: '65',
    name: 'Sirkeci',
    coordinates: [28.9770540249921, 41.013545950893], // [longitude, latitude]
    distanceFromStart: 23.38 // km from Halkalı
  },
  {
    id: '67',
    name: 'Ayrılıkçeşme',
    coordinates: [29.0301410162619, 41.000142555216], // [longitude, latitude]
    distanceFromStart: 29.34 // km from Halkalı
  },
  {
    id: '68',
    name: 'Üsküdar',
    coordinates: [29.0137932912137, 41.025756685677], // [longitude, latitude]
    distanceFromStart: 27.47 // km from Halkalı
  },
  {
    id: '234',
    name: 'Yenikapı',
    coordinates: [28.9495799493274, 41.004779309437], // [longitude, latitude]
    distanceFromStart: 20.38 // km from Halkalı
  },
  {
    id: '237',
    name: 'Kazlıçeşme',
    coordinates: [28.9168834698481, 40.992686765903], // [longitude, latitude]
    distanceFromStart: 16.93 // km from Halkalı
  },
  {
    id: '265',
    name: 'Zeytinburnu',
    coordinates: [28.9054462645074, 40.9858745807536], // [longitude, latitude]
    distanceFromStart: 15.83 // km from Halkalı
  },
  {
    id: '266',
    name: 'Yenimahalle',
    coordinates: [28.8810507091285, 40.9817390460176], // [longitude, latitude]
    distanceFromStart: 13.34 // km from Halkalı
  },
  {
    id: '267',
    name: 'Bakırköy',
    coordinates: [28.8723187722271, 40.9802655959296], // [longitude, latitude]
    distanceFromStart: 12.48 // km from Halkalı
  },
  {
    id: '268',
    name: 'Ataköy',
    coordinates: [28.8562250170243, 40.9802168588159], // [longitude, latitude]
    distanceFromStart: 10.96 // km from Halkalı
  },
  {
    id: '269',
    name: 'Yeşilyurt',
    coordinates: [28.8372823708532, 40.9654758614525], // [longitude, latitude]
    distanceFromStart: 8.64 // km from Halkalı
  },
  {
    id: '270',
    name: 'Yeşilköy',
    coordinates: [28.8248828840576, 40.9626579916415], // [longitude, latitude]
    distanceFromStart: 7.36 // km from Halkalı
  },
  {
    id: '271',
    name: 'Florya Akvaryum',
    coordinates: [28.7970462624679, 40.9677718222994], // [longitude, latitude]
    distanceFromStart: 4.77 // km from Halkalı
  },
  {
    id: '272',
    name: 'Florya',
    coordinates: [28.7874770796778, 40.9729629167419], // [longitude, latitude]
    distanceFromStart: 3.79 // km from Halkalı
  },
  {
    id: '273',
    name: 'Küçükçekmece',
    coordinates: [28.7729538518441, 40.9885301752163], // [longitude, latitude]
    distanceFromStart: 2.88 // km from Halkalı
  },
  {
    id: '274',
    name: 'Mustafa Kemal',
    coordinates: [28.7739502215087, 41.0062789769983], // [longitude, latitude]
    distanceFromStart: 1.19 // km from Halkalı
  },
  {
    id: '275',
    name: 'Halkalı',
    coordinates: [28.7664382511562, 41.0178427940864], // [longitude, latitude]
    distanceFromStart: 0.00 // km from Halkalı
  },
  {
    id: '276',
    name: 'Tuzla',
    coordinates: [29.3223601331439, 40.8299524360082], // [longitude, latitude]
    distanceFromStart: 62.99 // km from Halkalı
  },
  {
    id: '277',
    name: 'İçmeler',
    coordinates: [29.3000611746553, 40.8456508904887], // [longitude, latitude]
    distanceFromStart: 60.31 // km from Halkalı
  },
  {
    id: '278',
    name: 'Aydıntepe',
    coordinates: [29.2931664014893, 40.8522885876792], // [longitude, latitude]
    distanceFromStart: 59.56 // km from Halkalı
  },
  {
    id: '279',
    name: 'Güzelyalı',
    coordinates: [29.2834955974544, 40.8568547122426], // [longitude, latitude]
    distanceFromStart: 58.50 // km from Halkalı
  },
  {
    id: '280',
    name: 'Tersane',
    coordinates: [29.2733636213888, 40.8609774863764], // [longitude, latitude]
    distanceFromStart: 57.40 // km from Halkalı
  },
  {
    id: '281',
    name: 'Kaynarca',
    coordinates: [29.2560336339024, 40.8713029434192], // [longitude, latitude]
    distanceFromStart: 55.59 // km from Halkalı
  },
  {
    id: '282',
    name: 'Pendik',
    coordinates: [29.2316720558041, 40.8802067715332], // [longitude, latitude]
    distanceFromStart: 52.96 // km from Halkalı
  },
  {
    id: '283',
    name: 'Yunus',
    coordinates: [29.2105353314047, 40.8845046267267], // [longitude, latitude]
    distanceFromStart: 50.67 // km from Halkalı
  },
  {
    id: '284',
    name: 'Kartal',
    coordinates: [29.1911901410005, 40.8886128831676], // [longitude, latitude]
    distanceFromStart: 48.57 // km from Halkalı
  },
  {
    id: '285',
    name: 'Başak',
    coordinates: [29.1773527136764, 40.8905590782827], // [longitude, latitude]
    distanceFromStart: 47.08 // km from Halkalı
  },
  {
    id: '286',
    name: 'Atalar',
    coordinates: [29.1694542074836, 40.8985880196095], // [longitude, latitude]
    distanceFromStart: 46.27 // km from Halkalı
  },
  {
    id: '287',
    name: 'Cevizli',
    coordinates: [29.1560454699434, 40.9100151224824], // [longitude, latitude]
    distanceFromStart: 44.94 // km from Halkalı
  },
  {
    id: '288',
    name: 'Maltepe',
    coordinates: [29.1335259970986, 40.9206463835831], // [longitude, latitude]
    distanceFromStart: 42.53 // km from Halkalı
  },
  {
    id: '289',
    name: 'Süreyya Plajı',
    coordinates: [29.1242047148349, 40.9268299858791], // [longitude, latitude]
    distanceFromStart: 41.53 // km from Halkalı
  },
  {
    id: '290',
    name: 'İdealtepe',
    coordinates: [29.1142558579521, 40.9378068714961], // [longitude, latitude]
    distanceFromStart: 40.46 // km from Halkalı
  },
  {
    id: '291',
    name: 'Küçükyalı',
    coordinates: [29.1068216034401, 40.9462573975736], // [longitude, latitude]
    distanceFromStart: 39.71 // km from Halkalı
  },
  {
    id: '292',
    name: 'Bostancı',
    coordinates: [29.0950591485625, 40.9538001484529], // [longitude, latitude]
    distanceFromStart: 38.46 // km from Halkalı
  },
  {
    id: '293',
    name: 'Suadiye',
    coordinates: [29.0844186912134, 40.9604752408322], // [longitude, latitude]
    distanceFromStart: 37.33 // km from Halkalı
  },
  {
    id: '294',
    name: 'Erenköy',
    coordinates: [29.0764726675955, 40.9714092751695], // [longitude, latitude]
    distanceFromStart: 36.49 // km from Halkalı
  },
  {
    id: '295',
    name: 'Göztepe',
    coordinates: [29.0625591735035, 40.9791648388466], // [longitude, latitude]
    distanceFromStart: 34.93 // km from Halkalı
  },
  {
    id: '296',
    name: 'Feneryolu',
    coordinates: [29.0490084626684, 40.9786961509793], // [longitude, latitude]
    distanceFromStart: 33.45 // km from Halkalı
  },
  {
    id: '297',
    name: 'Söğütlüçeşme',
    coordinates: [29.0376279458605, 40.990902337839], // [longitude, latitude]
    distanceFromStart: 32.25 // km from Halkalı
  },
  {
    id: '298',
    name: 'Çayırova',
    coordinates: [29.3475125745724, 40.8104982886506], // [longitude, latitude]
    distanceFromStart: 65.81 // km from Halkalı
  },
  {
    id: '299',
    name: 'Fatih',
    coordinates: [29.3639258834218, 40.8076260643992], // [longitude, latitude]
    distanceFromStart: 67.64 // km from Halkalı
  },
  {
    id: '300',
    name: 'Osmangazi',
    coordinates: [29.3800141019468, 40.7992722879167], // [longitude, latitude]
    distanceFromStart: 69.42 // km from Halkalı
  },
  {
    id: '301',
    name: 'Darıca',
    coordinates: [29.3918381727911, 40.7914192062897], // [longitude, latitude]
    distanceFromStart: 70.72 // km from Halkalı
  },
  {
    id: '302',
    name: 'Gebze',
    coordinates: [29.4095634828195, 40.7842492519915], // [longitude, latitude]
    distanceFromStart: 72.70 // km from Halkalı
  }
];