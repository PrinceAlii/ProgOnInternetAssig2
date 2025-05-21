document.addEventListener('DOMContentLoaded', async () => {
    const carGrid = document.getElementById('car-grid');
    const res = await fetch('/cars');
    const cars = await res.json();

    carGrid.innerHTML = cars.map(car => `
        <div class="car-card">
            <img src="images/${car.image}" alt="${car.model}">
            <h2>${car.brand} ${car.model}</h2>
            <p>${car.description}</p>
            <p><strong>$${car.pricePerDay}/day</strong></p>
            <button ${!car.available ? 'disabled' : ''}>${car.available ? 'Rent' : 'Unavailable'}</button>
        </div>
    `).join('');
});
