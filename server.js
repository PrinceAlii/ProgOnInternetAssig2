const express = require('express')
const app = express()
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/cars', (req, res) => {
    fs.readFile('./cars.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('[error] Unable to read car inventory database');
        res.json(JSON.parse(data));
    });
});

app.get('/orders', (req, res) => {
    fs.readFile('./orders.json', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('[error] Unable to read orders database');
        res.json(JSON.parse(data));
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
