document.addEventListener('DOMContentLoaded', () => {
  console.log('attractions.js loaded');
  const attractionsList = document.querySelector('.attractions-list');
  const pagination = document.querySelector('#pagination'); // Используем id для точной привязки
  const pageInfo = document.querySelector('.pagination + p');
  const searchInput = document.querySelector('#attraction-search');
  const regionFilter = document.querySelector('#region-filter');
  const categoryFilter = document.querySelector('#category-filter');

  console.log('Found elements:', {
    attractionsList: !!attractionsList,
    pagination: !!pagination,
    pageInfo: !!pageInfo,
    searchInput: !!searchInput,
    regionFilter: !!regionFilter,
    categoryFilter: !!categoryFilter,
  });

  if (!pageInfo) console.warn('pageInfo element not found');

  const debounceSearch = _.debounce((value, page, region, category) => {
    fetchAttractions(page, value, region, category);
  }, 300);

  // Инициализация фильтров из URL и полей формы
  const url = new URL(window.location);
  let currentFilters = {
    search: searchInput ? searchInput.value.trim() : url.searchParams.get('search') || '',
    region: regionFilter ? regionFilter.value : url.searchParams.get('region') || '',
    category: categoryFilter ? categoryFilter.value : url.searchParams.get('category') || '',
  };

  const fetchAttractions = async (page = 1, search = '', region = '', category = '') => {
    try {
      // Обновляем фильтры только если переданы новые значения
      if (search !== undefined) currentFilters.search = search.trim();
      if (region !== undefined) currentFilters.region = region.trim();
      if (category !== undefined) currentFilters.category = category.trim();

      const params = new URLSearchParams();
      params.append('page', page);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.region) params.append('region', currentFilters.region);
      if (currentFilters.category) params.append('category', currentFilters.category);
      const url = `/attractions?${params.toString()}`;
      console.log('Sending fetch to:', url, 'Current Filters:', currentFilters);

      if (attractionsList) {
        attractionsList.innerHTML = '<p class="text-center text-gray-600">Загрузка...</p>';
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newAttractionsList = doc.querySelector('.attractions-list');
      const newPagination = doc.querySelector('#pagination');
      const newPageInfo = doc.querySelector('.pagination + p');

      console.log('New attractions list found:', !!newAttractionsList, 'Items:', newAttractionsList?.childElementCount);

      if (attractionsList && newAttractionsList) {
        attractionsList.innerHTML = newAttractionsList.innerHTML;
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
      if (categoryFilter && !categoryFilter.value) categoryFilter.value = currentFilters.category;

      history.pushState({}, '', url);
    } catch (error) {
      console.error('Error fetching attractions:', error);
      if (attractionsList) {
        attractionsList.innerHTML = '<p class="text-center text-red-600">Ошибка загрузки достопримечательностей</p>';
      }
    }
  };

  // Обработчик ввода в поле поиска
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchValue = searchInput.value.trim();
      currentFilters.search = searchValue;
      const regionValue = regionFilter ? regionFilter.value : '';
      const categoryValue = categoryFilter ? categoryFilter.value : '';
      console.log('Search input:', { searchValue, regionValue, categoryValue });
      fetchAttractions(1, searchValue, regionValue, categoryValue); // Обновляем сразу
    });
  }

  // Обработчик изменения региона
  if (regionFilter) {
    regionFilter.addEventListener('change', () => {
      const searchValue = searchInput ? searchInput.value.trim() : '';
      const regionValue = regionFilter.value;
      currentFilters.region = regionValue;
      const categoryValue = categoryFilter ? categoryFilter.value : '';
      console.log('Region filter changed:', { regionValue, searchValue, categoryValue });
      fetchAttractions(1, searchValue, regionValue, categoryValue);
    });
  }

  // Обработчик изменения категории
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      const searchValue = searchInput ? searchInput.value.trim() : '';
      const regionValue = regionFilter ? regionFilter.value : '';
      const categoryValue = categoryFilter.value;
      currentFilters.category = categoryValue;
      console.log('Category filter changed:', { categoryValue, searchValue, regionValue });
      fetchAttractions(1, searchValue, regionValue, categoryValue);
    });
  }

  // Обработчик кликов по пагинации
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
        const category = currentFilters.category || url.searchParams.get('category') || '';
        console.log('Pagination click - Raw URL Params:', { page, search, region, category });
        fetchAttractions(page, search, region, category);
      }
    });
  }

  // Обработчик изменения истории браузера (назад/вперед)
  window.addEventListener('popstate', () => {
    const url = new URL(window.location);
    const page = url.searchParams.get('page') || 1;
    const search = url.searchParams.get('search') || currentFilters.search;
    const region = url.searchParams.get('region') || currentFilters.region;
    const category = url.searchParams.get('category') || currentFilters.category;
    console.log('Popstate - Raw URL Params:', { page, search, region, category });
    fetchAttractions(page, search, region, category);
  });

  // Инициализация при загрузке страницы
  const initialUrl = new URL(window.location);
  const initialPage = initialUrl.searchParams.get('page') || 1;
  const initialSearch = initialUrl.searchParams.get('search') || currentFilters.search;
  const initialRegion = initialUrl.searchParams.get('region') || currentFilters.region;
  const initialCategory = initialUrl.searchParams.get('category') || currentFilters.category;
  console.log('Initial load - Raw URL Params:', { initialPage, initialSearch, initialRegion, initialCategory });
  fetchAttractions(initialPage, initialSearch, initialRegion, initialCategory);
});