document.addEventListener('DOMContentLoaded', () => {
  console.log('attractions.js loaded');
  const attractionsList = document.querySelector('.attractions-list');
  const pagination = document.querySelector('.pagination');
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

  const fetchAttractions = async (page = 1, search = '', region = '', category = '') => {
    try {
      const params = new URLSearchParams();
      if (page !== 1) params.append('page', page);
      if (search) params.append('search', search); // Убрано encodeURIComponent
      if (region) params.append('region', region); // Убрано encodeURIComponent
      if (category) params.append('category', category);
      const url = `/attractions?${params.toString()}`;
      console.log('Sending fetch to:', url, 'Params:', { page, search, region, category });

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
      const newPagination = doc.querySelector('.pagination');
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

      history.pushState({}, '', url);
    } catch (error) {
      console.error('Error fetching attractions:', error);
      if (attractionsList) {
        attractionsList.innerHTML = '<p class="text-center text-red-600">Ошибка загрузки достопримечательностей</p>';
      }
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchValue = searchInput.value;
      const regionValue = regionFilter ? regionFilter.value : '';
      const categoryValue = categoryFilter ? categoryFilter.value : '';
      console.log('Search input:', { searchValue, regionValue, categoryValue });
      debounceSearch(searchValue, 1, regionValue, categoryValue);
    });
  }

  if (regionFilter) {
    regionFilter.addEventListener('change', () => {
      const searchValue = searchInput ? searchInput.value : '';
      const regionValue = regionFilter.value;
      const categoryValue = categoryFilter ? categoryFilter.value : '';
      console.log('Region filter changed:', { regionValue, searchValue, categoryValue });
      fetchAttractions(1, searchValue, regionValue, categoryValue);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      const searchValue = searchInput ? searchInput.value : '';
      const regionValue = regionFilter ? regionFilter.value : '';
      const categoryValue = categoryFilter.value;
      console.log('Category filter changed:', { categoryValue, searchValue, regionValue });
      fetchAttractions(1, searchValue, regionValue, categoryValue);
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
        const category = url.searchParams.get('category') || '';
        console.log('Pagination click:', { page, search, region, category });
        fetchAttractions(page, search, region, category);
      }
    });
  }

  window.addEventListener('popstate', () => {
    const url = new URL(window.location);
    const page = url.searchParams.get('page') || 1;
    const search = url.searchParams.get('search') || '';
    const region = url.searchParams.get('region') || '';
    const category = url.searchParams.get('category') || '';
    console.log('Popstate:', { page, search, region, category });
    fetchAttractions(page, search, region, category);
  });
});