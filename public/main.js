$(function() {
  let allCars = [];

  $.getJSON('/api/cars')
    .done(payload => {
      allCars = payload.cars;
      buildFilters(allCars);
      renderGrid(allCars);
    })
    .fail((jq, txt, err) => {
      console.error('Failed to load cars:', txt, err);
      $('#grid').html('<p>Error loading cars. Please try again later.</p>');
    });

  function renderGrid(cars) {
    const $grid = $('#grid').empty();
    if (!cars.length) {
      $grid.html('<p>No cars match your criteria.</p>');
      return;
    }
    cars.forEach(car => {
      const $card = $(`
        <div class="column one-third card">
          <h4>${car.brand} ${car.carModel}</h4>
          <p>Type: ${car.carType}</p>
          <p>Daily Rate: $${car.pricePerDay.toFixed(2)}/day</p>
          ${car.available ? '' : '<p><strong>Unavailable</strong></p>'}
          <button
            class="rent-btn"
            data-vin="${car.vin}"
            ${car.available ? '' : 'disabled'}
          >
            ${car.available ? 'Rent' : 'Not Available'}
          </button>
        </div>
      `);
      $grid.append($card);
    });
  }

  function buildFilters(cars) {
    const types  = [...new Set(cars.map(c => c.carType))];
    const brands = [...new Set(cars.map(c => c.brand))];
    const $filters = $('#filters').empty();

    function makeGroup(title, items, name) {
      const $g = $(`<div class="filter-group"><strong>${title}</strong></div>`);
      items.forEach(item => {
        const id = `filter-${name}-${item.replace(/\s+/g, '')}`;
        $g.append(`
          <label for="${id}">
            <input
              type="checkbox"
              id="${id}"
              name="${name}"
              value="${item}"
              checked
            >
            ${item}
          </label>
        `);
      });
      return $g;
    }

    $filters
      .append(makeGroup('Type',  types,  'type'))
      .append(makeGroup('Brand', brands, 'brand'));
  }

  function applyFilters() {
    const term      = $('#searchBox').val().toLowerCase();
    const selTypes  = $('input[name="type"]:checked').map((_,el) => el.value).get();
    const selBrands = $('input[name="brand"]:checked').map((_,el) => el.value).get();

    const filtered = allCars.filter(car => {
      const hay = [car.carType, car.brand, car.carModel, car.description]
        .join(' ').toLowerCase();
      if (term && !hay.includes(term)) return false;
      if (selTypes.length  && !selTypes.includes(car.carType)) return false;
      if (selBrands.length && !selBrands.includes(car.brand))   return false;
      return true;
    });

    renderGrid(filtered);
  }

  $('#searchBox').on('input', applyFilters);
  $('#filters').on('change', 'input[type=checkbox]', applyFilters);

  $('#grid').on('click', '.rent-btn', function() {
    const vin = $(this).data('vin');
    console.log('Rent clicked for VIN', vin);
  });
});
