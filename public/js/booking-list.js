document.addEventListener('DOMContentLoaded', () => {
  console.log('booking-list.js loaded');

  // --- Логика отмены бронирований ---
  const cancelForms = document.querySelectorAll('form[action*="/cancel"]');

  if (!cancelForms.length) {
    console.warn('No cancel forms found');
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrfToken) {
    console.error('CSRF token not found');
    alert('Ошибка: CSRF-токен не найден');
    return;
  }

  cancelForms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cancelButton = form.querySelector('button[type="submit"]');
      const formAction = form.action;
      console.log('Form action:', formAction);

      const bookingIdMatch = formAction.match(/\/bookings\/(.+)\/cancel$/);
      if (!bookingIdMatch || !bookingIdMatch[1]) {
        console.error('Invalid form action, cannot extract bookingId:', formAction);
        alert('Ошибка: невозможно определить идентификатор бронирования');
        return;
      }

      const bookingId = bookingIdMatch[1];
      console.log('Cancel form submitted for booking:', bookingId);

      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
      if (!isValidObjectId) {
        console.error('Invalid bookingId format:', bookingId);
        alert('Ошибка: неверный формат идентификатора бронирования');
        return;
      }

      try {
        cancelButton.disabled = true;
        cancelButton.textContent = 'Отмена...';

        const response = await fetch(`/bookings/${bookingId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'CSRF-Token': csrfToken,
          },
        });

        console.log('Cancel response status:', response.status);

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON:', jsonError);
          throw new Error('Сервер вернул некорректный ответ');
        }

        if (!response.ok) {
          throw new Error(data.error || `Ошибка отмены (статус ${response.status})`);
        }

        console.log('Cancel response data:', data);
        window.location.reload(); // Обновляем страницу для отображения нового статуса
      } catch (error) {
        console.error('Cancel error:', error.message);
        alert(`Ошибка: ${error.message}`);
      } finally {
        cancelButton.disabled = false;
        cancelButton.textContent = 'Отменить';
      }
    });
  });

  // --- Логика оплаты ---
  let currentBookingId = null;

  window.openPaymentModal = function(bookingId) {
    currentBookingId = bookingId;
    const modal = document.getElementById('paymentModal');
    const bookingIdInput = document.getElementById('paymentBookingId');
    const paymentError = document.getElementById('payment-error');
    bookingIdInput.value = bookingId;
    modal.classList.remove('hidden');
    paymentError.classList.add('hidden');
    console.log('Opened payment modal for bookingId:', bookingId);
  };

  window.closePaymentModal = function() {
    const modal = document.getElementById('paymentModal');
    modal.classList.add('hidden');
    document.getElementById('paymentForm').reset();
    currentBookingId = null;
    console.log('Closed payment modal');
  };

  const paymentForm = document.getElementById('paymentForm');
  const paymentError = document.getElementById('payment-error');

  if (!paymentForm || !paymentError) {
    console.error('Payment elements not found:', {
      paymentForm: !!paymentForm,
      paymentError: !!paymentError,
    });
    return;
  }

  if (!csrfToken) {
    console.error('CSRF token not found for payment');
    paymentError.textContent = 'Ошибка: CSRF-токен не найден. Пожалуйста, обновите страницу.';
    paymentError.classList.remove('hidden');
    return;
  }

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Payment form submitted for bookingId:', currentBookingId);

    const cardNumber = document.getElementById('cardNumber').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;

    // Клиентская валидация
    if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
      paymentError.textContent = 'Некорректный номер карты';
      paymentError.classList.remove('hidden');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
      paymentError.textContent = 'Некорректный срок действия';
      paymentError.classList.remove('hidden');
      return;
    }
    if (cvv.length !== 3 || !/^\d+$/.test(cvv)) {
      paymentError.textContent = 'Некорректный CVV';
      paymentError.classList.remove('hidden');
      return;
    }

    try {
      const formData = new FormData(paymentForm);
      console.log('FormData contents:', Object.fromEntries(formData));
      const response = await fetch(`/bookings/${currentBookingId}/pay`, {
        method: 'POST',
        headers: {
          'CSRF-Token': csrfToken,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Payment response:', result);

      if (response.ok) {
        paymentError.classList.add('hidden');
        closePaymentModal();
        // Устанавливаем флаг в localStorage для обновления календаря
        localStorage.setItem('refreshTourAvailability', 'true');
        window.location.reload(); // Обновляем страницу для отображения нового статуса
      } else {
        paymentError.textContent = result.error || 'Ошибка оплаты';
        paymentError.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Payment error:', error);
      paymentError.textContent = 'Ошибка при обработке оплаты';
      paymentError.classList.remove('hidden');
    }
  });
});