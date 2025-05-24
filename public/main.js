document.addEventListener('DOMContentLoaded', async () => {
  const carGrid = document.getElementById('car-grid');

  let currentlySelectedVin = localStorage.getItem('selectedVin');
  let allCarsData = [];

  function filterAndRender() {
    const searchBox = document.getElementById('search-box');
    const typeFilter = document.getElementById('type-filter');
    const brandFilter = document.getElementById('brand-filter');

    const q = searchBox ? searchBox.value.trim().toLowerCase() : "";
    const t = typeFilter ? typeFilter.value : "";
    const b = brandFilter ? brandFilter.value : "";

    const filtered = allCarsData.filter(c =>
      (!t || c.carType === t) &&
      (!b || c.brand === b) &&
      (
        !q || c.carType.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.carModel.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      )
    );
    renderCars(filtered);
  }

  function renderCars(list) {
    if (!carGrid) return;
    if (list.length === 0) {
      carGrid.innerHTML = '<p style="padding:32px;text-align:center;">No cars found matching your criteria.</p>';
      return;
    }
    carGrid.innerHTML = list.map(car => {
      const isSelected = car.vin === currentlySelectedVin;
      const buttonText = car.available ? (isSelected ? "Selected" : "Select") : "Unavailable";
      const selectedClass = isSelected ? "selected" : "";

      return `
          <div class="car-card ${selectedClass}" data-vin="${car.vin}">
            <img loading="lazy" src="${car.image}" alt="${car.carModel}">
            <div class="card-body">
              <h2>${car.brand} ${car.carModel}</h2>
            </div>
            <div class="card-footer">
              <button class="select-btn rent-btn" data-vin="${car.vin}" ${!car.available ? 'disabled' : ''}>${buttonText}</button>
              <p class="price">$${car.pricePerDay}/day</p>
            </div>
            <div class="card-details">
              <p>${car.description}</p>
              <p><strong>Type:</strong> ${car.carType}</p>
              <p><strong>Year:</strong> ${car.yearOfManufacture}</p>
              <p><strong>Odometer:</strong> ${car.mileage}</p>
              <p><strong>Fuel:</strong> ${car.fuelType}</p>
            </div>
          </div>
        `;
    }).join('');


    carGrid.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!e.target.disabled) {
          const clickedVin = e.target.dataset.vin;
          handleCarSelection(clickedVin);
        }
      });
    });
  }

  function handleCarSelection(clickedVin) {
    if (currentlySelectedVin === clickedVin) {
      currentlySelectedVin = null;
      localStorage.removeItem('selectedVin');
    } else {
      currentlySelectedVin = clickedVin;
      localStorage.setItem('selectedVin', clickedVin);
    }
    filterAndRender();
  }

  function setupSearchAndFilters() {
    const searchBox = document.getElementById('search-box');
    const typeFilter = document.getElementById('type-filter');
    const brandFilter = document.getElementById('brand-filter');
    const suggestions = document.getElementById('suggestions');

    function updateSuggestions() {
      if (!searchBox || !suggestions) return;
      const val = searchBox.value.trim().toLowerCase();
      if (!val) {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        return;
      }

      const keywords = [...new Set(allCarsData.flatMap(c => [
        c.carType, c.brand, c.carModel,
        ...(c.description ? c.description.toLowerCase().split(/\s+/).filter(s => s.length > 2) : [])
      ].filter(Boolean)))];

      const matches = keywords.filter(w => w.toLowerCase().includes(val)).slice(0, 5);

      if (matches.length > 0) {
        suggestions.innerHTML = matches.map(w => `<div class="suggestion">${w}</div>`).join('');
        suggestions.style.display = 'block';
      } else {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
      }
    }

    if (searchBox) {
      searchBox.addEventListener('input', () => {
        updateSuggestions();
        filterAndRender();
      });

      document.addEventListener('click', (e) => {
        if (suggestions && !searchBox.contains(e.target) && !suggestions.contains(e.target)) {
          suggestions.style.display = 'none';
        }
      });
    }
    if (typeFilter) typeFilter.addEventListener('change', filterAndRender);
    if (brandFilter) brandFilter.addEventListener('change', filterAndRender);

    if (suggestions) {
      suggestions.addEventListener('mousedown', e => {
        if (e.target.classList.contains('suggestion')) {
          searchBox.value = e.target.textContent;
          suggestions.innerHTML = '';
          suggestions.style.display = 'none';
          filterAndRender();
        }
      });
    }
  }

  if (carGrid) {
    carGrid.innerHTML = '<div class="spinner"></div>';
  }
  try {
    const res = await fetch('/cars');
    if (!res.ok) throw new Error("Failed to fetch cars.");
    const carsResponse = await res.json();
    allCarsData = Array.isArray(carsResponse) ? carsResponse : (carsResponse.cars || []);

    filterAndRender();
    setupSearchAndFilters();
  } catch (error) {
    console.error("Error loading cars:", error);
    if (carGrid) {
      carGrid.innerHTML = '<p style="padding:32px;text-align:center;color:red;">Could not load car data. Please try again later.</p>';
    }
  }
});