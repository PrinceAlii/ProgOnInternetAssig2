const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const CARS_PATH   = path.join(__dirname, 'cars.json');
const ORDERS_PATH = path.join(__dirname, 'orders.json');

const readJSON  = file => fs.readFile(file, 'utf-8').then(JSON.parse);
const writeJSON = (file, data) =>
  fs.writeFile(file, JSON.stringify(data, null, 2));

app.get('/cars', async (_req, res) => {
  try {
    const { cars } = await readJSON(CARS_PATH);
    res.json(cars);
  } catch {
    res.status(500).send('[error] Unable to read car inventory database');
  }
});

app.get('/orders', async (_req, res) => {
  try {
    const { orders } = await readJSON(ORDERS_PATH);
    res.json(orders);
  } catch {
    res.status(500).send('[error] Unable to read orders database');
  }
});

app.post('/orders', async (req, res) => {
  try {
    const ordersObj = await readJSON(ORDERS_PATH);
    const carsObj   = await readJSON(CARS_PATH);

    const vin = req.body.car.vin;
    const car = carsObj.cars.find(c => c.vin === vin);

    if (!car || !car.available) return res.json({ success: false });

    const order = { ...req.body, status: 'pending' };
    ordersObj.orders.push(order);
    await writeJSON(ORDERS_PATH, ordersObj);

    res.json({ success: true, orderId: ordersObj.orders.length - 1 });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post('/orders/confirm', async (req, res) => {
  const { orderId } = req.body;

  try {
    const ordersObj = await readJSON(ORDERS_PATH);
    const carsObj   = await readJSON(CARS_PATH);

    const order = ordersObj.orders[orderId];
    if (!order || order.status !== 'pending') return res.json({ success: false });

    const car = carsObj.cars.find(c => c.vin === order.car.vin);
    if (!car || !car.available) return res.json({ success: false });

    order.status = 'confirmed';
    car.available = false;

    await Promise.all([
      writeJSON(ORDERS_PATH, ordersObj),
      writeJSON(CARS_PATH,   carsObj)
    ]);

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
