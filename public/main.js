document.addEventListener('DOMContentLoaded',async()=>{
  const carGrid=document.getElementById('car-grid');
  const reservationLabel=document.getElementById('reservation-label');

  carGrid.innerHTML='<div class="spinner"></div>';
  const res=await fetch('/cars');
  const cars=await res.json();
  renderCars(cars);
  setupSearchAndFilters(cars);

  function renderCars(list){
    if(list.length===0){
      carGrid.innerHTML='<p style="padding:32px;text-align:center;">No cars found matching your criteria.</p>';
      return;
    }
    carGrid.innerHTML=list.map(car=>`
      <div class="car-card" data-vin="${car.vin}">
        <img loading="lazy" src="${car.image}" alt="${car.carModel}">
        <div class="card-body">
          <h2>${car.brand} ${car.carModel}</h2>
        </div>
        <div class="card-footer">
          <p class="price">$${car.pricePerDay}/day</p>
          <button class="rent-btn" data-vin="${car.vin}" ${!car.available?'disabled':''}>${car.available?'Rent':'Unavailable'}</button>
        </div>
        <div class="card-details">
          <p>${car.description}</p>
          <p><strong>Type:</strong> ${car.carType}</p>
          <p><strong>Year:</strong> ${car.yearOfManufacture}</p>
          <p><strong>Odometer:</strong> ${car.mileage}</p>
          <p><strong>Fuel:</strong> ${car.fuelType}</p>
        </div>
      </div>
    `).join('');

    carGrid.querySelectorAll('.rent-btn').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        localStorage.setItem('selectedVin',btn.dataset.vin);
        window.location.href='reservation.html';
      });
    });
  }

  function setupSearchAndFilters(allCars){
    const searchBox=document.getElementById('search-box');
    const typeFilter=document.getElementById('type-filter');
    const brandFilter=document.getElementById('brand-filter');
    const suggestions=document.getElementById('suggestions');

    function updateSuggestions(){
      const val=searchBox.value.trim().toLowerCase();
      if(!val){suggestions.innerHTML='';return;}
      const keywords=[...new Set(allCars.flatMap(c=>[
        c.carType,c.brand,c.carModel,...(c.description?c.description.split(' '):[])
      ]))];
      const matches=keywords.filter(w=>w.toLowerCase().includes(val)).slice(0,5);
      suggestions.innerHTML=matches.map(w=>`<div class="suggestion">${w}</div>`).join('');
    }

    function filterAndRender(){
      const q=searchBox.value.trim().toLowerCase();
      const t=typeFilter.value;
      const b=brandFilter.value;
      const filtered=allCars.filter(c=>
        (!t||c.carType===t)&&(!b||c.brand===b)&&(
          !q||c.carType.toLowerCase().includes(q)||
          c.brand.toLowerCase().includes(q)||
          c.carModel.toLowerCase().includes(q)||
          (c.description&&c.description.toLowerCase().includes(q))
        )
      );
      renderCars(filtered);
    }

    searchBox.addEventListener('input',()=>{updateSuggestions();filterAndRender()});
    typeFilter.addEventListener('change',filterAndRender);
    brandFilter.addEventListener('change',filterAndRender);
    suggestions.addEventListener('mousedown',e=>{
      if(e.target.classList.contains('suggestion')){
        searchBox.value=e.target.textContent;
        suggestions.innerHTML='';
        filterAndRender();
      }
    });
  }
});
