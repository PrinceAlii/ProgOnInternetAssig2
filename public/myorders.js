document.getElementById('order-search-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('order-email').value.trim().toLowerCase();
    if (!email) return;

    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '<div class="spinner"></div>';

    try {
        const ordersRes = await fetch('/orders');
        if (!ordersRes.ok) throw new Error(`Failed to fetch orders: ${ordersRes.statusText}`);
        const ordersData = await ordersRes.json();
        const allOrders = ordersData.orders || ordersData;

        const carsRes = await fetch('/cars');
        if (!carsRes.ok) throw new Error(`Failed to fetch cars: ${carsRes.statusText}`);
        const carsData = await carsRes.json();
        const allCars = carsData.cars || carsData;
        const myOrders = allOrders.filter(o => o.customer.email.toLowerCase() === email);

        if (!myOrders.length) {
            ordersList.innerHTML = '<p>No reservations found under this email.</p>';
            return;
        }

        ordersList.innerHTML = myOrders.map(order => {
            const carDetails = allCars.find(car => car.vin === order.car.vin);
            const carDisplay = carDetails ? `${carDetails.brand} ${carDetails.carModel}` : `VIN: ${order.car.vin} (Details not found)`;

            const statusDisplay = order.status ? order.status.toUpperCase() : 'UNKNOWN STATUS';

            return `
                <div class="car-card" style="margin-bottom: 20px;">
                    <h2>${order.customer.name} - ${statusDisplay}</h2>
                    <p><strong>Car:</strong> ${carDisplay}</p>
                    <p><strong>Rental Start:</strong> ${order.rental.startDate}</p>
                    <p><strong>Rental Period:</strong> ${order.rental.rentalPeriod} days</p>
                    <p><strong>Total Price:</strong> $${order.rental.totalPrice}</p>
                    <p><strong>Order Date:</strong> ${order.rental.orderDate}</p>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error fetching or displaying orders:", error);
        ordersList.innerHTML = '<p style="color:var(--clr-danger);">Sorry, somethings gone wrong. Please contact us, or try again later.</p>';
    }
});