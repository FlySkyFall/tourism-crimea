document.addEventListener('DOMContentLoaded', () => {
  console.log('hotels.js loaded');
  const hotelsList = document.querySelector('.hotels-list');
  const pagination = document.querySelector('.pagination');
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

  const fetchHotels = async (page = 1, search = '', region = '') => {
    try {
      const params = new URLSearchParams();
      if (page !== 1) params.append('page', page);
      if (search) params.append('search', search); // Убрано encodeURIComponent
      if (region) params.append('region', region); // Убрано encodeURIComponent
      const url = `/hotels?${params.toString()}`;
      console.log('Sending fetch to:', url, 'Params:', { page, search, region });

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
      const newPagination = doc.querySelector('.pagination');
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
      const searchValue = searchInput.value;
      const regionValue = regionFilter ? regionFilter.value : '';
      console.log('Search input:', { searchValue, regionValue });
      debounceSearch(searchValue, 1, regionValue);
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener('change', () => {
      const searchValue = searchInput ? searchInput.value : '';
      const regionValue = regionFilter.value;
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
        const search = url.searchParams.get('search') || '';
        const region = url.searchParams.get('region') || '';
        console.log('Pagination click:', { page, search, region });
        fetchHotels(page, search, region);
      }
    });
  }

  window.addEventListener('popstate', () => {
    const url = new URL(window.location);
    const page = url.searchParams.get('page') || 1;
    const search = url.searchParams.get('search') || '';
    const region = url.searchParams.get('region') || '';
    console.log('Popstate:', { page, search, region });
    fetchHotels(page, search, region);
  });
});