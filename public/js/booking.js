document.addEventListener('DOMContentLoaded', () => {
  console.log('booking.js loaded');

  const calendarEl = document.querySelector('#calendar');
  const bookingForm = document.querySelector('#booking-form');
  const tourDateInput = document.querySelector('#tourDate');
  const participantsInput = document.querySelector('#participants');
  const roomTypeInput = document.querySelector('#roomType');
  const bookTourBtn = document.querySelector('#book-tour-btn');
  const bookingError = document.querySelector('#booking-error');
  const bookingSuccess = document.querySelector('#booking-success');
  const totalPriceInput = document.querySelector('#totalPrice');
  const totalPriceDisplay = document.querySelector('#total-price-display');

  if (!calendarEl) {
    console.error('Calendar event not found');
    return;
  }

  console.log('Required calendar element found');

  const mapEl = document.getElementById('tourMap');
  const defaultCoords = { lat: 44.7204, lng: 37.7716 };
  if (mapEl && (getComputedStyle(mapEl).display !== 'none') && mapEl.offsetParent !== null) {
    try {
      const coords = (window.tourData?.location?.coordinates && window.tourData.location.coordinates.lat && window.tourData.location.coordinates.lng && window.tourData.location.coordinates.lat !== 0 && window.tourData.location.coordinates.lng !== 0)
        ? [window.tourData.location.coordinates.lat, window.tourData.location.coordinates.lng]
        : [defaultCoords.lat, defaultCoords.lng];
      const map = L.map('tourMap').setView(coords, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      L.marker(coords)
        .addTo(map)
        .bindPopup(window.tourData?.title || 'Тур')
        .openPopup();
      console.log('Map initialized with coordinates:', coords);
    } catch (error) {
      console.error('Error initializing map:', error);
      mapEl.innerHTML = '<p class="text-gray-500 text-center">Ошибка загрузки карты</p>';
    }
  } else {
    console.warn('Map element not visible or not found:', { mapEl, display: getComputedStyle(mapEl).display, offsetParent: mapEl?.offsetParent });
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrfToken && bookingForm) {
    console.error('CSRF token not found');
    if (bookingError) {
      bookingError.textContent = 'Ошибка: CSRF-токен не найден. Пожалуйста, обновите страницу.';
      bookingError.classList.remove('hidden');
    }
    if (bookTourBtn) bookTourBtn.disabled = true;
    return;
  }

  const initializeTourData = () => {
    if (!window.tourData || typeof window.tourData !== 'object' || Object.keys(window.tourData).length === 0) {
      console.warn('tourData is invalid or not defined, using defaults:', window.tourData);
      window.tourData = window.tourData || {
        id: null,
        _id: null,
        type: 'passive',
        price: 0,
        location: { coordinates: defaultCoords, region: 'Default Region' },
        season: { start: new Date(), end: new Date(Date.now() + 30 * 86400000) },
        maxGroupSize: 10,
        minGroupSize: 1,
        durationDays: 1,
        accommodation: { type: 'none' },
        discounts: {
          groupDiscount: { enabled: false, minParticipants: 5, percentage: 0 },
          seasonalDiscount: { enabled: false, startDate: null, endDate: null, percentage: 0 },
          hotDealDiscount: { enabled: false, percentage: 0 },
        },
      };
      console.log('Default tourData applied:', window.tourData);
      return true;
    }
    console.log('tourData loaded:', window.tourData);
    return true;
  };

  const checkAndProceed = () => {
    if (!initializeTourData()) {
      let attempts = 0;
      const maxAttempts = 5;
      const interval = setInterval(() => {
        attempts++;
        if (initializeTourData() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts) {
            console.error('Failed to initialize tourData after max attempts');
          } else {
            proceedWithTourData();
          }
        }
      }, 100);
    } else {
      proceedWithTourData();
    }
  };

  checkAndProceed();

  function proceedWithTourData() {
    const tourId = window.tourData.id || window.tourData._id || null;
    const tourType = window.tourData.type || 'passive';
    const tourPrice = window.tourData.price || 0;
    const seasonStart = new Date(window.tourData.season?.start || new Date());
    const seasonEnd = new Date(window.tourData.season?.end || new Date(Date.now() + 30 * 86400000));
    const maxGroupSize = window.tourData.maxGroupSize || 10;
    const minGroupSize = window.tourData.minGroupSize || 1;
    const durationDays = window.tourData.durationDays || 1;
    const accommodationType = window.tourData.accommodation?.type || 'none';
    const hotel = window.tourData.accommodation?.hotel || null;
    const isHotDeal = window.tourData.isHotDeal || false;
    const discounts = window.tourData.discounts || {
      groupDiscount: { enabled: false, minParticipants: 5, percentage: 0 },
      seasonalDiscount: { enabled: false, startDate: null, endDate: null, percentage: 0 },
      hotDealDiscount: { enabled: false, percentage: 0 },
    };

    console.log('Tour data:', { tourId, tourType, tourPrice, seasonStart, seasonEnd, maxGroupSize, minGroupSize, durationDays, accommodationType, hotel, isHotDeal, discounts });

    if (isNaN(seasonStart.getTime()) || isNaN(seasonEnd.getTime())) {
      console.error('Invalid season dates:', window.tourData.season);
      if (bookingError) {
        bookingError.textContent = 'Ошибка: некорректные даты сезона';
        bookingError.classList.remove('hidden');
      }
      if (bookTourBtn) bookTourBtn.disabled = true;
      return;
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'ru',
      validRange: {
        start: seasonStart,
        end: new Date(seasonEnd.getTime() + 86400000),
      },
      events: async function(fetchInfo, successCallback, failureCallback) {
        try {
          const response = await fetch(`/tours/${tourId || 'default'}/availability`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const events = await response.json();
          console.log('Raw availability events:', events); // Отладочный лог
          const processedEvents = events.map(event => {
            let availableSlots = 0;
            if (event.title && typeof event.title === 'string') {
              const match = event.title.match(/Доступно: (\d+)/);
              if (match) {
                availableSlots = parseInt(match[1], 10);
              }
            }
            return { ...event, availableSlots }; // Убедимся, что availableSlots добавляется
          }).filter(event => event.availableSlots >= minGroupSize);
          console.log('Processed events for calendar:', processedEvents); // Отладочный лог
          successCallback(processedEvents);
        } catch (error) {
          console.warn('Error fetching availability for calendar (may be due to no auth):', error);
          if (bookingError) {
            bookingError.textContent = 'Данные доступности не могут быть загружены. Пожалуйста, попробуйте позже.';
            bookingError.classList.remove('hidden');
          }
          successCallback([]); // Пустой календарь при ошибке
        }
      },
      eventDidMount: function(info) {
        if (tippy && info.event.availableSlots !== undefined) {
          tippy(info.el, {
            content: info.event.availableSlots >= minGroupSize
              ? `Осталось мест: ${info.event.availableSlots}`
              : 'Нет доступных мест',
            placement: 'top',
            theme: 'light',
          });
        }
      },
      eventClick: function(info) {
        console.log('Event clicked:', info.event); // Отладочный лог
        if (info.event.extendedProps && info.event.extendedProps.availableSlots >= minGroupSize && tourDateInput && participantsInput) {
          tourDateInput.value = info.event.startStr;
          participantsInput.max = info.event.extendedProps.availableSlots;
          if (bookingError) bookingError.classList.add('hidden');
          console.log('Selected date from calendar:', info.event.startStr, 'Available slots:', info.event.extendedProps.availableSlots);
          if (typeof calculatePrice === 'function') {
            calculatePrice();
            tourDateInput.dispatchEvent(new Event('change')); // Ручной вызов события change
          }
        } else {
          console.log('Click ignored, conditions not met:', { availableSlots: info.event.extendedProps?.availableSlots, minGroupSize, tourDateInput, participantsInput });
        }
      }
    });
    calendar.render();
    console.log('Calendar initialized');

    if (bookingForm && tourDateInput && participantsInput && bookTourBtn && bookingError && bookingSuccess && totalPriceInput && totalPriceDisplay) {
      const calculatePrice = () => {
        const participants = parseInt(participantsInput.value) || 0;
        const roomType = roomTypeInput ? roomTypeInput.value : null;
        const tourDate = tourDateInput.value ? new Date(tourDateInput.value) : new Date();
        let totalPrice = tourPrice * participants * durationDays; // Учитываем все дни

        let discountPercentage = 0;
        if (discounts.groupDiscount.enabled && participants >= discounts.groupDiscount.minParticipants) {
          discountPercentage = Math.max(discountPercentage, discounts.groupDiscount.percentage);
        }
        if (
          discounts.seasonalDiscount.enabled &&
          tourDate >= new Date(discounts.seasonalDiscount.startDate) &&
          tourDate <= new Date(discounts.seasonalDiscount.endDate)
        ) {
          discountPercentage = Math.max(discountPercentage, discounts.seasonalDiscount.percentage);
        }
        if (isHotDeal && discounts.hotDealDiscount.enabled) {
          discountPercentage = Math.max(discountPercentage, discounts.hotDealDiscount.percentage);
        }
        if (discountPercentage > 0) {
          totalPrice *= (1 - discountPercentage / 100);
        }

        if (roomTypeInput && ['hotel', 'sanatorium'].includes(accommodationType) && roomType && hotel) {
          if (roomType === 'standardWithAC') {
            totalPrice *= 1.10;
          } else if (roomType === 'luxury') {
            const luxuryMarkup = hotel.rating > 4 ? 1.30 : 1.20;
            totalPrice *= luxuryMarkup;
          }
        }

        totalPrice = Math.round(totalPrice);
        totalPriceInput.value = totalPrice;
        totalPriceDisplay.textContent = `Итоговая цена: ${totalPrice.toLocaleString('ru-RU')} ₽`;
      };

      participantsInput.addEventListener('input', calculatePrice);
      if (roomTypeInput) roomTypeInput.addEventListener('change', calculatePrice);
      tourDateInput.addEventListener('change', calculatePrice);

      if (['active', 'camping', 'excursion'].includes(tourType)) {
        fetch(`/tours/${tourId || 'default'}/availability`)
          .then(response => response.json())
          .then(events => {
            const select = tourDateInput;
            select.innerHTML = '<option value="">Выберите дату</option>';

            const availableDates = [];
            events.forEach(event => {
              const startDate = new Date(event.start);
              let allDaysAvailable = true;
              let minSlots = 0;
              if (event.title && typeof event.title === 'string') {
                const match = event.title.match(/Доступно: (\d+)/);
                if (match) {
                  minSlots = parseInt(match[1], 10);
                }
              }

              for (let i = 0; i < durationDays; i++) {
                const checkDate = new Date(startDate);
                checkDate.setDate(startDate.getDate() + i);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                const eventOnDate = events.find(e => e.start === checkDateStr);
                let slots = 0;
                if (eventOnDate && eventOnDate.title) {
                  const match = eventOnDate.title.match(/Доступно: (\d+)/);
                  if (match) {
                    slots = parseInt(match[1], 10);
                  }
                }
                if (!eventOnDate || slots < minGroupSize) {
                  allDaysAvailable = false;
                  break;
                }
                minSlots = Math.min(minSlots, slots);
              }

              if (allDaysAvailable && minSlots >= minGroupSize) {
                availableDates.push({ start: event.start, slots: minSlots });
              }
            });

            availableDates.forEach(date => {
              const option = document.createElement('option');
              option.value = date.start;
              option.textContent = new Date(date.start).toLocaleDateString('ru-RU');
              select.appendChild(option);
            });

            tourDateInput.addEventListener('change', () => {
              const selectedDate = tourDateInput.value;
              if (selectedDate && !availableDates.find(d => d.start === selectedDate)) {
                bookingError.textContent = 'Выбранная дата недоступна';
                bookingError.classList.remove('hidden');
                tourDateInput.value = '';
                participantsInput.max = '';
              } else {
                bookingError.classList.add('hidden');
                const event = availableDates.find(d => d.start === selectedDate);
                participantsInput.max = event ? event.slots : maxGroupSize;
                calculatePrice();
              }
            });
          })
          .catch(error => {
            console.error('Error fetching availability for select:', error);
            bookingError.textContent = 'Ошибка загрузки доступных дат';
            bookingError.classList.remove('hidden');
          });
      } else {
        fetch(`/tours/${tourId || 'default'}/availability`)
          .then(response => response.json())
          .then(events => {
            const availableDates = [];

            events.forEach(event => {
              const startDate = new Date(event.start);
              let allDaysAvailable = true;
              let minSlots = 0;
              if (event.title && typeof event.title === 'string') {
                const match = event.title.match(/Доступно: (\d+)/);
                if (match) {
                  minSlots = parseInt(match[1], 10);
                }
              }

              for (let i = 0; i < durationDays; i++) {
                const checkDate = new Date(startDate);
                checkDate.setDate(startDate.getDate() + i);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                const eventOnDate = events.find(e => e.start === checkDateStr);
                let slots = 0;
                if (eventOnDate && eventOnDate.title) {
                  const match = eventOnDate.title.match(/Доступно: (\d+)/);
                  if (match) {
                    slots = parseInt(match[1], 10);
                  }
                }
                if (!eventOnDate || slots < minGroupSize) {
                  allDaysAvailable = false;
                  break;
                }
                minSlots = Math.min(minSlots, slots);
              }

              if (allDaysAvailable && minSlots >= minGroupSize) {
                availableDates.push({ start: event.start, slots: minSlots });
              }
            });

            tourDateInput.min = seasonStart.toISOString().split('T')[0];
            tourDateInput.max = seasonEnd.toISOString().split('T')[0];

            tourDateInput.addEventListener('input', () => {
              const selectedDate = tourDateInput.value;
              if (selectedDate && !availableDates.find(d => d.start === selectedDate)) {
                bookingError.textContent = 'Выбранная дата недоступна';
                bookingError.classList.remove('hidden');
                tourDateInput.value = '';
                participantsInput.max = '';
              } else {
                bookingError.classList.add('hidden');
                const event = availableDates.find(d => d.start === selectedDate);
                participantsInput.max = event ? event.slots : maxGroupSize;
                calculatePrice();
              }
            });
          })
          .catch(error => {
            console.error('Error fetching availability for input:', error);
            bookingError.textContent = 'Ошибка загрузки доступных дат';
            bookingError.classList.remove('hidden');
          });
      }

      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Booking form submitted');

        const tourDate = tourDateInput.value;
        const participants = parseInt(participantsInput.value);
        const roomType = roomTypeInput ? roomTypeInput.value : undefined;
        const totalPrice = parseInt(totalPriceInput.value);

        if (!tourDate) {
          bookingError.textContent = 'Пожалуйста, выберите дату тура';
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
          return;
        }

        const selectedDate = new Date(tourDate);
        if (isNaN(selectedDate.getTime())) {
          bookingError.textContent = 'Некорректная дата тура';
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
          return;
        }

        if (selectedDate < seasonStart || selectedDate > seasonEnd) {
          bookingError.textContent = `Дата должна быть в пределах сезона: с ${seasonStart.toLocaleDateString('ru-RU')} по ${seasonEnd.toLocaleDateString('ru-RU')}`;
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
          return;
        }

        if (!participants || participants < 1) {
          bookingError.textContent = 'Количество участников должно быть больше 0';
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
          return;
        }

        if (roomTypeInput && ['hotel', 'sanatorium'].includes(accommodationType) && !roomType) {
          bookingError.textContent = 'Пожалуйста, выберите тип номера';
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
          return;
        }

        if (!totalPrice || totalPrice < 0) {
          bookingError.textContent = 'Итоговая цена не рассчитана';
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
          return;
        }

        try {
          bookTourBtn.disabled = true;
          bookTourBtn.textContent = 'Бронирование...';

          const response = await fetch('/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
              tourId: tourId || null,
              tourDate,
              participants,
              roomType,
              totalPrice,
            }),
          });

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

          bookingError.classList.add('hidden');
          bookingSuccess.textContent = 'Тур успешно забронирован! Перейдите в "Мои бронирования" для оплаты.';
          bookingSuccess.classList.remove('hidden');

          bookingForm.reset();
          totalPriceInput.value = '';
          totalPriceDisplay.textContent = 'Итоговая цена: 0 ₽';
          calendar.refetchEvents();
          if (['active', 'camping', 'excursion'].includes(tourType)) {
            tourDateInput.innerHTML = '<option value="">Выберите дату</option>';
            fetch(`/tours/${tourId || 'default'}/availability`)
              .then(response => response.json())
              .then(events => {
                const availableDates = [];
                events.forEach(event => {
                  const startDate = new Date(event.start);
                  let allDaysAvailable = true;
                  let minSlots = 0;
                  if (event.title && typeof event.title === 'string') {
                    const match = event.title.match(/Доступно: (\d+)/);
                    if (match) {
                      minSlots = parseInt(match[1], 10);
                    }
                  }

                  for (let i = 0; i < durationDays; i++) {
                    const checkDate = new Date(startDate);
                    checkDate.setDate(startDate.getDate() + i);
                    const checkDateStr = checkDate.toISOString().split('T')[0];
                    const eventOnDate = events.find(e => e.start === checkDateStr);
                    let slots = 0;
                    if (eventOnDate && eventOnDate.title) {
                      const match = eventOnDate.title.match(/Доступно: (\d+)/);
                      if (match) {
                        slots = parseInt(match[1], 10);
                      }
                    }
                    if (!eventOnDate || slots < minGroupSize) {
                      allDaysAvailable = false;
                      break;
                    }
                    minSlots = Math.min(minSlots, slots);
                  }

                  if (allDaysAvailable && minSlots >= minGroupSize) {
                    availableDates.push({ start: event.start, slots: minSlots });
                  }
                });

                availableDates.forEach(date => {
                  const option = document.createElement('option');
                  option.value = date.start;
                  option.textContent = new Date(date.start).toLocaleDateString('ru-RU');
                  tourDateInput.appendChild(option);
                });
              });
          }
        } catch (error) {
          console.error('Booking error:', error.message);
          bookingError.textContent = error.message;
          bookingError.classList.remove('hidden');
          bookingSuccess.classList.add('hidden');
        } finally {
          bookTourBtn.disabled = false;
          bookTourBtn.textContent = 'Забронировать';
        }
      });
    } else {
      console.log('Booking form not found, skipping form initialization');
    }

    if (localStorage.getItem('refreshTourAvailability') === 'true') {
      console.log('Refresh tour availability triggered');
      calendar.refetchEvents();
      localStorage.removeItem('refreshTourAvailability');
    }
  }
});