import type { City } from './types'

export const CITIES: City[] = [
  // NSW - Sydney region
  { name: 'Sydney CBD', state: 'NSW', lat: -33.8688, lng: 151.2093, nationId: 'gadigal', nativeName: 'Warrane / Cadi', nativeLandUrl: 'https://native-land.ca/maps/territories/gadigal/' },
  { name: 'Bondi Beach', state: 'NSW', lat: -33.8908, lng: 151.2743, nationId: 'gadigal', nativeName: 'Bundi (Boondi)' },
  { name: 'Manly', state: 'NSW', lat: -33.7969, lng: 151.2869, nationId: 'garigal', nativeName: 'Manly Cove' },
  { name: 'Parramatta', state: 'NSW', lat: -33.8150, lng: 151.0011, nationId: 'dharug', nativeName: 'Burramatta', nativeLandUrl: 'https://native-land.ca/maps/territories/darug/' },
  { name: 'Penrith', state: 'NSW', lat: -33.7511, lng: 150.6942, nationId: 'dharug' },
  { name: 'Blacktown', state: 'NSW', lat: -33.7716, lng: 150.9056, nationId: 'dharug' },
  { name: 'Windsor', state: 'NSW', lat: -33.6111, lng: 150.8125, nationId: 'dharug' },
  { name: 'Katoomba', state: 'NSW', lat: -33.7132, lng: 150.3126, nationId: 'gundungurra' },
  { name: 'Wollongong', state: 'NSW', lat: -34.4278, lng: 150.8931, nationId: 'dharawal', nativeName: 'Woolyungah', nativeLandUrl: 'https://native-land.ca/maps/territories/dharawal/' },
  { name: 'Nowra', state: 'NSW', lat: -34.8780, lng: 150.6000, nationId: 'dharawal' },
  { name: 'Kiama', state: 'NSW', lat: -34.6710, lng: 150.8555, nationId: 'dharawal' },
  { name: 'Newcastle', state: 'NSW', lat: -32.9283, lng: 151.7817, nationId: 'awabakal', nativeName: 'Mulubinba', nativeLandUrl: 'https://native-land.ca/maps/territories/awabakal/' },
  { name: 'Maitland', state: 'NSW', lat: -32.7333, lng: 151.5500, nationId: 'awabakal' },
  { name: 'Cessnock', state: 'NSW', lat: -32.8333, lng: 151.3500, nationId: 'awabakal' },
  // NSW - Northern
  { name: 'Byron Bay', state: 'NSW', lat: -28.6473, lng: 153.6154, nationId: 'bundjalung', nativeName: 'Cavanbah', nativeLandUrl: 'https://native-land.ca/maps/territories/bundjalung/' },
  { name: 'Lismore', state: 'NSW', lat: -28.8145, lng: 153.2778, nationId: 'bundjalung' },
  { name: 'Ballina', state: 'NSW', lat: -28.8654, lng: 153.5621, nationId: 'bundjalung' },
  { name: 'Grafton', state: 'NSW', lat: -29.6910, lng: 152.9340, nationId: 'bundjalung' },
  { name: 'Casino', state: 'NSW', lat: -28.8653, lng: 153.0430, nationId: 'bundjalung' },
  { name: 'Coffs Harbour', state: 'NSW', lat: -30.2963, lng: 153.1135, nationId: 'gumbainggir' },
  { name: 'Port Macquarie', state: 'NSW', lat: -31.4296, lng: 152.9090, nationId: 'birpai' },
  { name: 'Tamworth', state: 'NSW', lat: -31.0927, lng: 150.9320, nationId: 'gamilaroi', nativeLandUrl: 'https://native-land.ca/maps/territories/gamilaraay/' },
  { name: 'Moree', state: 'NSW', lat: -29.4675, lng: 149.8380, nationId: 'gamilaroi' },
  { name: 'Narrabri', state: 'NSW', lat: -30.3210, lng: 149.7830, nationId: 'gamilaroi' },
  { name: 'Inverell', state: 'NSW', lat: -29.7707, lng: 151.1139, nationId: 'gamilaroi' },
  // NSW - Central/Western
  { name: 'Orange', state: 'NSW', lat: -33.2833, lng: 149.1000, nationId: 'wiradjuri', nativeLandUrl: 'https://native-land.ca/maps/territories/wiradjuri/' },
  { name: 'Dubbo', state: 'NSW', lat: -32.2569, lng: 148.6011, nationId: 'wiradjuri', nativeName: 'Tubba-gah' },
  { name: 'Wagga Wagga', state: 'NSW', lat: -35.1082, lng: 147.3598, nationId: 'wiradjuri' },
  { name: 'Bathurst', state: 'NSW', lat: -33.4194, lng: 149.5778, nationId: 'wiradjuri' },
  { name: 'Griffith', state: 'NSW', lat: -34.2886, lng: 146.0400, nationId: 'wiradjuri' },
  { name: 'Broken Hill', state: 'NSW', lat: -31.9505, lng: 141.4700, nationId: 'wilyakali', nativeName: 'Willyama' },
  // NSW - South Coast
  { name: 'Batemans Bay', state: 'NSW', lat: -35.7073, lng: 150.1742, nationId: 'yuin' },
  { name: 'Narooma', state: 'NSW', lat: -36.2124, lng: 150.1337, nationId: 'yuin' },
  // ACT
  { name: 'Canberra', state: 'ACT', lat: -35.2809, lng: 149.1300, nationId: 'ngunnawal', nativeName: 'Ngambri / Kambera', nativeLandUrl: 'https://native-land.ca/maps/territories/ngunnawal/' },
  // VIC - Melbourne region
  { name: 'Melbourne CBD', state: 'VIC', lat: -37.8136, lng: 144.9631, nationId: 'wurundjeri', nativeName: 'Naarm', nativeLandUrl: 'https://native-land.ca/maps/territories/wurundjeri/' },
  { name: 'Richmond', state: 'VIC', lat: -37.8182, lng: 145.0008, nationId: 'wurundjeri' },
  { name: 'Fitzroy', state: 'VIC', lat: -37.7995, lng: 144.9778, nationId: 'wurundjeri' },
  { name: 'Heidelberg', state: 'VIC', lat: -37.7573, lng: 145.0607, nationId: 'wurundjeri' },
  { name: 'Healesville', state: 'VIC', lat: -37.6535, lng: 145.5122, nationId: 'wurundjeri' },
  { name: 'St Kilda', state: 'VIC', lat: -37.8655, lng: 144.9811, nationId: 'boonwurrung' },
  { name: 'Frankston', state: 'VIC', lat: -38.1442, lng: 145.1263, nationId: 'boonwurrung' },
  { name: 'Mornington', state: 'VIC', lat: -38.2195, lng: 145.0375, nationId: 'boonwurrung' },
  { name: 'Rosebud', state: 'VIC', lat: -38.3611, lng: 144.9063, nationId: 'boonwurrung' },
  // VIC - Geelong/Ballarat
  { name: 'Geelong', state: 'VIC', lat: -38.1499, lng: 144.3617, nationId: 'wadawurrung', nativeName: 'Djillong' },
  { name: 'Ballarat', state: 'VIC', lat: -37.5622, lng: 143.8503, nationId: 'wadawurrung', nativeName: 'Ballarak' },
  { name: 'Bendigo', state: 'VIC', lat: -36.7570, lng: 144.2794, nationId: 'dja-dja-wurrung', nativeLandUrl: 'https://native-land.ca/maps/territories/djadjawurrung/' },
  { name: 'Castlemaine', state: 'VIC', lat: -37.0690, lng: 144.2184, nationId: 'dja-dja-wurrung' },
  { name: 'Shepparton', state: 'VIC', lat: -36.3830, lng: 145.3980, nationId: 'yorta-yorta' },
  { name: 'Echuca', state: 'VIC', lat: -36.1376, lng: 144.7503, nationId: 'yorta-yorta', nativeLandUrl: 'https://native-land.ca/maps/territories/yorta-yorta/' },
  { name: 'Warrnambool', state: 'VIC', lat: -38.3838, lng: 142.4820, nationId: 'gunditjmara', nativeLandUrl: 'https://native-land.ca/maps/territories/gunditjmara/' },
  { name: 'Portland', state: 'VIC', lat: -38.3430, lng: 141.6010, nationId: 'gunditjmara' },
  { name: 'Hamilton', state: 'VIC', lat: -37.7451, lng: 142.0199, nationId: 'gunditjmara' },
  // QLD
  { name: 'Brisbane CBD', state: 'QLD', lat: -27.4698, lng: 153.0251, nationId: 'turrbal', nativeName: 'Meanjin', nativeLandUrl: 'https://native-land.ca/maps/territories/turrbal/' },
  { name: 'South Brisbane', state: 'QLD', lat: -27.4800, lng: 153.0200, nationId: 'jagera' },
  { name: 'Ipswich', state: 'QLD', lat: -27.6166, lng: 152.7600, nationId: 'jagera' },
  { name: 'Gold Coast', state: 'QLD', lat: -28.0167, lng: 153.4000, nationId: 'yugambeh', nativeName: 'Kombumerri', nativeLandUrl: 'https://native-land.ca/maps/territories/yugambeh/' },
  { name: 'Surfers Paradise', state: 'QLD', lat: -28.0019, lng: 153.4310, nationId: 'yugambeh' },
  { name: 'Coolangatta', state: 'QLD', lat: -28.1690, lng: 153.5360, nationId: 'yugambeh' },
  { name: 'Tweed Heads', state: 'NSW', lat: -28.1778, lng: 153.5500, nationId: 'yugambeh' },
  { name: 'Sunshine Coast', state: 'QLD', lat: -26.6500, lng: 153.0667, nationId: 'gubbi-gubbi', nativeLandUrl: 'https://native-land.ca/maps/territories/gubbi-gubbi/' },
  { name: 'Noosa', state: 'QLD', lat: -26.3930, lng: 153.0839, nationId: 'gubbi-gubbi' },
  { name: 'Maroochydore', state: 'QLD', lat: -26.6530, lng: 153.0900, nationId: 'gubbi-gubbi' },
  { name: 'Caloundra', state: 'QLD', lat: -26.8040, lng: 153.1280, nationId: 'gubbi-gubbi' },
  { name: 'Toowoomba', state: 'QLD', lat: -27.5598, lng: 151.9507, nationId: 'jarowair' },
  { name: 'Rockhampton', state: 'QLD', lat: -23.3791, lng: 150.5100, nationId: 'darumbal' },
  { name: 'Mackay', state: 'QLD', lat: -21.1411, lng: 149.1861, nationId: 'yuwibara' },
  { name: 'Townsville', state: 'QLD', lat: -19.2590, lng: 146.8169, nationId: 'wulgurukaba', nativeName: 'Garbutt' },
  { name: 'Cairns', state: 'QLD', lat: -16.9186, lng: 145.7781, nationId: 'gimuy-walubara-yidinji', nativeName: 'Gimuy' },
  { name: 'Thursday Island', state: 'QLD', lat: -10.5842, lng: 142.2198, nationId: 'meriam', nativeName: 'Waiben' },
  // SA
  { name: 'Adelaide CBD', state: 'SA', lat: -34.9285, lng: 138.6007, nationId: 'kaurna', nativeName: 'Tarndanya', nativeLandUrl: 'https://native-land.ca/maps/territories/kaurna/' },
  { name: 'Glenelg', state: 'SA', lat: -34.9798, lng: 138.5145, nationId: 'kaurna' },
  { name: 'Norwood', state: 'SA', lat: -34.9268, lng: 138.6365, nationId: 'kaurna' },
  { name: 'Port Adelaide', state: 'SA', lat: -34.8495, lng: 138.5070, nationId: 'kaurna' },
  { name: 'Victor Harbor', state: 'SA', lat: -35.5520, lng: 138.6195, nationId: 'kaurna' },
  { name: 'Mount Gambier', state: 'SA', lat: -37.8282, lng: 140.7826, nationId: 'bunganditj', nativeName: 'Berrin' },
  { name: 'Whyalla', state: 'SA', lat: -33.0333, lng: 137.5833, nationId: 'barngarla' },
  { name: 'Port Augusta', state: 'SA', lat: -32.4939, lng: 137.7669, nationId: 'nukunu' },
  // WA
  { name: 'Perth CBD', state: 'WA', lat: -31.9505, lng: 115.8605, nationId: 'whadjuk-noongar', nativeName: 'Boorloo', nativeLandUrl: 'https://native-land.ca/maps/territories/noongar/' },
  { name: 'Fremantle', state: 'WA', lat: -32.0569, lng: 115.7439, nationId: 'whadjuk-noongar', nativeName: 'Walyalup' },
  { name: 'Subiaco', state: 'WA', lat: -31.9476, lng: 115.8273, nationId: 'whadjuk-noongar' },
  { name: 'Cottesloe', state: 'WA', lat: -31.9939, lng: 115.7578, nationId: 'whadjuk-noongar' },
  { name: 'Mandurah', state: 'WA', lat: -32.5252, lng: 115.7242, nationId: 'whadjuk-noongar' },
  { name: 'Bunbury', state: 'WA', lat: -33.3271, lng: 115.6411, nationId: 'wardandi-noongar' },
  { name: 'Kalgoorlie', state: 'WA', lat: -30.7333, lng: 121.4667, nationId: 'wongutha' },
  { name: 'Broome', state: 'WA', lat: -17.9614, lng: 122.2359, nationId: 'yawuru', nativeName: 'Rubibi', nativeLandUrl: 'https://native-land.ca/maps/territories/yawuru/' },
  { name: 'Port Hedland', state: 'WA', lat: -20.3132, lng: 118.6059, nationId: 'kariyarra' },
  { name: 'Geraldton', state: 'WA', lat: -28.7774, lng: 114.6150, nationId: 'yamaji' },
  // NT
  { name: 'Darwin CBD', state: 'NT', lat: -12.4634, lng: 130.8456, nationId: 'larrakia', nativeName: 'Garramilla', nativeLandUrl: 'https://native-land.ca/maps/territories/larrakia/' },
  { name: 'Palmerston', state: 'NT', lat: -12.4870, lng: 130.9836, nationId: 'larrakia' },
  { name: 'Alice Springs', state: 'NT', lat: -23.6980, lng: 133.8807, nationId: 'arrernte', nativeName: 'Mparntwe', nativeLandUrl: 'https://native-land.ca/maps/territories/arrernte/' },
  { name: 'Katherine', state: 'NT', lat: -14.4671, lng: 132.2638, nationId: 'jawoyn' },
  { name: 'Tennant Creek', state: 'NT', lat: -19.6524, lng: 134.1914, nationId: 'warumungu', nativeName: 'Jurnkkurakurr' },
  { name: 'Nhulunbuy', state: 'NT', lat: -12.1785, lng: 136.7733, nationId: 'yolngu', nativeName: 'Yirrkala area' },
  // TAS
  { name: 'Hobart', state: 'TAS', lat: -42.8821, lng: 147.3272, nationId: 'palawa', nativeName: 'Nipaluna', nativeLandUrl: 'https://native-land.ca/maps/territories/palawa/' },
  { name: 'Launceston', state: 'TAS', lat: -41.4388, lng: 147.1347, nationId: 'palawa', nativeName: 'Kanamaluka' },
  { name: 'Devonport', state: 'TAS', lat: -41.1776, lng: 146.3519, nationId: 'palawa' },
  { name: 'Burnie', state: 'TAS', lat: -41.0558, lng: 145.9082, nationId: 'palawa' },
  { name: 'Uluru', state: 'NT', lat: -25.3444, lng: 131.0369, nationId: 'anangu', nativeName: 'Uluru / Mutitjulu', nativeLandUrl: 'https://native-land.ca/maps/territories/anangu-pitjantjatjara-yankunytjatjara/' },
]

export function findNearestCity(lat: number, lng: number): City | null {
  if (CITIES.length === 0) return null
  let nearest = CITIES[0]
  let minDist = haversineDistance(lat, lng, CITIES[0].lat, CITIES[0].lng)
  for (const city of CITIES) {
    const d = haversineDistance(lat, lng, city.lat, city.lng)
    if (d < minDist) {
      minDist = d
      nearest = city
    }
  }
  return nearest
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.nativeName && c.nativeName.toLowerCase().includes(q)) ||
      c.state.toLowerCase() === q
  ).slice(0, 8)
}
