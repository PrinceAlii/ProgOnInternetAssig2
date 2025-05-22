document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('reservation-root');
    const vin = localStorage.getItem('selectedVin');
  
    document.getElementById('reservation-label').addEventListener('click', e => {
      e.preventDefault();
      if (localStorage.getItem('reservationDraft') && localStorage.getItem('selectedVin')) {
        window.location.href = 'reservation.html';
      } else {
        alert('No unfinished reservation found.');
      }
    });
  
    if (!vin) {
      root.innerHTML = '<p style="padding:24px;text-align:center;">Please select a car to reserve from the homepage.</p>';
      return;
    }
  
    root.innerHTML = '<div class="spinner"></div>';
  
    const res = await fetch('/cars');
    const cars = await res.json();
    const car = cars.find(c => c.vin === vin);
  
    if (!car) {
      root.innerHTML = '<p style="padding:24px;text-align:center;">Selected car not found.</p>';
      return;
    }
  
    root.innerHTML = `
      <div class="car-card reservation-card">
        <img src="${car.image}" alt="${car.carModel}" />
        <div class="card-body">
          <h2>${car.brand} ${car.carModel}</h2>
          <p>${car.description}</p>
          <p>Type: ${car.carType} | Year: ${car.yearOfManufacture}</p>
          <p>Mileage: ${car.mileage} | Fuel: ${car.fuelType}</p>
          <p class="price">$${car.pricePerDay}/day</p>
        </div>
      </div>
      <form id="reservation-form" class="styled-form" autocomplete="off">
        <div class="form-field">
          <label for="name">Full Name</label>
          <input id="name" name="name" type="text" required />
          <div class="error-msg" id="error-name"></div>
        </div>
        <div class="form-field">
          <label for="phone">Phone Number</label>
          <input id="phone" name="phone" type="tel" required />
          <div class="error-msg" id="error-phone"></div>
        </div>
        <div class="form-field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />
          <div class="error-msg" id="error-email"></div>
        </div>
        <div class="form-field">
          <label for="license">Driver License No.</label>
          <input id="license" name="license" type="text" required />
          <div class="error-msg" id="error-license"></div>
        </div>
        <div class="form-field">
          <label for="startDate">Start Date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            min="${new Date().toISOString().slice(0,10)}"
          />
          <div class="error-msg" id="error-startDate"></div>
        </div>
        <div class="form-field">
          <label for="rentalPeriod">Rental Period (days)</label>
          <input id="rentalPeriod" name="rentalPeriod" type="number" min="1" required />
          <div class="error-msg" id="error-rentalPeriod"></div>
        </div>
        <div id="price-preview" class="price-preview"></div>
        <div class="form-actions">
          <button type="submit" id="submit-btn" class="nav-btn" disabled>Submit Reservation</button>
          <button type="button" id="cancel-btn" class="cancel-btn">Cancel</button>
        </div>
      </form>
    `;
  
    const form = document.getElementById('reservation-form');
    const saved = JSON.parse(localStorage.getItem('reservationDraft') || '{}');
    Object.keys(saved).forEach(key => {
      const el = form.elements.namedItem(key);
      if (el) el.value = saved[key];
    });
  
    form.addEventListener('input', () => {
      const draft = {};
      Array.from(form.elements).forEach(el => {
        if (el.name) draft[el.name] = el.value;
      });
      localStorage.setItem('reservationDraft', JSON.stringify(draft));
      validateForm(form, car.pricePerDay);
    });
  
    validateForm(form, car.pricePerDay);
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const rentalPeriod = parseInt(data.rentalPeriod, 10) || 0;
      const payload = {
        customer: {
          name: data.name,
          phoneNumber: data.phone,
          email: data.email,
          driversLicenseNumber: data.license
        },
        car: { vin },
        rental: {
          startDate: data.startDate,
          rentalPeriod,
          totalPrice: rentalPeriod * car.pricePerDay,
          orderDate: new Date().toISOString().slice(0,10)
        },
        status: 'pending'
      };
      const response = await fetch('/orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        localStorage.removeItem('reservationDraft');
        localStorage.removeItem('selectedVin');
        window.location.href = `confirmation.html?orderId=${result.orderId}`;
      } else {
        window.location.href = 'confirmation.html?status=failure';
      }
    });
  
    document.getElementById('cancel-btn').addEventListener('click', () => {
      localStorage.removeItem('reservationDraft');
      localStorage.removeItem('selectedVin');
      window.location.href = 'index.html';
    });
  });
  
  function validateForm(form, pricePerDay) {
    const data = Object.fromEntries(new FormData(form));
    let valid = true;
  
    if (!data.name || data.name.trim().length < 2) {
      showError('error-name', 'Enter your full name');
      valid = false;
    } else {
      showError('error-name', '');
    }
  
    if (!data.phone || !/^[0-9+ ]{10,}$/.test(data.phone)) {
      showError('error-phone', 'Enter a valid phone number');
      valid = false;
    } else {
      showError('error-phone', '');
    }
  
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      showError('error-email', 'Enter a valid email');
      valid = false;
    } else {
      showError('error-email', '');
    }
  
    if (!data.license || data.license.trim().length < 5) {
      showError('error-license', 'Enter a valid license number');
      valid = false;
    } else {
      showError('error-license', '');
    }
  
    if (!data.startDate || isNaN(Date.parse(data.startDate))) {
      showError('error-startDate', 'Choose a valid start date');
      valid = false;
    } else if (Date.parse(data.startDate) < Date.now() - 86400000) {
      showError('error-startDate', 'Start date cannot be in the past');
      valid = false;
    } else {
      showError('error-startDate', '');
    }
  
    if (!data.rentalPeriod || +data.rentalPeriod < 1) {
      showError('error-rentalPeriod', 'Enter a valid number of days');
      valid = false;
    } else {
      showError('error-rentalPeriod', '');
    }
  
    const price = data.rentalPeriod && +data.rentalPeriod >= 1
      ? +data.rentalPeriod * pricePerDay
      : 0;
  
    document.getElementById('price-preview').textContent = price
      ? `Total Price: $${price}`
      : '';
  
    document.getElementById('submit-btn').disabled = !valid;
  }
  
  function showError(id, message) {
    document.getElementById(id).textContent = message;
  }
  