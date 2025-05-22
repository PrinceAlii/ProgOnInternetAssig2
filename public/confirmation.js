const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');
const resultDiv = document.getElementById('result');
if (!orderId) {
    resultDiv.innerHTML = '<div class="fail-msg">No order found.</div>';
} else {
    fetch('/orders')
    .then(res => res.json())
    .then(orders => {
        const order = orders[orderId];
        if (!order) {
            resultDiv.innerHTML = '<div class="fail-msg">No order found.</div>';
            return;
        }
        if (order.status === "pending") {
            resultDiv.innerHTML = `
                <h2>Your reservation is pending</h2>
                <p><b>Name:</b> ${order.customer.name}</p>
                <p><b>Email:</b> ${order.customer.email}</p>
                <p><b>Rental:</b> ${order.rental.startDate} for ${order.rental.rentalPeriod} days</p>
                <button class="confirm-btn" id="confirmBtn">Confirm Order</button>
            `;
            document.getElementById('confirmBtn').onclick = () => {
                fetch('/orders/confirm', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({orderId: Number(orderId)})
                })
                .then(res => res.json())
                .then(resp => {
                    if (resp.success) {
                        resultDiv.innerHTML = '<div class="success-msg">Order confirmed!</div><a href="index.html" style="display:block;margin-top:16px;text-align:center;color:#186ec6;font-weight:500;">Return Home</a>';
                    } else {
                        resultDiv.innerHTML = '<div class="fail-msg">Order confirmation failed. Car is unavailable.</div><a href="index.html" style="display:block;margin-top:16px;text-align:center;color:#186ec6;font-weight:500;">Return Home</a>';
                    }
                });
            };
        } else {
            resultDiv.innerHTML = '<div class="success-msg">Order already confirmed!</div><a href="index.html" style="display:block;margin-top:16px;text-align:center;color:#186ec6;font-weight:500;">Return Home</a>';
        }
    });
}
