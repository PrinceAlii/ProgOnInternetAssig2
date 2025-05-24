document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const ordersSection = document.getElementById('orders-section');
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('admin-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const adminOrdersList = document.getElementById('admin-orders-list');

    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showOrdersPanel();
    }

    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === 'UTSAdmin123') {
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            loginErrorMsg.textContent = '';
            showOrdersPanel();
        } else {
            loginErrorMsg.textContent = 'Incorrect password.';
            passwordInput.value = '';
        }
    });

    function showOrdersPanel() {
        loginSection.style.display = 'none';
        ordersSection.style.display = 'block';
        loadAllOrders();
    }

    async function loadAllOrders() {
        adminOrdersList.innerHTML = '<div class="spinner"></div>';
        try {
            const [ordersRes, carsRes] = await Promise.all([
                fetch('/orders'),
                fetch('/cars')
            ]);

            if (!ordersRes.ok) throw new Error(`Failed to fetch orders: ${ordersRes.statusText}`);
            const ordersData = await ordersRes.json();
            const allOrdersRaw = ordersData.orders || ordersData;

            const allOrders = allOrdersRaw.map((order, index) => ({ ...order, originalIndex: index }));

            if (!carsRes.ok) throw new Error(`Failed to fetch cars: ${carsRes.statusText}`);
            const carsData = await carsRes.json();
            const allCars = carsData.cars || carsData;

            if (!allOrders.length) {
                adminOrdersList.innerHTML = '<p>No reservations found.</p>';
                return;
            }

            adminOrdersList.innerHTML = allOrders.map((order, index) => {
                const carDetails = allCars.find(car => order.car && car.vin === order.car.vin);
                const carDisplay = carDetails ? `${carDetails.brand} ${carDetails.carModel}` : (order.car ? `VIN: ${order.car.vin}` : 'Car details missing');

                let statusClass = '';
                if (order.status === 'pending') statusClass = 'status-pending';
                else if (order.status === 'confirmed') statusClass = 'status-confirmed';
                else if (order.status === 'cancelled') statusClass = 'status-cancelled';

                let cancelBtnHtml = '';
                if (order.status === 'pending' || order.status === 'confirmed') {
                    cancelBtnHtml = `<button class="cancel-btn admin-cancel-order-btn" data-order-id="${order.originalIndex}" data-car-vin="${carDetails ? carDetails.vin : ''}" style="margin-top:10px; background-color:var(--clr-danger);">Cancel This Reservation</button>`;
                }

                return `
                    <div class="order-item" id="order-item-${order.originalIndex}">
                        <h3>Order for: ${order.customer ? order.customer.name : 'N/A'} (ID: ${order.originalIndex})</h3>
                        <p><strong>Email:</strong> ${order.customer ? order.customer.email : 'N/A'}</p>
                        <p><strong>Phone:</strong> ${order.customer ? order.customer.phoneNumber : 'N/A'}</p>
                        <p><strong>Car:</strong> ${carDisplay}</p>
                        <p><strong>Rental Start:</strong> ${order.rental ? order.rental.startDate : 'N/A'}</p>
                        <p><strong>Period:</strong> ${order.rental ? order.rental.rentalPeriod : 'N/A'} days</p>
                        <p><strong>Total:</strong> $${order.rental ? order.rental.totalPrice : 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="${statusClass}">${order.status ? order.status.toUpperCase() : 'UNKNOWN'}</span></p>
                        ${cancelBtnHtml}
                    </div>
                `;
            }).join('');

            document.querySelectorAll('.admin-cancel-order-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const orderIdToCancel = e.target.dataset.orderId;
                    const carVinToMakeAvailable = e.target.dataset.carVin;

                    if (confirm(`Are you sure you want to cancel order ID ${orderIdToCancel}? This action cannot be undone.`)) {
                        e.target.disabled = true;
                        e.target.textContent = 'Cancelling...';
                        try {
                            const response = await fetch('/orders/cancel', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: Number(orderIdToCancel), vin: carVinToMakeAvailable })
                            });
                            const result = await response.json();

                            if (response.ok && result.success) {
                                alert(`Order ID ${orderIdToCancel} cancelled successfully.`);
                                loadAllOrders();
                            } else {
                                throw new Error(result.message || 'Failed to cancel order from admin panel.');
                            }
                        } catch (err) {
                            alert(`Error cancelling order: ${err.message}`);
                            e.target.disabled = false;
                            e.target.textContent = 'Cancel This Reservation';
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Error loading orders for admin:", error);
            adminOrdersList.innerHTML = `<p style="color:var(--clr-danger);">Could not load reservations: ${error.message}</p>`;
        }
    }
});