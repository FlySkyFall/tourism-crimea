document.addEventListener('DOMContentLoaded', () => {
  const regionFilter = document.getElementById('filter-region');
  const sortFilter = document.getElementById('sort');
  const createPostForm = document.getElementById('create-post-form');

  // Получить CSRF-токен
  const getCsrfToken = () => {
    const csrfInput = document.querySelector('input[name="_csrf"]');
    return csrfInput ? csrfInput.value : '';
  };

  // Обработчик фильтров
  if (regionFilter) {
    regionFilter.addEventListener('change', () => {
      updatePosts();
    });
  } else {
    console.log('Элемент #filter-region не найден');
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      updatePosts();
    });
  } else {
    console.log('Элемент #sort не найден');
  }

  // Обновление постов
  const updatePosts = () => {
    const region = regionFilter ? regionFilter.value : '';
    const sortBy = sortFilter ? sortFilter.value : 'newest';
    const url = `/community?region=${encodeURIComponent(region)}&sort=${encodeURIComponent(sortBy)}`;
    window.location.href = url;
  };

  // Создание поста
  if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(createPostForm);
      formData.append('_csrf', getCsrfToken());

      try {
        createPostForm.querySelector('button[type="submit"]').disabled = true;
        const response = await fetch('/community/posts', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка создания поста');
        }

        alert('Пост успешно создан!');
        createPostForm.reset();
        window.location.reload();
      } catch (error) {
        console.error('Ошибка создания поста:', error.message);
        alert(error.message);
      } finally {
        createPostForm.querySelector('button[type="submit"]').disabled = false;
      }
    });
  } else {
    console.log('Форма #create-post-form не найдена');
  }

  // Лайки
  document.addEventListener('click', async (e) => {
    const likeButton = e.target.closest('.like-btn');
    if (likeButton) {
      e.preventDefault();
      const postId = likeButton.dataset.id;

      try {
        const response = await fetch(`/community/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка обработки лайка');
        }

        const data = await response.json();
        const likesCount = likeButton.querySelector('.likes-count') || likeButton;
        likesCount.textContent = `Лайк (${data.likes})`;
        likeButton.classList.toggle('text-red-600', data.liked);
        likeButton.classList.toggle('text-gray-600', !data.liked);
      } catch (error) {
        console.error('Ошибка лайка:', error.message);
        alert(error.message);
      }
    }
  });

  // Показ/скрытие формы комментариев
  document.addEventListener('click', (e) => {
    const commentButton = e.target.closest('.comment-btn');
    if (commentButton) {
      e.preventDefault();
      const postId = commentButton.dataset.id;
      console.log(`Клик на comment-btn для поста: ${postId}`);

      // Находим блок .comments для текущего поста
      const postElement = commentButton.closest('.post');
      const commentsBlock = postElement.querySelector('.comments');

      if (!commentsBlock) {
        console.error(`Блок .comments не найден для поста: ${postId}`);
        return;
      }

      // Скрываем все формы комментариев
      document.querySelectorAll('.comments').forEach((block) => {
        block.classList.add('hidden');
      });

      // Показываем форму для текущего поста
      commentsBlock.classList.remove('hidden');
      console.log(`Форма комментариев показана для поста: ${postId}`);
    }
  });

  // Комментарии
  document.addEventListener('submit', async (e) => {
    const commentForm = e.target.closest('.comment-form');
    if (commentForm) {
      e.preventDefault();
      const postId = commentForm.closest('.post').dataset.id;
      const commentInput = commentForm.querySelector('textarea[name="content"]');
      const text = commentInput.value.trim();

      if (!text) {
        alert('Комментарий не может быть пустым');
        return;
      }

      try {
        const response = await fetch(`/community/posts/${postId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ content: text })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка добавления комментария');
        }

        const data = await response.json();
        const commentsList = commentForm.closest('.comments').querySelector('.comments-list') || commentForm.previousElementSibling;
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment text-sm text-gray-600 mb-2';
        commentDiv.innerHTML = `
          <strong>${data.comment.user.username}</strong>: ${data.comment.content}
          <span class="text-xs text-gray-400">${new Date(data.comment.createdAt).toLocaleString()}</span>
        `;
        commentsList.appendChild(commentDiv);
        commentInput.value = '';
      } catch (error) {
        console.error('Ошибка комментария:', error.message);
        alert(error.message);
      }
    }
  });
});