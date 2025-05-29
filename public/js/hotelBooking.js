document.addEventListener('DOMContentLoaded', () => {
  console.log('hotelBooking.js loaded');

  const calendarEl = document.querySelector('#calendar');
  const bookingForm = document.querySelector('#booking-form');
  const startDateInput = document.querySelector('#startDate');
  const endDateInput = document.querySelector('#endDate');
  const participantsInput = document.querySelector('#participants');
  const roomTypeInput = document.querySelector('#roomType');
  const bookHotelBtn = document.querySelector('#book-hotel-btn');
  const bookingError = document.querySelector('#booking-error');
  const bookingSuccess = document.querySelector('#booking-success');

  if (!calendarEl || !bookingForm || !startDateInput || !endDateInput || !participantsInput || !roomTypeInput || !bookHotelBtn || !bookingError || !bookingSuccess) {
    console.error('Required elements not found:', {
      calendarEl: !!calendarEl,
      bookingForm: !!bookingForm,
      startDateInput: !!startDateInput,
      endDateInput: !!endDateInput,
      participantsInput: !!participantsInput,
      roomTypeInput: !!roomTypeInput,
      bookHotelBtn: !!bookHotelBtn,
      bookingError: !!bookingError,
      bookingSuccess: !!bookingSuccess,
    });
    return;
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrfToken) {
    console.error('CSRF token not found');
    bookingError.textContent = 'Ошибка: CSRF-токен не найден. Пожалуйста, обновите страницу.';
    bookingError.classList.remove('hidden');
    bookHotelBtn.disabled = true;
    return;
  }

  if (!window.hotelData) {
    console.error('hotelData is not defined');
    bookingError.textContent = 'Ошибка: данные отеля не найдены';
    bookingError.classList.remove('hidden');
    return;
  }

  const hotelId = window.hotelData.id;
  const hotelCapacity = window.hotelData.capacity;

  console.log('Hotel data:', { hotelId, hotelCapacity });

  // Инициализация FullCalendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'ru',
    events: async function(fetchInfo, successCallback, failureCallback) {
      try {
        const response = await fetch(`/hotels/${hotelId}/availability`);
        const events = await response.json();
        console.log('Availability events:', events);
        successCallback(events);
      } catch (error) {
        console.error('Error fetching availability for calendar:', error);
        bookingError.textContent = 'Ошибка загрузки доступных дат';
        bookingError.classList.remove('hidden');
        failureCallback(error);
      }
    },
    eventDidMount: function(info) {
      tippy(info.el, {
        content: info.event.extendedProps.availableSlots >= 1
          ? `Осталось мест: ${info.event.extendedProps.availableSlots}`
          : 'Нет доступных мест',
        placement: 'top',
        theme: 'light',
      });
    },
    eventClick: function(info) {
      if (info.event.extendedProps.availableSlots >= 1) {
        startDateInput.value = info.event.startStr;
        participantsInput.max = info.event.extendedProps.availableSlots;
        bookingError.classList.add('hidden');
        console.log('Selected start date from calendar:', info.event.startStr, 'Available slots:', info.event.extendedProps.availableSlots);
      }
    }
  });
  calendar.render();
  console.log('Calendar initialized');

  // Проверка дат и доступности
  fetch(`/hotels/${hotelId}/availability`)
    .then(response => response.json())
    .then(events => {
      console.log('Fetched availability for input:', events);
      const availableDates = events.filter(e => e.availableSlots >= 1);

      startDateInput.addEventListener('input', () => {
        const selectedDate = startDateInput.value;
        console.log('Selected start date in input:', selectedDate);
        if (selectedDate && !availableDates.find(d => d.start === selectedDate)) {
          bookingError.textContent = 'Выбранная дата заезда недоступна';
          bookingError.classList.remove('hidden');
          startDateInput.value = '';
          participantsInput.max = '';
        } else {
          bookingError.classList.add('hidden');
          const event = availableDates.find(d => d.start === selectedDate);
          participantsInput.max = event ? event.availableSlots : hotelCapacity;
          if (endDateInput.value && new Date(endDateInput.value) <= new Date(selectedDate)) {
            endDateInput.value = '';
          }
        }
      });

      endDateInput.addEventListener('input', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          if (end <= start) {
            bookingError.textContent = 'Дата выезда должна быть позже даты заезда';
            bookingError.classList.remove('hidden');
            endDateInput.value = '';
            return;
          }
          const dates = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
          }
          const allAvailable = dates.every(date => {
            const event = events.find(e => e.start === date);
            return event && event.availableSlots >= participantsInput.value;
          });
          if (!allAvailable) {
            bookingError.textContent = 'Недостаточно мест на выбранные даты';
            bookingError.classList.remove('hidden');
            endDateInput.value = '';
          } else {
            bookingError.classList.add('hidden');
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching availability for input:', error);
      bookingError.textContent = 'Ошибка загрузки доступных дат';
      bookingError.classList.remove('hidden');
    });

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Booking form submitted');

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const participants = parseInt(participantsInput.value);
    const roomType = roomTypeInput.value;

    if (!startDate || !endDate) {
      bookingError.textContent = 'Пожалуйста, выберите даты заезда и выезда';
      bookingError.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      bookingError.textContent = 'Некорректные даты';
      bookingError.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
      return;
    }

    if (end <= start) {
      bookingError.textContent = 'Дата выезда должна быть позже даты заезда';
      bookingError.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
      return;
    }

    if (!participants || participants < 1) {
      bookingError.textContent = 'Количество гостей должно быть больше 0';
      bookingError.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
      return;
    }

    if (!roomType) {
      bookingError.textContent = 'Пожалуйста, выберите тип номера';
      bookingError.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
      return;
    }

    try {
      bookHotelBtn.disabled = true;
      bookHotelBtn.textContent = 'Бронирование...';

      const response = await fetch('/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          hotelId,
          startDate,
          endDate,
          participants,
          roomType,
        }),
      });

      console.log('Booking response status:', response.status);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        throw new Error('Сервер вернул некорректный ответ');
      }

      if (response.status === 403) {
        throw new Error('Недействительный CSRF-токен. Пожалуйста, обновите страницу.');
      }

      if (!response.ok) {
        throw new Error(data.error || `Ошибка бронирования (статус ${response.status})`);
      }

      console.log('Booking response data:', data);

      bookingError.classList.add('hidden');
      bookingSuccess.textContent = 'Отель успешно забронирован! Перейдите в "Мои бронирования" для оплаты.';
      bookingSuccess.classList.remove('hidden');

      bookingForm.reset();
      calendar.refetchEvents();
      localStorage.setItem('refreshTourAvailability', 'true'); // Флаг для обновления календарей туров
    } catch (error) {
      console.error('Booking error:', error.message);
      bookingError.textContent = error.message;
      bookingError.classList.remove('hidden');
      bookingSuccess.classList.add('hidden');
    } finally {
      bookHotelBtn.disabled = false;
      bookHotelBtn.textContent = 'Забронировать';
    }
  });
});