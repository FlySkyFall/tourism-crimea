document.addEventListener('DOMContentLoaded', () => {
  // Фильтрация туров на главной странице (index.hbs)
  const filterButtons = document.querySelectorAll('.filter-btn');
  const toursList = document.querySelector('.tours-grid');
  const pagination = document.querySelector('.pagination');
  const pageInfo = document.querySelector('.pagination + p');
  
  const fetchTours = async (type = 'all', page = 1) => {
    if (toursList) {
      toursList.innerHTML = '<p class="text-center text-gray-600">Загрузка...</p>';
    }
    try {
      const response = await fetch(`/filter-tours?type=${type === 'all' ? '' : encodeURIComponent(type)}&page=${page}`);
      if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }
      const data = await response.json();

      if (toursList) {
        toursList.innerHTML = data.tours && data.tours.length
          ? data.tours
              .map(tour => `
                <div class="tour-card w-80 mx-auto">
                  <div class="bg-gray-100 rounded-lg shadow-md overflow-hidden">
                    <img src="${tour.images[0] || '/img/placeholder.jpg'}" alt="${tour.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                      <h3 class="text-xl font-semibold mb-2">${tour.title}</h3>
                      <p class="text-gray-600 mb-2">${tour.description.substring(0, 100)}${tour.description.length > 100 ? '...' : ''}</p>
                      <p class="text-blue-600 font-bold mb-4">${tour.price} ₽</p>
                      <a href="/tours/${tour._id}" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">Подробнее</a>
                    </div>
                  </div>
                </div>
              `)
              .join('')
          : '<p class="text-center text-gray-600 col-span-3">Нет туров в этой категории</p>';
      }

      if (pagination && data.totalPages > 1) {
        pagination.innerHTML = `
          ${data.currentPage > 1 ? `<button data-page="${data.currentPage - 1}" data-type="${type}" class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded">Предыдущая</button>` : '<span class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded opacity-50 cursor-not-allowed">Предыдущая</span>'}
          ${Array.from({ length: data.totalPages }, (_, i) => `
            <button data-page="${i + 1}" data-type="${type}" class="pagination-btn px-4 py-2 mx-1 rounded ${data.currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}">${i + 1}</button>
          `).join('')}
          ${data.currentPage < data.totalPages ? `<button data-page="${data.currentPage + 1}" data-type="${type}" class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded">Следующая</button>` : '<span class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded opacity-50 cursor-not-allowed">Следующая</span>'}
        `;
      } else if (pagination) {
        pagination.innerHTML = '';
      }

      if (pageInfo) {
        pageInfo.textContent = `Страница: ${data.currentPage} из ${data.totalPages} (Туров на странице: ${data.toursOnPage}, Всего туров: ${data.totalTours})`;
      }

      history.pushState({ type, page }, '', `/?${type !== 'all' ? `type=${type}&` : ''}page=${page}`);

      if (pagination) {
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            const type = btn.dataset.type;
            if (page) fetchTours(type, page);
          });
        });
      }
    } catch (error) {
      console.error('Ошибка фильтрации:', error);
      if (toursList) {
        toursList.innerHTML = `<p class="text-center text-red-600 col-span-3">Ошибка загрузки туров: ${error.message}</p>`;
      }
    }
  };

  filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const category = button.dataset.category;

      filterButtons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-800');
      });
      button.classList.remove('bg-gray-200', 'text-gray-800');
      button.classList.add('bg-blue-600', 'text-white');

      fetchTours(category, 1);
    });
  });

  window.addEventListener('popstate', (event) => {
    if (event.state) {
      fetchTours(event.state.type, event.state.page);
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-800');
        if (btn.dataset.category === event.state.type) {
          btn.classList.remove('bg-gray-200', 'text-gray-800');
          btn.classList.add('bg-blue-600', 'text-white');
        }
      });
    }
  });

  // Инициализация текущих фильтров из URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type') || 'all';
  const initialPage = parseInt(urlParams.get('page')) || 1;
  fetchTours(initialType, initialPage);

  // Фильтрация туров на странице региона (regions/:id)
  const regionFilterButtons = document.querySelectorAll('.region-filter-btn');
  const toursListRegion = document.querySelector('.tours-list');
  const paginationRegion = document.querySelector('.pagination');
  const pageInfoRegion = document.querySelector('.pagination + p');

  if (regionFilterButtons.length) {
    const regionId = window.location.pathname.split('/').pop();

    const fetchRegionTours = async (type = 'all', page = 1) => {
      try {
        const url = `/regions/${regionId}/filter?type=${encodeURIComponent(type)}&page=${page}`;
        if (toursListRegion) {
          toursListRegion.innerHTML = '<p class="text-center text-gray-600">Загрузка...</p>';
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ошибка: ${response.status}`);
        }
        const data = await response.json();

        if (toursListRegion) {
          toursListRegion.innerHTML = data.tours && data.tours.length
            ? data.tours
                .map(tour => `
                  <div class="tour-card bg-gray-100 rounded-lg shadow-md overflow-hidden" data-category="${tour.type}">
                    <img src="${tour.images[0] || '/img/placeholder.jpg'}" alt="${tour.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                      <h3 class="text-xl font-semibold mb-2">${tour.title}</h3>
                      <p class="text-gray-600 mb-2">${tour.description}</p>
                      <p class="text-blue-600 font-bold mb-4">${tour.price} ₽</p>
                      <a href="/tours/${tour._id}" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">Подробнее</a>
                    </div>
                  </div>
                `)
                .join('')
            : '<p class="text-center text-gray-600 col-span-3">Нет туров для выбранного типа</p>';
        }

        if (paginationRegion) {
          if (data.totalPages > 1) {
            paginationRegion.innerHTML = `
              ${data.currentPage > 1 ? `<button data-page="${data.currentPage - 1}" data-type="${type}" class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded">Предыдущая</button>` : '<span class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded opacity-50 cursor-not-allowed">Предыдущая</span>'}
              ${Array.from({ length: data.totalPages }, (_, i) => `
                <button data-page="${i + 1}" data-type="${type}" class="pagination-btn px-4 py-2 mx-1 rounded ${data.currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}">${i + 1}</button>
              `).join('')}
              ${data.currentPage < data.totalPages ? `<button data-page="${data.currentPage + 1}" data-type="${type}" class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded">Следующая</button>` : '<span class="pagination-btn px-4 py-2 mx-1 bg-gray-200 rounded opacity-50 cursor-not-allowed">Следующая</span>'}
            `;
          } else {
            paginationRegion.innerHTML = '';
          }
        }

        if (pageInfoRegion) {
          pageInfoRegion.textContent = `Страница: ${data.currentPage} из ${data.totalPages} (Туров на странице: ${data.toursOnPage}, Всего туров: ${data.totalTours})`;
        }

        const newUrl = `/regions/${regionId}${type === 'all' && page === 1 ? '' : `?${type !== 'all' ? `type=${type}` : ''}${type !== 'all' && page !== 1 ? '&' : ''}${page !== 1 ? `page=${page}` : ''}`}`;
        history.pushState({ type, page }, '', newUrl);

        if (paginationRegion) {
          paginationRegion.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const page = parseInt(btn.dataset.page);
              const type = btn.dataset.type;
              if (page) fetchRegionTours(type, page);
            });
          });
        }
      } catch (error) {
        console.error('Ошибка фильтрации:', error);
        if (toursListRegion) {
          toursListRegion.innerHTML = `<p class="text-center text-red-600 col-span-3">Ошибка фильтрации: ${error.message}</p>`;
        }
      }
    };

    regionFilterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.type;
        regionFilterButtons.forEach(btn => {
          btn.classList.remove('bg-blue-600', 'text-white');
          btn.classList.add('bg-gray-200', 'text-gray-800');
        });
        button.classList.remove('bg-gray-200', 'text-gray-800');
        button.classList.add('bg-blue-600', 'text-white');
        fetchRegionTours(type, 1);
      });
    });

    window.addEventListener('popstate', (event) => {
      if (event.state) {
        fetchRegionTours(event.state.type, event.state.page);
        regionFilterButtons.forEach(btn => {
          btn.classList.remove('bg-blue-600', 'text-white');
          btn.classList.add('bg-gray-200', 'text-gray-800');
          if (btn.dataset.type === event.state.type) {
            btn.classList.remove('bg-gray-200', 'text-gray-800');
            btn.classList.add('bg-blue-600', 'text-white');
          }
        });
      }
    });
  }

  // Плавная прокрутка для навигации
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 60,
          behavior: 'smooth',
        });
      } else {
        window.location.href = link.getAttribute('href');
      }
    });
  });

  // Эффект прокрутки для навигации
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});