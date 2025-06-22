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
  const totalPriceInput = document.querySelector('#totalPrice');
  const totalPriceDisplay = document.querySelector('#total-price-display');
  const mapEl = document.querySelector('#hotelMap');

  // Логирование найденных элементов
  const elementsFound = {
    calendarEl: !!calendarEl,
    bookingForm: !!bookingForm,
    startDateInput: !!startDateInput,
    endDateInput: !!endDateInput,
    participantsInput: !!participantsInput,
    roomTypeInput: !!roomTypeInput,
    bookHotelBtn: !!bookHotelBtn,
    bookingError: !!bookingError,
    bookingSuccess: !!bookingSuccess,
    totalPriceInput: !!totalPriceInput,
    totalPriceDisplay: !!totalPriceDisplay,
    mapEl: !!mapEl
  };
  console.log('Required elements found:', elementsFound);

  // Если ключевые элементы отсутствуют, продолжаем с минимальной функциональностью
  if (!calendarEl || !mapEl) {
    console.error('Critical elements (calendarEl or mapEl) not found:', elementsFound);
    return;
  }

  // Инициализация карты
  if (window.hotelData && window.hotelData.coordinates && typeof window.hotelData.coordinates.lat === 'number' && typeof window.hotelData.coordinates.lng === 'number') {
    try {
      const map = L.map('hotelMap').setView([window.hotelData.coordinates.lat, window.hotelData.coordinates.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      L.marker([window.hotelData.coordinates.lat, window.hotelData.coordinates.lng])
        .addTo(map)
        .bindPopup(window.hotelData.name)
        .openPopup();
      console.log('Map initialized with coordinates:', window.hotelData.coordinates);
    } catch (error) {
      console.error('Error initializing map:', error);
      mapEl.innerHTML = '<p class="text-gray-500 text-center">Ошибка загрузки карты</p>';
    }
  } else {
    console.warn('Map not initialized: invalid coordinates or hotelData', {
      hotelDataExists: !!window.hotelData,
      coordinates: window.hotelData?.coordinates
    });
    mapEl.innerHTML = '<p class="text-gray-500 text-center">Координаты недоступны</p>';
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrfToken) {
    console.error('CSRF token not found');
    if (bookingError) {
      bookingError.textContent = 'Ошибка: CSRF-токен не найден. Пожалуйста, обновите страницу.';
      bookingError.classList.remove('hidden');
    }
    if (bookHotelBtn) bookHotelBtn.disabled = true;
    return;
  }

  if (!window.hotelData) {
    console.error('hotelData is not defined');
    if (bookingError) {
      bookingError.textContent = 'Ошибка: данные отеля не найдены';
      bookingError.classList.remove('hidden');
    }
    return;
  }

  try {
    const hotelId = window.hotelData.id;
    const hotelCapacity = window.hotelData.capacity;
    const basePrice = window.hotelData.basePrice || 5000;
    const rating = window.hotelData.rating || 0;
    const roomTypes = window.hotelData.roomTypes || [];

    console.log('Hotel data:', { hotelId, hotelCapacity, basePrice, rating, roomTypes });

    const calculatePrice = () => {
      if (!startDateInput || !endDateInput || !participantsInput || !roomTypeInput || !totalPriceInput || !totalPriceDisplay) {
        console.warn('Price calculation skipped: required inputs not found');
        return;
      }
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      const participants = parseInt(participantsInput.value) || 1;
      const roomType = roomTypeInput.value;

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
        totalPriceInput.value = '';
        totalPriceDisplay.textContent = 'Итоговая цена: не рассчитана';
        console.warn('Invalid dates for price calculation:', { startDate: startDateInput.value, endDate: endDateInput.value });
        return;
      }

      const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      let totalPrice = basePrice * (nights + 1) * participants; // Учитываем последний день

      if (roomType === 'standardWithAC') {
        totalPrice *= 1.10;
      } else if (roomType === 'luxury') {
        totalPrice *= rating > 4 ? 1.30 : 1.20;
      }

      totalPrice = Math.round(totalPrice);
      if (isNaN(totalPrice)) {
        console.error('Calculated totalPrice is NaN:', { basePrice, nights, participants, roomType });
        totalPriceInput.value = '';
        totalPriceDisplay.textContent = 'Итоговая цена: ошибка расчета';
        return;
      }

      totalPriceInput.value = totalPrice;
      totalPriceDisplay.textContent = `Итоговая цена: ${totalPrice.toLocaleString('ru-RU')} ₽ (за ${nights + 1} ноч${(nights + 1) === 1 ? 'ь' : (nights + 1) > 1 && (nights + 1) < 5 ? 'и' : 'ей'})`;
      console.log('Price calculated:', { totalPrice, nights: nights + 1, participants, roomType });
    };

    if (startDateInput && endDateInput && participantsInput && roomTypeInput) {
      startDateInput.addEventListener('input', calculatePrice);
      endDateInput.addEventListener('input', calculatePrice);
      participantsInput.addEventListener('input', calculatePrice);
      roomTypeInput.addEventListener('change', calculatePrice);
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'ru',
      events: async function(fetchInfo, successCallback, failureCallback) {
        try {
          const response = await fetch(`/hotels/${hotelId}/availability`);
          if (!response.ok) throw new Error('Network response was not ok');
          const events = await response.json();
          console.log('Availability events:', events);
          successCallback(events);
        } catch (error) {
          console.error('Error fetching availability for calendar:', error);
          if (bookingError) {
            bookingError.textContent = 'Ошибка загрузки доступных дат';
            bookingError.classList.remove('hidden');
          }
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
          if (!window.user || typeof window.user !== 'object') {
            alert('Войдите, чтобы забронировать.');
            return;
          }
          if (startDateInput && participantsInput) {
            startDateInput.value = info.event.startStr;
            participantsInput.max = info.event.extendedProps.availableSlots;
            if (bookingError) bookingError.classList.add('hidden');
            console.log('Selected start date from calendar:', info.event.startStr, 'Available slots:', info.event.extendedProps.availableSlots);
            calculatePrice();
          }
        }
      }
    });
    calendar.render();
    console.log('Calendar initialized');

    if (startDateInput && endDateInput) {
      fetch(`/hotels/${hotelId}/availability`)
        .then(response => response.json())
        .then(events => {
          console.log('Fetched availability for input:', events);
          const availableDates = events.filter(e => e.availableSlots >= 1);

          startDateInput.addEventListener('input', () => {
            const selectedDate = startDateInput.value;
            console.log('Selected start date in input:', selectedDate);
            if (selectedDate && !availableDates.find(d => d.start === selectedDate)) {
              if (bookingError) {
                bookingError.textContent = 'Выбранная дата заезда недоступна';
                bookingError.classList.remove('hidden');
              }
              startDateInput.value = '';
              if (participantsInput) participantsInput.max = '';
            } else {
              if (bookingError) bookingError.classList.add('hidden');
              const event = availableDates.find(d => d.start === selectedDate);
              if (participantsInput) participantsInput.max = event ? event.availableSlots : hotelCapacity;
              if (endDateInput.value && new Date(endDateInput.value) <= new Date(selectedDate)) {
                endDateInput.value = '';
              }
              calculatePrice();
            }
          });

          endDateInput.addEventListener('input', () => {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            if (startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              if (end <= start) {
                if (bookingError) {
                  bookingError.textContent = 'Дата выезда должна быть позже даты заезда';
                  bookingError.classList.remove('hidden');
                }
                endDateInput.value = '';
                calculatePrice();
                return;
              }
              const dates = [];
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const date = new Date(d); // Сохраняем дату перед увеличением
                date.setHours(0, 0, 0, 0);
                dates.push(date.toISOString().split('T')[0]);
              }
              const allAvailable = dates.every(date => {
                const event = events.find(e => e.start === date);
                return event && event.availableSlots >= (parseInt(participantsInput?.value) || 1);
              });
              if (!allAvailable) {
                if (bookingError) {
                  bookingError.textContent = 'Недостаточно мест на выбранные даты';
                  bookingError.classList.remove('hidden');
                }
                endDateInput.value = '';
              } else {
                if (bookingError) bookingError.classList.add('hidden');
              }
              calculatePrice();
            }
          });
        })
        .catch(error => {
          console.error('Error fetching availability for input:', error);
          if (bookingError) {
            bookingError.textContent = 'Ошибка загрузки доступных дат';
            bookingError.classList.remove('hidden');
          }
        });
    }

    if (bookingForm) {
      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Booking form submitted');

        const startDate = startDateInput?.value;
        const endDate = endDateInput?.value;
        const participants = parseInt(participantsInput?.value);
        const roomType = roomTypeInput?.value;
        const totalPrice = parseInt(totalPriceInput?.value);

        if (!startDate || !endDate) {
          if (bookingError) {
            bookingError.textContent = 'Пожалуйста, выберите даты заезда и выезда';
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
          return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          if (bookingError) {
            bookingError.textContent = 'Некорректные даты';
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
          return;
        }

        if (end <= start) {
          if (bookingError) {
            bookingError.textContent = 'Дата выезда должна быть позже даты заезда';
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
          return;
        }

        if (!participants || participants < 1) {
          if (bookingError) {
            bookingError.textContent = 'Количество гостей должно быть больше 0';
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
          return;
        }

        if (!roomType) {
          if (bookingError) {
            bookingError.textContent = 'Пожалуйста, выберите тип номера';
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
          return;
        }

        if (!totalPrice || totalPrice <= 0 || isNaN(totalPrice)) {
          if (bookingError) {
            bookingError.textContent = 'Итоговая цена не рассчитана корректно';
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
          console.error('Invalid totalPrice before submission:', totalPrice);
          return;
        }

        try {
          if (bookHotelBtn) {
            bookHotelBtn.disabled = true;
            bookHotelBtn.textContent = 'Бронирование...';
          }

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
              totalPrice,
              isHotelBooking: true
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

          if (bookingError) bookingError.classList.add('hidden');
          if (bookingSuccess) {
            bookingSuccess.textContent = 'Отель успешно забронирован! Перейдите в "Мои бронирования" для оплаты.';
            bookingSuccess.classList.remove('hidden');
          }

          if (bookingForm) bookingForm.reset();
          if (totalPriceInput) totalPriceInput.value = '';
          if (totalPriceDisplay) totalPriceDisplay.textContent = 'Итоговая цена: 0 ₽';
          if (calendar) calendar.refetchEvents();
          localStorage.setItem('refreshTourAvailability', 'true');
        } catch (error) {
          console.error('Booking error:', error.message);
          if (bookingError) {
            bookingError.textContent = error.message;
            bookingError.classList.remove('hidden');
          }
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
        } finally {
          if (bookHotelBtn) {
            bookHotelBtn.disabled = false;
            bookHotelBtn.textContent = 'Забронировать';
          }
        }
      });
    }
  } catch (error) {
    console.error('Error processing hotel data:', error);
    if (bookingError) {
      bookingError.textContent = 'Ошибка обработки данных отеля';
      bookingError.classList.remove('hidden');
    }
  }
});