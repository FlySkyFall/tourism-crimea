document.addEventListener('DOMContentLoaded', () => {
  // Проверка, что Leaflet загружен
  if (typeof L === 'undefined') {
    console.error('Leaflet.js не загружен. Проверьте подключение скрипта.');
    return;
  }

  // Кастомные иконки
  const regionIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });

  const attractionIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [38, 61],
    iconAnchor: [19, 61],
    popupAnchor: [1, -54]
  });

  // Карта для тура
  const tourMapElement = document.getElementById('tourMap');
  if (tourMapElement && window.tourData && window.tourData.coordinates) {
    console.log('Initializing tour map:', window.tourData.coordinates);
    const tourMap = L.map('tourMap').setView([window.tourData.coordinates.lat, window.tourData.coordinates.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(tourMap);
    L.marker([window.tourData.coordinates.lat, window.tourData.coordinates.lng])
      .addTo(tourMap)
      .bindPopup(window.tourData.title)
      .openPopup();
  }

  // Карта для региона
  const regionMapElement = document.getElementById('regionMap');
  if (regionMapElement) {
    if (window.regionData && window.regionData.coordinates && 
        typeof window.regionData.coordinates.lat === 'number' && 
        typeof window.regionData.coordinates.lng === 'number') {
      console.log('Initializing region map:', window.regionData.coordinates);
      const regionMap = L.map('regionMap').setView([window.regionData.coordinates.lat, window.regionData.coordinates.lng], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(regionMap);
      const markers = L.markerClusterGroup();
      // Маркер региона
      markers.addLayer(L.marker([window.regionData.coordinates.lat, window.regionData.coordinates.lng], { icon: regionIcon })
        .bindPopup(window.regionData.name));
      // Маркеры достопримечательностей
      if (window.attractionsData && Array.isArray(window.attractionsData)) {
        console.log('Processing attractions:', window.attractionsData.length);
        window.attractionsData.forEach(attr => {
          if (attr && attr._id && attr.location && attr.location.coordinates && 
              typeof attr.location.coordinates.lat === 'number' && 
              typeof attr.location.coordinates.lng === 'number') {
            markers.addLayer(L.marker([attr.location.coordinates.lat, attr.location.coordinates.lng], { icon: attractionIcon })
              .bindPopup(`<a href="/attractions/${attr._id}">${attr.name}</a> (расстояние: ${(attr.distance / 1000).toFixed(2)} км)`));
          } else {
            console.warn('Invalid attraction data:', attr);
          }
        });
      } else {
        console.warn('No valid attractionsData available');
      }
      regionMap.addLayer(markers);
    } else {
      console.error('Invalid regionData for map:', window.regionData);
      regionMapElement.innerHTML = '<p class="text-red-600">Ошибка: невозможно загрузить карту из-за отсутствия координат региона.</p>';
    }
  } else {
    console.error('regionMap element not found');
  }

  // Карта для достопримечательности
  const attractionMapElement = document.getElementById('attractionMap');
  if (attractionMapElement && window.attractionData && window.attractionData.coordinates && 
      typeof window.attractionData.coordinates.lat === 'number' && 
      typeof window.attractionData.coordinates.lng === 'number') {
    console.log('Initializing attraction map:', window.attractionData.coordinates);
    const attractionMap = L.map('attractionMap').setView([window.attractionData.coordinates.lat, window.attractionData.coordinates.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(attractionMap);
    L.marker([window.attractionData.coordinates.lat, window.attractionData.coordinates.lng])
      .addTo(attractionMap)
      .bindPopup(window.attractionData.name)
      .openPopup();
  } else {
    console.error('Invalid attractionData for map:', window.attractionData);
    if (attractionMapElement) {
      attractionMapElement.innerHTML = '<p class="text-red-600">Ошибка: невозможно загрузить карту из-за отсутствия координат достопримечательности.</p>';
    }
  }

  // Карта для отеля
  const hotelMapElement = document.getElementById('hotelMap');
  if (hotelMapElement && window.hotelData && window.hotelData.coordinates) {
    console.log('Initializing hotel map:', window.hotelData.coordinates);
    const hotelMap = L.map('hotelMap').setView([window.hotelData.coordinates.lat, window.hotelData.coordinates.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(hotelMap);
    L.marker([window.hotelData.coordinates.lat, window.hotelData.coordinates.lng])
      .addTo(hotelMap)
      .bindPopup(window.hotelData.name)
      .openPopup();
  }
});