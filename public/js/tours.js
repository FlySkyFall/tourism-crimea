document.addEventListener('DOMContentLoaded', () => {
  console.log('tours.js loaded');

  // Собственная функция debounce
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Селекторы элементов
  const filterForm = document.querySelector('#tour-filter-form');
  const filterBtn = document.querySelector('#filter-btn');
  const resetBtn = document.querySelector('#reset-btn');
  const typeFilter = document.querySelector('#type');
  const searchInput = document.querySelector('#search');
  const regionFilter = document.querySelector('#region');
  const minPriceInput = document.querySelector('#minPrice');
  const maxPriceInput = document.querySelector('#maxPrice');
  const startDateInput = document.querySelector('#startDate');
  const endDateInput = document.querySelector('#endDate');
  const sortByFilter = document.querySelector('#sortBy');
  const minDurationInput = document.querySelector('#minDuration');
  const maxDurationInput = document.querySelector('#maxDuration');
  const amenitiesFilter = document.querySelector('#amenities');
  const toursList = document.querySelector('div.grid[data-initial="true"]');
  const pagination = document.querySelector('div.mt-8.flex');
  const pageInfo = document.querySelector('p.text-gray-600');

  // Логирование найденных элементов
  console.log('Found elements:', {
    filterForm: !!filterForm,
    filterBtn: !!filterBtn,
    resetBtn: !!resetBtn,
    typeFilter: !!typeFilter,
    searchInput: !!searchInput,
    regionFilter: !!regionFilter,
    minPriceInput: !!minPriceInput,
    maxPriceInput: !!maxPriceInput,
    startDateInput: !!startDateInput,
    endDateInput: !!endDateInput,
    sortByFilter: !!sortByFilter,
    minDurationInput: !!minDurationInput,
    maxDurationInput: !!maxDurationInput,
    amenitiesFilter: !!amenitiesFilter,
    toursList: !!toursList,
    pagination: !!pagination,
    pageInfo: !!pageInfo
  });

  if (!filterForm) console.error('Filter form not found');
  if (!toursList) console.error('Tours list not found');
  if (!pageInfo) console.warn('Page info not found');

  // Функция для получения значений фильтров
  const getFilterValues = () => ({
    type: typeFilter ? typeFilter.value : 'all',
    search: searchInput ? searchInput.value.trim() : '',
    region: regionFilter ? regionFilter.value : '',
    minPrice: minPriceInput ? minPriceInput.value.trim() : '',
    maxPrice: maxPriceInput ? maxPriceInput.value.trim() : '',
    startDate: startDateInput ? startDateInput.value : '',
    endDate: endDateInput ? endDateInput.value : '',
    sortBy: sortByFilter ? (sortByFilter.value ? `${sortByFilter.value.split('-')[0]}-${sortByFilter.value.split('-')[1] || 'asc'}` : '') : '',
    minDuration: minDurationInput ? minDurationInput.value.trim() : '',
    maxDuration: maxDurationInput ? maxDurationInput.value.trim() : '',
    amenities: amenitiesFilter ? Array.from(amenitiesFilter.selectedOptions).map(opt => opt.value).join(',') : ''
  });

  // Функция перевода типов туров
  const translateTourType = (type) => {
    const translations = {
      'active': 'Активный',
      'passive': 'Пассивный',
      'camping': 'Кемпинг',
      'excursion': 'Экскурсионный',
      'health': 'Оздоровительный'
    };
    return translations[type] || type;
  };

  // Debounced функция для поиска
  const debounceSearch = debounce((values) => {
    applyFilters(values.type, 1, values.search, values.region, values.minPrice, values.maxPrice, values.startDate, values.endDate, values.sortBy, values.minDuration, values.maxDuration, values.amenities);
  }, 300);

  // Функция для применения фильтров через AJAX
  const applyFilters = async (type = 'all', page = 1, search = '', region = '', minPrice = '', maxPrice = '', startDate = '', endDate = '', sortBy = '', minDuration = '', maxDuration = '', amenities = '') => {
    try {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', encodeURIComponent(type));
      if (page !== 1) params.append('page', page);
      if (search) params.append('search', encodeURIComponent(search));
      if (region) params.append('region', encodeURIComponent(region));
      if (minPrice) params.append('minPrice', encodeURIComponent(minPrice));
      if (maxPrice) params.append('maxPrice', encodeURIComponent(maxPrice));
      if (startDate) params.append('startDate', encodeURIComponent(startDate));
      if (endDate) params.append('endDate', encodeURIComponent(endDate));
      if (sortBy) params.append('sortBy', encodeURIComponent(sortBy));
      if (minDuration) params.append('minDuration', encodeURIComponent(minDuration));
      if (maxDuration) params.append('maxDuration', encodeURIComponent(maxDuration));
      if (amenities) params.append('amenities', encodeURIComponent(amenities));
      const url = `/tours/filter?${params.toString()}`;
      console.log('Sending fetch to:', url);
      console.log('Fetch parameters:', { type, page, search, region, minPrice, maxPrice, startDate, endDate, sortBy, minDuration, maxDuration, amenities });

      if (toursList) {
        toursList.innerHTML = '<p class="text-center text-gray-600 col-span-3">Загрузка...</p>';
      }

      const response = await fetch(url);
      console.log('Fetch response status:', response.status, 'Content-Type:', response.headers.get('Content-Type'));

      if (!response.ok) {
        const text = await response.text();
        console.error('Response text:', text.slice(0, 200));
        throw new Error(`HTTP error ${response.status}: ${text.slice(0, 100)}...`);
      }

      if (!response.headers.get('Content-Type').includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.slice(0, 200));
        throw new Error('Сервер вернул не JSON-ответ');
      }

      const data = await response.json();
      console.log('Fetch data received:', data);

      if (page > data.totalPages && data.totalPages > 0) {
        console.log(`Page ${page} exceeds totalPages ${data.totalPages}, redirecting to last page`);
        return applyFilters(type, data.totalPages, search, region, minPrice, maxPrice, startDate, endDate, sortBy, minDuration, maxDuration, amenities);
      }

      if (toursList && data.tours && Array.isArray(data.tours)) {
        toursList.innerHTML = data.tours.length
          ? data.tours.map(tour => `
              <div class="bg-white rounded-lg shadow-md overflow-hidden relative ${tour.isHotDeal ? 'hot-deal' : ''}">
                ${tour.isHotDeal ? '<span class="hot-deal-badge">🔥 Горящий тур!</span>' : ''}
                <img src="${tour.images && Array.isArray(tour.images) && tour.images.length ? tour.images[0] : '/images/default-tour.jpg'}" alt="${tour.title || 'Без названия'}" class="w-full h-48 object-cover">
                <div class="p-4">
                  <h3 class="text-lg font-semibold mb-2">${tour.title || 'Без названия'}</h3>
                  <p class="text-gray-600 mb-2">${tour.location?.region || 'Не указан'}</p>
                  <p class="text-gray-600 mb-2">Длительность: ${tour.durationDays || 1} дней</p>
                  <p class="text-gray-600 mb-2">Тип: ${translateTourType(tour.type || 'passive')}</p>
                  <div class="flex items-center mb-2">
                    <span class="text-yellow-500">★ ${tour.rating || 0}</span>
                    <span class="text-gray-500 ml-2">(${tour.reviewsCount || 0} отзывов)</span>
                  </div>
                  <p class="text-lg font-bold text-gray-800">
                    ${tour.discounts?.groupDiscount?.enabled ? `<span class="text-green-600 block text-sm">Скидка ${tour.discounts.groupDiscount.percentage || 0}% за группу от ${tour.discounts.groupDiscount.minParticipants || 0} чел.</span>` : ''}
                    ${tour.discounts?.seasonalDiscount?.enabled ? `<span class="text-green-600 block text-sm">Сезонная скидка ${tour.discounts.seasonalDiscount.percentage || 0}% до ${tour.discounts.seasonalDiscount.endDate ? new Date(tour.discounts.seasonalDiscount.endDate).toLocaleDateString('ru-RU') : ''}</span>` : ''}
                    ${tour.isHotDeal && tour.discounts?.hotDealDiscount?.enabled ? `<span class="text-green-600 block text-sm">Скидка горящего тура ${tour.discounts.hotDealDiscount.percentage || 0}%</span>` : ''}
                    Цена: ${(tour.price || 0).toLocaleString('ru-RU')} ₽ / чел.
                  </p>
                  <a href="/tours/${tour._id}" class="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Подробнее</a>
                </div>
              </div>
            `).join('')
          : '<p class="text-center text-gray-600 col-span-3">Нет доступных туров для выбранных фильтров</p>';
      } else {
        console.warn('Tours data is invalid or empty:', data.tours);
        if (toursList) {
          toursList.innerHTML = '<p class="text-center text-red-600 col-span-3">Ошибка загрузки туров</p>';
        }
      }

      if (pagination) {
        pagination.innerHTML = `
          <p class="text-gray-600">Показано ${data.toursOnPage || 0} из ${data.totalTours || 0} туров</p>
          <div class="flex space-x-2">
            ${data.currentPage > 1 ? `<a href="#" data-page="${data.currentPage - 1}" class="pagination-btn px-4 py-2 bg-gray-200 rounded-md">Назад</a>` : '<span class="pagination-btn px-4 py-2 bg-gray-200 rounded-md opacity-50 cursor-not-allowed">Назад</span>'}
            <span class="px-4 py-2">Страница ${data.currentPage || 1} из ${data.totalPages || 1}</span>
            ${data.currentPage < data.totalPages ? `<a href="#" data-page="${data.currentPage + 1}" class="pagination-btn px-4 py-2 bg-gray-200 rounded-md">Вперёд</a>` : '<span class="pagination-btn px-4 py-2 bg-gray-200 rounded-md opacity-50 cursor-not-allowed">Вперёд</span>'}
          </div>
        `;
      }

      if (pageInfo) {
        pageInfo.textContent = `Показано ${data.toursOnPage || 0} из ${data.totalTours || 0} туров`;
      }

      const newUrl = `/tours?type=${encodeURIComponent(type)}${page !== 1 ? `&page=${page}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${region ? `&region=${encodeURIComponent(region)}` : ''}${minPrice ? `&minPrice=${encodeURIComponent(minPrice)}` : ''}${maxPrice ? `&maxPrice=${encodeURIComponent(maxPrice)}` : ''}${startDate ? `&startDate=${encodeURIComponent(startDate)}` : ''}${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ''}${sortBy ? `&sortBy=${encodeURIComponent(sortBy)}` : ''}${minDuration ? `&minDuration=${encodeURIComponent(minDuration)}` : ''}${maxDuration ? `&maxDuration=${encodeURIComponent(maxDuration)}` : ''}${amenities ? `&amenities=${encodeURIComponent(amenities)}` : ''}`;
      history.pushState({ type, page, search, region, minPrice, maxPrice, startDate, endDate, sortBy, minDuration, maxDuration, amenities }, '', newUrl);

      if (pagination) {
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(btn.getAttribute('data-page'));
            applyFilters(type, page, search, region, minPrice, maxPrice, startDate, endDate, sortBy, minDuration, maxDuration, amenities);
          });
        });
      }
    } catch (error) {
      console.error('Ошибка фильтрации:', error.message, error.stack);
      if (toursList) {
        toursList.innerHTML = `<p class="text-center text-red-600 col-span-3">Ошибка фильтрации: ${error.message}</p>`;
      }
    }
  };

  // Обработчик для кнопки применения фильтров
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      console.log('Filter button clicked');
      const values = getFilterValues();
      console.log('Applying filters:', values);
      applyFilters(values.type, 1, values.search, values.region, values.minPrice, values.maxPrice, values.startDate, values.endDate, values.sortBy, values.minDuration, values.maxDuration, values.amenities);
    });
  }

  // Обработчик для кнопки сброса фильтров
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      console.log('Reset button clicked');
      if (filterForm) filterForm.reset();
      if (amenitiesFilter) Array.from(amenitiesFilter.options).forEach(opt => opt.selected = false);
      applyFilters('all', 1);
    });
  }

  // Обработчики для интерактивных фильтров
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      console.log('Search input changed:', searchInput.value);
      debounceSearch(getFilterValues());
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      console.log('Type filter changed:', typeFilter.value);
      applyFilters(getFilterValues().type, 1, getFilterValues().search, getFilterValues().region, getFilterValues().minPrice, getFilterValues().maxPrice, getFilterValues().startDate, getFilterValues().endDate, getFilterValues().sortBy, getFilterValues().minDuration, getFilterValues().maxDuration, getFilterValues().amenities);
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener('change', () => {
      console.log('Region filter changed:', regionFilter.value);
      applyFilters(getFilterValues().type, 1, getFilterValues().search, getFilterValues().region, getFilterValues().minPrice, getFilterValues().maxPrice, getFilterValues().startDate, getFilterValues().endDate, getFilterValues().sortBy, getFilterValues().minDuration, getFilterValues().maxDuration, getFilterValues().amenities);
    });
  }

  if (sortByFilter) {
    sortByFilter.addEventListener('change', () => {
      console.log('Sort by filter changed:', sortByFilter.value);
      applyFilters(getFilterValues().type, 1, getFilterValues().search, getFilterValues().region, getFilterValues().minPrice, getFilterValues().maxPrice, getFilterValues().startDate, getFilterValues().endDate, getFilterValues().sortBy, getFilterValues().minDuration, getFilterValues().maxDuration, getFilterValues().amenities);
    });
  }

  if (minPriceInput) {
    minPriceInput.addEventListener('input', () => {
      console.log('Min price changed:', minPriceInput.value);
      debounceSearch(getFilterValues());
    });
  }

  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', () => {
      console.log('Max price changed:', maxPriceInput.value);
      debounceSearch(getFilterValues());
    });
  }

  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      console.log('Start date changed:', startDateInput.value);
      applyFilters(getFilterValues().type, 1, getFilterValues().search, getFilterValues().region, getFilterValues().minPrice, getFilterValues().maxPrice, getFilterValues().startDate, getFilterValues().endDate, getFilterValues().sortBy, getFilterValues().minDuration, getFilterValues().maxDuration, getFilterValues().amenities);
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', () => {
      console.log('End date changed:', endDateInput.value);
      applyFilters(getFilterValues().type, 1, getFilterValues().search, getFilterValues().region, getFilterValues().minPrice, getFilterValues().maxPrice, getFilterValues().startDate, getFilterValues().endDate, getFilterValues().sortBy, getFilterValues().minDuration, getFilterValues().maxDuration, getFilterValues().amenities);
    });
  }

  if (minDurationInput) {
    minDurationInput.addEventListener('input', () => {
      console.log('Min duration changed:', minDurationInput.value);
      debounceSearch(getFilterValues());
    });
  }

  if (maxDurationInput) {
    maxDurationInput.addEventListener('input', () => {
      console.log('Max duration changed:', maxDurationInput.value);
      debounceSearch(getFilterValues());
    });
  }

  if (amenitiesFilter) {
    amenitiesFilter.addEventListener('change', () => {
      console.log('Amenities filter changed:', Array.from(amenitiesFilter.selectedOptions).map(opt => opt.value));
      applyFilters(getFilterValues().type, 1, getFilterValues().search, getFilterValues().region, getFilterValues().minPrice, getFilterValues().maxPrice, getFilterValues().startDate, getFilterValues().endDate, getFilterValues().sortBy, getFilterValues().minDuration, getFilterValues().maxDuration, getFilterValues().amenities);
    });
  }

  // Обработчик для восстановления состояния при навигации "Назад"
  window.onpopstate = () => {
    console.log('Popstate event triggered, current URL:', window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'all';
    const page = parseInt(urlParams.get('page')) || 1;
    const search = urlParams.get('search') || '';
    const region = urlParams.get('region') || '';
    const minPrice = urlParams.get('minPrice') || '';
    const maxPrice = urlParams.get('maxPrice') || '';
    const startDate = urlParams.get('startDate') || '';
    const endDate = urlParams.get('endDate') || '';
    const sortBy = urlParams.get('sortBy') || '';
    const minDuration = urlParams.get('minDuration') || '';
    const maxDuration = urlParams.get('maxDuration') || '';
    const amenities = urlParams.get('amenities') || '';
    console.log('Restoring filters from URL:', { type, page, search, region, minPrice, maxPrice, startDate, endDate, sortBy, minDuration, maxDuration, amenities });

    // Обновляем значения фильтров в форме
    if (typeFilter) typeFilter.value = type;
    if (searchInput) searchInput.value = search;
    if (regionFilter) regionFilter.value = region;
    if (minPriceInput) minPriceInput.value = minPrice;
    if (maxPriceInput) maxPriceInput.value = maxPrice;
    if (startDateInput) startDateInput.value = startDate;
    if (endDateInput) endDateInput.value = endDate;
    if (sortByFilter) sortByFilter.value = sortBy;
    if (minDurationInput) minDurationInput.value = minDuration;
    if (maxDurationInput) maxDurationInput.value = maxDuration;
    if (amenitiesFilter) {
      const selectedAmenities = amenities.split(',');
      Array.from(amenitiesFilter.options).forEach(opt => {
        opt.selected = selectedAmenities.includes(opt.value);
      });
    }

    // Не перенаправляем, а просто обновляем содержимое через AJAX
    applyFilters(type, page, search, region, minPrice, maxPrice, startDate, endDate, sortBy, minDuration, maxDuration, amenities);
  };

  // Инициализация текущих фильтров из URL при загрузке
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type') || 'all';
  const initialPage = parseInt(urlParams.get('page')) || 1;
  const initialSearch = urlParams.get('search') || '';
  const initialRegion = urlParams.get('region') || '';
  const initialMinPrice = urlParams.get('minPrice') || '';
  const initialMaxPrice = urlParams.get('maxPrice') || '';
  const initialStartDate = urlParams.get('startDate') || '';
  const initialEndDate = urlParams.get('endDate') || '';
  const initialSortBy = urlParams.get('sortBy') || '';
  const initialMinDuration = urlParams.get('minDuration') || '';
  const initialMaxDuration = urlParams.get('maxDuration') || '';
  const initialAmenities = urlParams.get('amenities') || '';
  console.log('Initial filters from URL:', { initialType, initialPage, initialSearch, initialRegion, initialMinPrice, initialMaxPrice, initialStartDate, initialEndDate, initialSortBy, initialMinDuration, initialMaxDuration, initialAmenities });

  if (typeFilter) typeFilter.value = initialType;
  if (searchInput) searchInput.value = initialSearch;
  if (regionFilter) regionFilter.value = initialRegion;
  if (minPriceInput) minPriceInput.value = initialMinPrice;
  if (maxPriceInput) maxPriceInput.value = initialMaxPrice;
  if (startDateInput) startDateInput.value = initialStartDate;
  if (endDateInput) endDateInput.value = initialEndDate;
  if (sortByFilter) sortByFilter.value = initialSortBy;
  if (minDurationInput) minDurationInput.value = initialMinDuration;
  if (maxDurationInput) maxDurationInput.value = initialMaxDuration;
  if (amenitiesFilter) {
    const selectedAmenities = initialAmenities.split(',');
    Array.from(amenitiesFilter.options).forEach(opt => {
      opt.selected = selectedAmenities.includes(opt.value);
    });
  }

  // Применяем фильтры только если они есть
  if (initialType !== 'all' || initialSearch || initialRegion || initialMinPrice || initialMaxPrice || initialStartDate || initialEndDate || initialSortBy || initialMinDuration || initialMaxDuration || initialAmenities) {
    applyFilters(initialType, initialPage, initialSearch, initialRegion, initialMinPrice, initialMaxPrice, initialStartDate, initialEndDate, initialSortBy, initialMinDuration, initialMaxDuration, initialAmenities);
  }
});