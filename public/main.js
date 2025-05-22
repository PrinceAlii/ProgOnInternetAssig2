document.addEventListener('DOMContentLoaded', async () => {
    const carGrid = document.getElementById('car-grid');
    const res = await fetch('/cars');
    const cars = await res.json();

    renderCars(cars);
    setupSearchAndFilters(cars);

    const reservationIcon = document.getElementById('reservation-label');
    reservationIcon.addEventListener('click', e => {
        e.preventDefault();
        if (localStorage.getItem('reservationDraft') && localStorage.getItem('selectedVin')) {
            window.location.href = 'reservation.html';
        } else {
            alert('No unfinished reservation found.');
        }
    });
});

function renderCars(cars) {
    const carGrid = document.getElementById('car-grid');
    carGrid.innerHTML = cars.map(car => `
        <div class="car-card">
            <img src="${car.image}" alt="${car.carModel}">
            <h2>${car.brand} ${car.carModel}</h2>
            <p class="car-desc">${car.description}</p>
            <p>Type: ${car.carType} | Year: ${car.yearOfManufacture}</p>
            <p>Mileage: ${car.mileage} | Fuel: ${car.fuelType}</p>
            <p><strong>$${car.pricePerDay}/day</strong></p>
            <button class="rent-btn" data-vin="${car.vin}" ${!car.available ? 'disabled' : ''}>${car.available ? 'Rent' : 'Unavailable'}</button>
        </div>
    `).join('');
    document.querySelectorAll('.rent-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            localStorage.setItem('selectedVin', btn.dataset.vin);
            window.location.href = 'reservation.html';
        });
    });
}


function setupSearchAndFilters(cars) {
    const searchBox = document.getElementById('search-box');
    const suggestions = document.getElementById('suggestions');
    const typeFilter = document.getElementById('type-filter');
    const brandFilter = document.getElementById('brand-filter');

    searchBox.addEventListener('input', () => {
        const val = searchBox.value.toLowerCase();
        if (!val) {
            suggestions.innerHTML = '';
            filterAndRender();
            return;
        }
        const keywords = Array.from(new Set(
            cars.flatMap(car => [
                car.carType,
                car.brand,
                car.carModel,
                ...(car.description ? car.description.split(' ') : [])
            ]).filter(Boolean)
        ));
        const matches = keywords.filter(word => word.toLowerCase().includes(val));
        suggestions.innerHTML = matches.slice(0, 5).map(word => `<div class="suggestion">${word}</div>`).join('');
        filterAndRender();
    });

    suggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion')) {
            searchBox.value = e.target.textContent;
            suggestions.innerHTML = '';
            filterAndRender();
        }
    });

    typeFilter.addEventListener('change', filterAndRender);
    brandFilter.addEventListener('change', filterAndRender);

    function filterAndRender() {
        const searchVal = searchBox.value.toLowerCase();
        const typeVal = typeFilter.value;
        const brandVal = brandFilter.value;
        let filtered = cars.filter(car =>
            (!typeVal || car.carType === typeVal) &&
            (!brandVal || car.brand === brandVal) &&
            (
                !searchVal ||
                car.carType.toLowerCase().includes(searchVal) ||
                car.brand.toLowerCase().includes(searchVal) ||
                car.carModel.toLowerCase().includes(searchVal) ||
                (car.description && car.description.toLowerCase().includes(searchVal))
            )
        );
        renderCars(filtered);

        document.querySelectorAll('.car-card img, .car-card h2').forEach(el => {
            el.addEventListener('click', e => {
                const vin = el.closest('.car-card').querySelector('.rent-btn').dataset.vin;
                const car = cars.find(c => c.vin === vin);
                showCarModal(car);
            });
        });        

        function showCarModal(car) {
            const modalBg = document.getElementById('car-modal');
            const modalContent = document.getElementById('modal-content');
            modalContent.innerHTML = `
                <button id="close-modal">&times;</button>
                <img src="${car.image}" alt="${car.carModel}" style="width:100%;border-radius:8px;max-height:150px;object-fit:cover;margin-bottom:12px;">
                <h2>${car.brand} ${car.carModel}</h2>
                <p>${car.description}</p>
                <p>Type: ${car.carType}</p>
                <p>Year: ${car.yearOfManufacture}</p>
                <p>Mileage: ${car.mileage}</p>
                <p>Fuel: ${car.fuelType}</p>
                <p>Price per day: $${car.pricePerDay}</p>
                <p>Status: <span style="color:${car.available ? '#09ab3b':'#e03c3c'}">${car.available ? 'Available':'Unavailable'}</span></p>
            `;
            modalBg.style.display = 'flex';
            document.getElementById('close-modal').onclick = () => modalBg.style.display = 'none';
            modalBg.onclick = e => { if (e.target === modalBg) modalBg.style.display = 'none'; };
        }
        
    }
}

