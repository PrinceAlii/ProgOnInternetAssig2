const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const CARS_PATH = path.join(__dirname, 'cars.json');
const ORDERS_PATH = path.join(__dirname, 'orders.json');

const readJSON = file => fs.readFile(file, 'utf-8').then(JSON.parse);
const writeJSON = (file, data) =>
  fs.writeFile(file, JSON.stringify(data, null, 2));

// routes
app.get('/cars', async (_req, res) => {
  try {
    const carsData = await readJSON(CARS_PATH);
    res.json(carsData.cars || []);
  } catch (err) {
    console.error('[error] Reading car inventory:', err.message);
    res.status(500).json({ success: false, message: 'Unable to read car inventory database' });
  }
});

app.get('/orders', async (_req, res) => {
  try {
    const ordersData = await readJSON(ORDERS_PATH);
    res.json(ordersData.orders || []);
  } catch (err) {
    console.error('[error] Reading orders database:', err.message);
    res.status(500).json({ success: false, message: 'Unable to read orders database' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const ordersObj = await readJSON(ORDERS_PATH);
    if (!ordersObj.orders) ordersObj.orders = [];

    const carsObj = await readJSON(CARS_PATH);
    if (!carsObj.cars) carsObj.cars = [];

    const vin = req.body.car.vin;
    const car = carsObj.cars.find(c => c.vin === vin);

    if (!car || !car.available) {
      return res.json({ success: false, message: 'Car not found or unavailable.' });
    }

    const order = { ...req.body, status: 'pending' };
    ordersObj.orders.push(order);
    await writeJSON(ORDERS_PATH, ordersObj);

    res.json({ success: true, orderId: ordersObj.orders.length - 1 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process new order.' });
  }
});

app.post('/orders/confirm', async (req, res) => {
  const { orderId } = req.body;

  try {
    const ordersObj = await readJSON(ORDERS_PATH);

    if (!ordersObj.orders) ordersObj.orders = [];
    const carsObj = await readJSON(CARS_PATH);

    if (!carsObj.cars) carsObj.cars = [];

    if (orderId === undefined || orderId === null || orderId < 0 || orderId >= ordersObj.orders.length) {
      return res.status(400).json({ success: false, message: 'Invalid Order ID.' });
    }

    const order = ordersObj.orders[orderId];

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'pending') {
      return res.json({ success: order.status === 'confirmed', message: `Order status is already ${order.status}.` });
    }

    const car = carsObj.cars.find(c => c.vin === order.car.vin);

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car associated with order not found.' });
    }

    if (!car.available) {
      order.status = 'failed_unavailable';
      await writeJSON(ORDERS_PATH, ordersObj);
      return res.json({ success: false, message: 'Car is no longer available.' });
    }

    order.status = 'confirmed';
    car.available = false;
    await Promise.all([
      writeJSON(ORDERS_PATH, ordersObj),
      writeJSON(CARS_PATH, carsObj)
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to confirm order.' });
  }
});

app.post('/orders/cancel', async (req, res) => {
  const { orderId, vin: carVinToMakeAvailable } = req.body;
  if (typeof orderId !== 'number' || orderId < 0) {
    return res.status(400).json({ success: false, message: 'Invalid Order ID format.' });
  }

  try {
    const ordersObj = await readJSON(ORDERS_PATH);

    if (!ordersObj.orders) {
      return res.status
    }

    if (orderId >= ordersObj.orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found by ID.' });
    }

    const orderToCancel = ordersObj.orders[orderId];
    const previousStatus = orderToCancel.status;
    orderToCancel.status = 'cancelled';
    await writeJSON(ORDERS_PATH, ordersObj);;

    if (carVinToMakeAvailable && (previousStatus === 'pending' || previousStatus === 'confirmed')) {
      const carsObj = await readJSON(CARS_PATH);

      if (!carsObj.cars) carsObj.cars = [];

      const carToUpdate = carsObj.cars.find(c => c.vin === carVinToMakeAvailable);

      if (carToUpdate) {

        if (!carToUpdate.available) {
          carToUpdate.available = true;
          await writeJSON(CARS_PATH, carsObj);

        } else {
        }
      }
    }
    res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel order due to a server error.' });
  }
});

app.get('/*.html', (req, res, next) => {
  const pageName = path.basename(req.path);
  const filePath = path.join(__dirname, 'public', pageName);

  fs.access(filePath, fs.constants.F_OK)
    .then(() => res.sendFile(filePath))
    .catch(() => {
      if (req.path === '/' || req.path === '/index.html') {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      } else {
        next();
      }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));