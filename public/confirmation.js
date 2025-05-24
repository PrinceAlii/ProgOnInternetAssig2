document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const orderIdParam = params.get('orderId');
    const resultDiv = document.getElementById('result');

    if (!resultDiv) {
        console.error('Critical: resultDiv not found in confirmation.html');
        return;
    }
    resultDiv.innerHTML = '<div class="spinner"></div>';

    if (statusParam === 'failure') {
        resultDiv.innerHTML = `
          <div class="fail-msg" style="color:var(--clr-danger); padding:20px; text-align:center;">
              Sorry! The car may have been reserved before your order could be recorded or another issue occurred.
          </div>
          <div style="text-align:center; margin-top:20px;">
              <a href="index.html" class="nav-btn">Return Home</a>
          </div>`;
        return;
    }

    if (!orderIdParam) {
        resultDiv.innerHTML = `
          <div class="fail-msg" style="padding:20px; text-align:center;">
              No order ID found in URL. Cannot display confirmation.
          </div>
          <div style="text-align:center; margin-top:20px;">
              <a href="index.html" class="nav-btn">Return Home</a>
          </div>`;
        return;
    }

    try {
        const ordersRes = await fetch('/orders');
        if (!ordersRes.ok) throw new Error(`Failed to fetch orders: ${ordersRes.statusText}`);
        const ordersData = await ordersRes.json();
        const allOrders = ordersData.orders || ordersData;

        if (!Array.isArray(allOrders)) {
            throw new Error("Order data is not in the expected array format.");
        }

        const carsRes = await fetch('/cars');
        if (!carsRes.ok) throw new Error(`Failed to fetch cars: ${carsRes.statusText}`);
        const carsData = await carsRes.json();
        const allCars = carsData.cars || carsData;

        const numericOrderId = Number(orderIdParam);
        const order = allOrders[numericOrderId];

        if (!order) {
            throw new Error(`No order found for ID: ${orderIdParam}.`);
        }

        if (!order.customer || !order.rental || !order.car || !order.car.vin) {
            throw new Error("Order data is incomplete.");
        }

        const carForOrder = allCars.find(c => c.vin === order.car.vin);

        if (order.status === 'pending') {
            let carDetailsHtml = '';
            if (carForOrder) {
                carDetailsHtml = `
                  <div class="car-card" style="margin: 15px 0; padding:10px; background-color: var(--clr-bg); border: 1px solid #444;">
                      <img src="${carForOrder.image}" alt="${carForOrder.carModel}" style="max-width:150px; height:auto; border-radius:var(--radius-sm); margin-bottom:10px;">
                      <h4>Your Selected Car: ${carForOrder.brand} ${carForOrder.carModel}</h4>
                      <p style="font-size:0.9em;">Type: ${carForOrder.carType} | Year: ${carForOrder.yearOfManufacture}</p>
                      <p style="font-size:0.9em;">Mileage: ${carForOrder.mileage} | Fuel: ${carForOrder.fuelType}</p>
                  </div>
              `;
            }

            resultDiv.innerHTML = `
              <h2 style="text-align:center;">Your Reservation is Pending Confirmation</h2>
              <div class="car-card" style="margin: 20px auto; max-width: 600px;">
                  ${carDetailsHtml}
                  <p><b>Name:</b> ${order.customer.name}</p>
                  <p><b>Email:</b> ${order.customer.email}</p>
                  <p><b>Rental Start Date:</b> ${order.rental.startDate}</p>
                  <p><b>Rental Period:</b> ${order.rental.rentalPeriod} days</p>
                  <p><b>Estimated Total:</b> $${order.rental.totalPrice}</p>
                  <p style="margin-top:15px; font-weight:bold; color:var(--clr-accent);">
                      Please click "Confirm Reservation" to finalize your booking.
                  </p>
              </div>
              <div class="form-actions" style="justify-content:center; margin-top:20px; gap: 15px;">
                  <button class="nav-btn" id="confirmBtn">Confirm Reservation</button>
                  <button class="cancel-btn" id="cancelOrderBtn" style="background-color:var(--clr-danger);">Cancel This Reservation</button>
              </div>`;

            document.getElementById('confirmBtn').onclick = () => handleConfirm(numericOrderId);
            document.getElementById('cancelOrderBtn').onclick = () => handleCancelOrder(numericOrderId, carForOrder ? carForOrder.vin : null);

        } else if (order.status === 'confirmed') {
            resultDiv.innerHTML = `
              <div class="success-msg" style="color:lightgreen; padding:20px; text-align:center;">
                  Your order has been confirmed! Thank you for your reservation.
              </div>
              <div style="text-align:center; margin-top:20px;">
                   <a href="index.html" class="nav-btn">Return Home</a>
              </div>`;

        } else if (order.status === 'cancelled') {
            resultDiv.innerHTML = `
              <div class="fail-msg" style="color:orange; padding:20px; text-align:center;">
                  This reservation has been cancelled.
              </div>
              <div style="text-align:center; margin-top:20px;">
                   <a href="index.html" class="nav-btn">Return Home</a>
              </div>`;

        } else {
            throw new Error(`Unknown order status: ${order.status || 'Not set'}`);
        }
    } catch (err) {
        console.error("Error in confirmation.js:", err);
        resultDiv.innerHTML = `
          <div class="fail-msg" style="color:var(--clr-danger); padding:20px; text-align:center;">
              ${err.message || 'Could not load order confirmation details. Please check your reservations or try again.'}
          </div>
          <div style="text-align:center; margin-top:20px;">
              <a href="index.html" class="nav-btn">Return Home</a>
          </div>`;
    }
});

function handleConfirm(orderId) {
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    if (confirmBtn) confirmBtn.textContent = 'Confirming...';

    fetch('/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId })
    })
        .then(res => {
            if (!res.ok) throw new Error('Confirmation request failed network/server side');
            return res.json();
        })
        .then(resp => {
            const resultDiv = document.getElementById('result');
            if (resp.success) {
                resultDiv.innerHTML = `
              <div class="success-msg" style="color:lightgreen; padding:20px; text-align:center;">
                  Order confirmed! Thank you for your reservation.
              </div>
              <div style="text-align:center; margin-top:20px;">
                  <a href="index.html" class="nav-btn">Return Home</a>
              </div>`;
                localStorage.removeItem('reservationDraft');
                localStorage.removeItem('selectedVin');
            } else {
                resultDiv.innerHTML = `
              <div class="fail-msg" style="color:var(--clr-danger); padding:20px; text-align:center;">
                  Order confirmation failed. ${resp.message || 'The car may no longer be available or another error occurred.'}
              </div>
              <div style="text-align:center; margin-top:20px;">
                  <a href="index.html" class="nav-btn">Return Home</a>
              </div>`;
            }
        })
        .catch(err => {
            console.error("Confirmation error:", err);
            document.getElementById('result').innerHTML = `
          <div class="fail-msg" style="color:var(--clr-danger); padding:20px; text-align:center;">
              An error occurred during confirmation: ${err.message}. Please try again or contact support.
          </div>
          <div style="text-align:center; margin-top:20px;">
              <a href="index.html" class="nav-btn">Return Home</a>
          </div>`;
        });
}

async function handleCancelOrder(orderId, carVin) {
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    if (cancelBtn) cancelBtn.textContent = 'Cancelling...';

    try {
        const response = await fetch('/orders/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderId, vin: carVin })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Failed to cancel order. Status: ${response.status}`);
        }

        const result = await response.json();
        const resultDiv = document.getElementById('result');

        if (result.success) {
            resultDiv.innerHTML = `
              <div class="success-msg" style="color:orange; padding:20px; text-align:center;">
                  Your reservation has been successfully cancelled.
              </div>
              <div style="text-align:center; margin-top:20px;">
                  <a href="index.html" class="nav-btn">Return Home</a>
              </div>`;
            localStorage.removeItem('reservationDraft');
            localStorage.removeItem('selectedVin');
        } else {
            resultDiv.innerHTML = `
              <div class="fail-msg" style="color:var(--clr-danger); padding:20px; text-align:center;">
                  Failed to cancel reservation. ${result.message || ''}
              </div>
              <div style="text-align:center; margin-top:20px;">
                  <a href="index.html" class="nav-btn">Return Home</a>
              </div>`;
            if (confirmBtn) confirmBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
            if (cancelBtn) cancelBtn.textContent = 'Cancel This Reservation';

        }
    } catch (error) {
        console.error("Error cancelling order:", error);
        document.getElementById('result').innerHTML = `
          <div class="fail-msg" style="color:var(--clr-danger); padding:20px; text-align:center;">
              An error occurred while trying to cancel: ${error.message}.
          </div>
          <div style="text-align:center; margin-top:20px;">
              <a href="index.html" class="nav-btn">Return Home</a>
          </div>`;
        if (confirmBtn) confirmBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
        if (cancelBtn) cancelBtn.textContent = 'Cancel This Reservation';
    }
}