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
  if (tourMapElement && window.tourData && window.tourData.location && window.tourData.location.coordinates && 
      typeof window.tourData.location.coordinates.lat === 'number' && 
      typeof window.tourData.location.coordinates.lng === 'number') {
    console.log('Initializing tour map:', window.tourData.location.coordinates);
    if (!tourMapElement._leaflet_id) { // Используем _leaflet_id для проверки инициализации
      const tourMap = L.map('tourMap').setView([window.tourData.location.coordinates.lat, window.tourData.location.coordinates.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(tourMap);
      L.marker([window.tourData.location.coordinates.lat, window.tourData.location.coordinates.lng])
        .addTo(tourMap)
        .bindPopup(window.tourData.title || 'Тур')
        .openPopup();
    } else {
      console.log('Tour map already initialized, skipping.');
    }
  } else {
    console.warn('Tour map not initialized due to missing or invalid data:', { tourMapElement, tourData: window.tourData });
  }

  // Карта маршрута для экскурсионного тура
  const routeMapElement = document.getElementById('routeMap');
  if (routeMapElement && window.tourData && window.tourData.type === 'excursion') {
    console.log('Route map check:', { route: window.tourData.route, isArray: Array.isArray(window.tourData.route), length: window.tourData.route ? window.tourData.route.length : 0 });
    if (window.tourData.route && Array.isArray(window.tourData.route) && window.tourData.route.length > 0) {
      console.log('Initializing route map with route:', window.tourData.route);
      if (!routeMapElement._leaflet_id) {
        const routeMap = L.map('routeMap').setView([window.tourData.route[0].lat, window.tourData.route[0].lng], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(routeMap);

        // Отрисовка маршрута
        const latLngs = window.tourData.route.map(point => [point.lat, point.lng]);
        if (latLngs.length > 0) {
          L.polyline(latLngs, { color: 'blue' }).addTo(routeMap);
        } else {
          console.warn('No valid route points found:', window.tourData.route);
        }

        // Добавление маркеров на ключевые точки
        window.tourData.route.forEach((point, index) => {
          if (point.lat && point.lng) {
            L.marker([point.lat, point.lng], { icon: regionIcon })
              .addTo(routeMap)
              .bindPopup(`Точка ${index + 1}`)
              .openPopup();
          } else {
            console.warn(`Invalid point at index ${index}:`, point);
          }
        });

        routeMapElement.classList.add('active'); // Показываем карту маршрута
      } else {
        console.log('Route map already initialized, skipping.');
      }
    } else {
      console.warn('Route data is invalid or empty:', window.tourData.route);
      routeMapElement.style.display = 'none';
    }
  } else {
    console.warn('Route map not initialized due to missing or invalid data:', { routeMapElement, tourData: window.tourData });
  }

  // Карта для региона (только если элемент существует)
  const regionMapElement = document.getElementById('regionMap');
  if (regionMapElement && window.regionData && window.regionData.coordinates && 
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
  }

  // Карта для достопримечательности (только если элемент существует)
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