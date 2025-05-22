document.getElementById('order-search-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('order-email').value.trim().toLowerCase();
    if (!email) return;
    const res = await fetch('/orders');
    const orders = await res.json();
    const myOrders = orders.filter(o => o.customer.email.toLowerCase() === email);
    const ordersList = document.getElementById('orders-list');
    if (!myOrders.length) {
        ordersList.innerHTML = '<p>No reservations found under this email.</p>';
        return;
    }
    ordersList.innerHTML = myOrders.map((order, i) => `
        <div class="car-card" style="margin-bottom: 20px;">
            <h2>${order.customer.name} - ${order.status.toUpperCase()}</h2>
            <p>Car VIN: ${order.car.vin}</p>
            <p>Rental: ${order.rental.startDate} for ${order.rental.rentalPeriod} days</p>
            <p>Total: $${order.rental.totalPrice}</p>
        </div>
    `).join('');
});
