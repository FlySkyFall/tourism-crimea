document.addEventListener('DOMContentLoaded', () => {
  console.log('hotels.js loaded');
  const hotelsList = document.querySelector('.hotels-list');
  const pagination = document.querySelector('#pagination'); // Используем id для точной привязки
  const pageInfo = document.querySelector('.pagination + p');
  const searchInput = document.querySelector('#hotel-search');
  const regionFilter = document.querySelector('#region-filter');

  console.log('Found elements:', {
    hotelsList: !!hotelsList,
    pagination: !!pagination,
    pageInfo: !!pageInfo,
    searchInput: !!searchInput,
    regionFilter: !!regionFilter,
  });

  if (!pageInfo) console.warn('pageInfo element not found');

  const debounceSearch = _.debounce((value, page, region) => {
    fetchHotels(page, value, region);
  }, 300);

  // Инициализация фильтров из URL и полей формы
  const url = new URL(window.location);
  let currentFilters = {
    search: searchInput ? searchInput.value.trim() : url.searchParams.get('search') || '',
    region: regionFilter ? regionFilter.value : url.searchParams.get('region') || '',
  };

  const fetchHotels = async (page = 1, search = '', region = '') => {
    try {
      // Обновляем фильтры только если переданы новые значения
      if (search !== undefined) currentFilters.search = search.trim();
      if (region !== undefined) currentFilters.region = region.trim();

      const params = new URLSearchParams();
      params.append('page', page);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.region) params.append('region', currentFilters.region);
      const url = `/hotels?${params.toString()}`;
      console.log('Sending fetch to:', url, 'Params:', currentFilters);

      if (hotelsList) {
        hotelsList.innerHTML = '<p class="text-center text-gray-600">Загрузка...</p>';
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newHotelsList = doc.querySelector('.hotels-list');
      const newPagination = doc.querySelector('#pagination');
      const newPageInfo = doc.querySelector('.pagination + p');

      console.log('New hotels list found:', !!newHotelsList, 'Items:', newHotelsList?.childElementCount);

      if (hotelsList && newHotelsList) {
        hotelsList.innerHTML = newHotelsList.innerHTML;
      }
      if (pagination && newPagination) {
        pagination.innerHTML = newPagination.innerHTML;
      }
      if (pageInfo && newPageInfo) {
        pageInfo.innerHTML = newPageInfo.innerHTML;
      } else if (pageInfo) {
        pageInfo.innerHTML = 'Страница: ' + page;
      }

      // Синхронизация полей формы с сохраненными фильтрами, только если они пусты
      if (searchInput && !searchInput.value) searchInput.value = currentFilters.search;
      if (regionFilter && !regionFilter.value) regionFilter.value = currentFilters.region;

      history.pushState({}, '', url);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      if (hotelsList) {
        hotelsList.innerHTML = '<p class="text-center text-red-600">Ошибка загрузки отелей</p>';
      }
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchValue = searchInput.value.trim();
      currentFilters.search = searchValue;
      const regionValue = regionFilter ? regionFilter.value : '';
      console.log('Search input:', { searchValue, regionValue });
      fetchHotels(1, searchValue, regionValue); // Обновляем сразу
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener('change', () => {
      const searchValue = searchInput ? searchInput.value.trim() : '';
      const regionValue = regionFilter.value;
      currentFilters.region = regionValue;
      console.log('Region filter changed:', { regionValue, searchValue });
      fetchHotels(1, searchValue, regionValue);
    });
  }

  if (pagination) {
    pagination.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.closest('a');
      if (target) {
        const url = new URL(target.href);
        const page = url.searchParams.get('page') || 1;
        console.log('Target href:', target.href); // Отладка
        // Используем currentFilters как основу, дополняя параметрами из URL
        const search = currentFilters.search || url.searchParams.get('search') || '';
        const region = currentFilters.region || url.searchParams.get('region') || '';
        console.log('Pagination click:', { page, search, region });
        fetchHotels(page, search, region);
      }
    });
  }

  window.addEventListener('popstate', () => {
    const url = new URL(window.location);
    const page = url.searchParams.get('page') || 1;
    const search = url.searchParams.get('search') || currentFilters.search;
    const region = url.searchParams.get('region') || currentFilters.region;
    console.log('Popstate:', { page, search, region });
    fetchHotels(page, search, region);
  });

  // Инициализация при загрузке страницы
  const initialUrl = new URL(window.location);
  const initialPage = initialUrl.searchParams.get('page') || 1;
  const initialSearch = initialUrl.searchParams.get('search') || currentFilters.search;
  const initialRegion = initialUrl.searchParams.get('region') || currentFilters.region;
  console.log('Initial load:', { initialPage, initialSearch, initialRegion });
  fetchHotels(initialPage, initialSearch, initialRegion);
});