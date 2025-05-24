document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('reservation-root');
  const vin = localStorage.getItem('selectedVin');

  if (!vin) {
    root.innerHTML = '<p style="padding:24px;text-align:center;">Please select a car to reserve from the homepage.</p>';
    return;
  }

  root.innerHTML = '<div class="spinner"></div>';

  let carData;

  try {
    const res = await fetch('/cars');
    if (!res.ok) throw new Error('Failed to fetch car data');
    const cars = await res.json();
    const carList = Array.isArray(cars) ? cars : cars.cars;

    carData = carList.find(c => c.vin === vin);

    if (!carData) {
      root.innerHTML = '<p style="padding:24px;text-align:center;">Selected car not found.</p>';
      return;
    }

    if (!carData.available) {
      root.innerHTML = `
            <div class="car-card reservation-card">
                <img src="${carData.image}" alt="${carData.carModel}" />
                <div class="card-body"><h2>${carData.brand} ${carData.carModel}</h2></div>
            </div>
            <p style="padding:24px;text-align:center;color:#e06c75;">This car is currently unavailable. Please return to the homepage and select another car.</p>
            <div style="text-align:center;margin-top:16px;">
                <a href="index.html" class="nav-btn">Return Home</a>
            </div>`;
      return;
    }

    root.innerHTML = `
        <div class="car-card reservation-card">
            <img src="${carData.image}" alt="${carData.carModel}" />
            <div class="card-body">
                <h2>${carData.brand} ${carData.carModel}</h2>
                <p>${carData.description}</p>
                <p>Type: ${carData.carType} | Year: ${carData.yearOfManufacture}</p>
                <p>Mileage: ${carData.mileage} | Fuel: ${carData.fuelType}</p>
                <p class="price">$${carData.pricePerDay}/day</p>
            </div>
        </div>
        <form id="reservation-form" class="styled-form" autocomplete="off" novalidate>
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
                <input id="startDate" name="startDate" type="date" required min="${new Date().toISOString().slice(0, 10)}" />
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
        </form>`;

    const form = document.getElementById('reservation-form');
    const saved = JSON.parse(localStorage.getItem('reservationDraft') || '{}');
    Object.keys(saved).forEach(key => {
      const el = form.elements.namedItem(key);
      if (el) el.value = saved[key];
    });

    validateForm(form, carData.pricePerDay, false);


    ['name', 'phone', 'email', 'license', 'startDate', 'rentalPeriod'].forEach(fieldName => {
      const field = form.elements[fieldName];
      if (field) {
        field.addEventListener('blur', function () {
          this.dataset.touched = 'true';
          validateForm(form, carData.pricePerDay, false);
        });
      }
    });

    form.addEventListener('input', () => {
      const draft = {};
      Array.from(form.elements).forEach(el => {
        if (el.name) draft[el.name] = el.value;
      });
      localStorage.setItem('reservationDraft', JSON.stringify(draft));
      validateForm(form, carData.pricePerDay, false);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const isFormValid = validateForm(form, carData.pricePerDay, true);

      if (!isFormValid) {

        const firstErrorField = form.querySelector('.error-msg:not(:empty)');
        if (firstErrorField) {
          const inputId = firstErrorField.id.replace('error-', '');
          form.elements[inputId]?.focus();
        }
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      const rentalPeriod = parseInt(data.rentalPeriod, 10) || 0;
      const payload = {
        customer: {
          name: data.name,
          phoneNumber: data.phone,
          email: data.email,
          driversLicenseNumber: data.license
        },
        car: {
          vin
        },
        rental: {
          startDate: data.startDate,
          rentalPeriod,
          totalPrice: rentalPeriod * carData.pricePerDay,
          orderDate: new Date().toISOString().slice(0, 10)
        },
        status: 'pending'
      };


      const submitBtn = document.getElementById('submit-btn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      try {
        const response = await fetch('/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
          localStorage.removeItem('reservationDraft');
          localStorage.removeItem('selectedVin');
          window.location.href = `confirmation.html?orderId=${result.orderId}`;

        } else {

          window.location.href = `confirmation.html?status=failure&message=${encodeURIComponent(result.message || 'Reservation failed.')}`;
        }
      } catch (submissionError) {
        alert("An error occurred while submitting your reservation. Please try again.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Reservation';
        }
      }
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
      localStorage.removeItem('reservationDraft');
      localStorage.removeItem('selectedVin');
      window.location.href = 'index.html';
    });

  } catch (error) {
    root.innerHTML = `<p style="padding:24px;text-align:center;color:red;">Error loading reservation details: ${error.message}</p>`;
  }
});

function showError(id, message) {
  const errorElement = document.getElementById(id);

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function validateForm(form, pricePerDay, showAllErrorsEvenIfNotTouched = false) {
  const data = Object.fromEntries(new FormData(form));
  let isFormOverallValid = true;


  const shouldShowErrorForField = (field, hasError) => {
    return showAllErrorsEvenIfNotTouched || field.dataset.touched === 'true' || !hasError;
  };


  const nameField = form.elements.name;

  if (!data.name || data.name.trim().length < 2) {
    if (shouldShowErrorForField(nameField, true)) showError('error-name', 'Enter your full name (min 2 characters)');
    isFormOverallValid = false;

  } else {
    showError('error-name', '');
  }


  const phoneField = form.elements.phone;

  if (!data.phone || !/^[0-9+ ]{10,}$/.test(data.phone.trim())) {
    if (shouldShowErrorForField(phoneField, true)) showError('error-phone', 'Enter a valid phone number (min 10 digits)');
    isFormOverallValid = false;

  } else {
    showError('error-phone', '');
  }

  const emailField = form.elements.email;

  if (!data.email || !/\S+@\S+\.\S+/.test(data.email.trim())) {
    if (shouldShowErrorForField(emailField, true)) showError('error-email', 'Enter a valid email address');
    isFormOverallValid = false;

  } else {
    showError('error-email', '');
  }


  const licenseField = form.elements.license;

  if (!data.license || data.license.trim().length < 5) {

    if (shouldShowErrorForField(licenseField, true)) showError('error-license', 'Enter a valid license number (min 5 characters)');
    isFormOverallValid = false;

  } else {
    showError('error-license', '');
  }

  const startDateField = form.elements.startDate;
  if (!data.startDate) {
    if (shouldShowErrorForField(startDateField, true)) showError('error-startDate', 'Choose a start date');
    isFormOverallValid = false;

  } else if (isNaN(Date.parse(data.startDate))) {
    if (shouldShowErrorForField(startDateField, true)) showError('error-startDate', 'Choose a valid start date format (dd/mm/yyyy)');
    isFormOverallValid = false;

  } else if (new Date(data.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
    if (shouldShowErrorForField(startDateField, true)) showError('error-startDate', 'Start date cannot be in the past');
    isFormOverallValid = false;

  } else {
    showError('error-startDate', '');
  }

  const rentalPeriodField = form.elements.rentalPeriod;

  if (!data.rentalPeriod || +data.rentalPeriod < 1 || isNaN(+data.rentalPeriod)) {
    if (shouldShowErrorForField(rentalPeriodField, true)) showError('error-rentalPeriod', 'Enter a valid number of days (min 1)');
    isFormOverallValid = false;
  } else {
    showError('error-rentalPeriod', '');
  }

  const pricePreview = document.getElementById('price-preview');
  const rentalPeriodValue = parseInt(data.rentalPeriod, 10);

  if (pricePreview && rentalPeriodValue >= 1 && pricePerDay) {
    pricePreview.textContent = `Total Price: $${rentalPeriodValue * pricePerDay}`;

  } else if (pricePreview) {
    pricePreview.textContent = '';
  }

  const submitBtn = document.getElementById('submit-btn');

  if (submitBtn) {
    submitBtn.disabled = !isFormOverallValid;
  }

  return isFormOverallValid;
}