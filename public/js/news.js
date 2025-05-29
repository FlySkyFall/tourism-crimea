$(document).ready(function() {
  const apiKey = '225f6350ae354d68826d78d1a45b8d01'; // Замените на ваш ключ
  let page = 1;
  const pageSize = 6;
  const loadNews = () => {
    $('#news-error').addClass('hidden');
    $('#load-more').prop('disabled', true).text('Загрузка...');

    $.ajax({
      url: `https://newsapi.org/v2/everything?q=Крым&language=ru&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`,
      method: 'GET',
      success: function(data) {
        console.log('API Response:', data); // Для отладки
        if (data.status === 'ok' && data.articles.length > 0) {
          const newsContainer = $('#news-grid');
          data.articles.forEach(article => {
            const newsItem = `
              <div class="news-card bg-gray-100 rounded-lg shadow-md overflow-hidden">
                <img src="${article.urlToImage || '/img/placeholder.jpg'}" alt="${article.title}" class="w-full h-48 object-cover" onerror="this.src='/img/placeholder.jpg'">
                <div class="p-4">
                  <h3 class="text-xl font-semibold mb-2">${article.title}</h3>
                  <p class="text-gray-600 mb-2">${article.description || 'Описание отсутствует'}</p>
                  <p class="text-sm text-gray-500 mb-4">${new Date(article.publishedAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <a href="${article.url}" target="_blank" class="text-blue-600 hover:underline">Читать полностью</a>
                </div>
              </div>
            `;
            newsContainer.append(newsItem);
          });
          if (data.articles.length < pageSize) {
            $('#load-more').hide();
          } else {
            $('#load-more').show().prop('disabled', false).text('Загрузить ещё');
            page++;
          }
        } else {
          $('#news-error').text('Новостей пока нет').removeClass('hidden');
          $('#load-more').hide();
        }
      },
      error: function(xhr, status, error) {
        console.error('API Error:', error); // Для отладки
        $('#news-error').text('Ошибка загрузки новостей: ' + error).removeClass('hidden');
        $('#load-more').hide();
      },
      complete: function() {
        $('#load-more').prop('disabled', false);
      }
    });
  };

  // Инициализация загрузки новостей
  loadNews();

  // Обработчик кнопки "Загрузить ещё"
  $('#load-more').on('click', loadNews);

  // Периодическое обновление каждые 5 минут
  setInterval(loadNews, 300000); // 5 минут
});