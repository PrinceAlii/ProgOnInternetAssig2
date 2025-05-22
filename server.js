const express = require('express')
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/cars', (req, res) => {
    fs.readFile('./cars.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('[error] Unable to read car inventory database');
        res.json(JSON.parse(data).cars);
    });
});

app.get('/orders', (req, res) => {
    fs.readFile('./orders.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('[error] Unable to read orders database');
        res.json(JSON.parse(data).orders);
    });
});

app.post('/orders', (req, res) => {
    fs.readFile('./orders.json', 'utf-8', (err, orderData) => {
        if (err) return res.status(500).json({success: false});
        fs.readFile('./cars.json', 'utf-8', (err, carData) => {
            if (err) return res.status(500).json({success: false});
            const ordersObj = JSON.parse(orderData);
            const carsObj = JSON.parse(carData);
            const vin = req.body.car.vin;
            const car = carsObj.cars.find(c => c.vin === vin);
            if (!car || !car.available) return res.json({success: false});
            req.body.status = "pending";
            ordersObj.orders.push(req.body);
            fs.writeFile('./orders.json', JSON.stringify(ordersObj, null, 2), err => {
                if (err) return res.status(500).json({success: false});
                res.json({success: true, orderId: ordersObj.orders.length - 1});
            });
        });
    });
});

app.post('/orders/confirm', (req, res) => {
    const { orderId } = req.body;
    fs.readFile('./orders.json', 'utf-8', (err, orderData) => {
        if (err) return res.status(500).json({success: false});
        fs.readFile('./cars.json', 'utf-8', (err, carData) => {
            if (err) return res.status(500).json({success: false});
            const ordersObj = JSON.parse(orderData);
            const carsObj = JSON.parse(carData);
            const order = ordersObj.orders[orderId];
            if (!order || order.status !== "pending") return res.json({success: false});
            const car = carsObj.cars.find(c => c.vin === order.car.vin);
            if (!car || !car.available) return res.json({success: false});
            order.status = "confirmed";
            car.available = false;
            fs.writeFile('./orders.json', JSON.stringify(ordersObj, null, 2), err => {
                if (err) return res.status(500).json({success: false});
                fs.writeFile('./cars.json', JSON.stringify(carsObj, null, 2), err => {
                    if (err) return res.status(500).json({success: false});
                    res.json({success: true});
                });
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
