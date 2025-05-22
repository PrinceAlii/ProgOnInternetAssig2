document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('reservation-root');
    const vin = localStorage.getItem('selectedVin');

    if (!vin) {
        root.innerHTML = '<p>Please select a car to reserve from the homepage.</p>';
        return;
    }

    const res = await fetch('/cars');
    const cars = await res.json();
    const car = cars.find(c => c.vin === vin);

    if (!car) {
        root.innerHTML = '<p>Selected car not found.</p>';
        return;
    }
    
    root.innerHTML = renderCarInfo(car) + renderForm(car.available);

    if (!car.available) {
        document.getElementById('reservation-form').style.display = 'none';
        document.getElementById('unavailable-msg').style.display = 'block';
        return;
    }

    const saved = JSON.parse(localStorage.getItem('reservationDraft') || '{}');
    const form = document.getElementById('reservation-form');
    Object.keys(saved).forEach(k => {
        if (form[k]) form[k].value = saved[k];
    });

    form.addEventListener('input', () => {
        const formData = {};
        Array.from(form.elements).forEach(el => {
            if (el.name) formData[el.name] = el.value;
        });
        localStorage.setItem('reservationDraft', JSON.stringify(formData));
        validateForm(form, car.pricePerDay);
    });

    validateForm(form, car.pricePerDay);

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const rentalPeriod = parseInt(data.rentalPeriod) || 0;
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
                totalPrice: rentalPeriod * car.pricePerDay,
                orderDate: new Date().toISOString().slice(0, 10)
            }
        };
        const resp = await fetch('/orders', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const result = await resp.json();
        if (result.success) {
            localStorage.removeItem('reservationDraft');
            window.location.href = 'confirmation.html?status=success';
        } else {
            window.location.href = 'confirmation.html?status=failure';
        }
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        localStorage.removeItem('reservationDraft');
        window.location.href = 'index.html';
    });
});

function renderCarInfo(car) {
    return `
        <div class="car-card">
            <img src="${car.image}" alt="${car.carModel}">
            <h2>${car.brand} ${car.carModel}</h2>
            <p class="car-desc">${car.description}</p>
            <p>Type: ${car.carType} | Year: ${car.yearOfManufacture}</p>
            <p>Mileage: ${car.mileage} | Fuel: ${car.fuelType}</p>
            <p><strong>$${car.pricePerDay}/day</strong></p>
        </div>
    `;
}

function renderForm(available) {
    return `
        <form id="reservation-form" class="styled-form" autocomplete="off">
            <div id="unavailable-msg" style="display:none;color:#e03c3c;font-size:18px;margin-bottom:14px;">This car is currently unavailable. Please choose another car.</div>
            <div class="form-field">
                <input type="text" name="name" placeholder="Full Name" required />
                <div class="error-msg" id="error-name"></div>
            </div>
            <div class="form-field">
                <input type="tel" name="phone" placeholder="Phone Number" required pattern="^[0-9+ ]{8,}$"/>
                <div class="error-msg" id="error-phone"></div>
            </div>
            <div class="form-field">
                <input type="email" name="email" placeholder="Email" required />
                <div class="error-msg" id="error-email"></div>
            </div>
            <div class="form-field">
                <input type="text" name="license" placeholder="Driver License Number" required />
                <div class="error-msg" id="error-license"></div>
            </div>
            <div class="form-field">
                <input type="date" name="startDate" required min="${new Date().toISOString().slice(0,10)}"/>
                <div class="error-msg" id="error-startDate"></div>
            </div>
            <div class="form-field">
                <input type="number" name="rentalPeriod" placeholder="Rental Period (days)" required min="1"/>
                <div class="error-msg" id="error-rentalPeriod"></div>
            </div>
            <div id="price-preview" style="margin:16px 0 6px 0;font-weight:600;color:#186ec6;"></div>
            <button type="submit" id="submit-btn" disabled>Submit Reservation</button>
            <button type="button" id="cancel-btn" class="cancel-btn">Cancel</button>
        </form>
    `;
}


function validateForm(form, pricePerDay) {
    const data = Object.fromEntries(new FormData(form));
    let valid = true;

    if (!data.name || data.name.trim().length < 2) {
        showError('error-name', 'Please enter your full name');
        valid = false;
    } else {
        showError('error-name', '');
    }

    if (!data.phone || !/^[0-9+ ]{10,}$/.test(data.phone)) {
        showError('error-phone', 'Enter a valid phone number (at least 10 digits, including leading 0)');
        valid = false;
    } else {
        showError('error-phone', '');
    }

    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
        showError('error-email', 'Enter a valid email address');
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

    const price = data.rentalPeriod && +data.rentalPeriod >= 1 ? +data.rentalPeriod * pricePerDay : 0;
    document.getElementById('price-preview').textContent = price ? `Total Price: $${price}` : '';
    document.getElementById('submit-btn').disabled = !valid;
}

function showError(id, message) {
    document.getElementById(id).textContent = message;
}
