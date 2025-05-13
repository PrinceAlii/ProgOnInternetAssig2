import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.resolve("data");
const carsPath = path.join(dataDir, "cars.json");
const ordersPath = path.join(dataDir, "orders.json");

const readJSON = p => JSON.parse(fs.readFileSync(p));
const writeJSON = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/api/cars", (req, res) => {
  res.json(readJSON(carsPath));
});

app.post("/api/orders", (req, res) => {
  const db = readJSON(ordersPath);
  const order = { ...req.body, status: "pending" };
  db.orders.push(order);
  writeJSON(ordersPath, db);
  res.status(201).json({ ok: true, orderIndex: db.orders.length - 1 });
});

app.post("/api/orders/:index/confirm", (req, res) => {
  const idx = Number(req.params.index);
  const dbOrders = readJSON(ordersPath);
  const order = dbOrders.orders[idx];
  if (!order) return res.status(404).json({ ok: false, msg: "Order not found." });

  const dbCars = readJSON(carsPath);
  const car = dbCars.cars.find(c => c.vin === order.car.vin);
  if (!car || !car.available) {
    return res.status(409).json({ ok: false, msg: "Car no longer available." });
  }

  car.available = false;
  order.status = "confirmed";
  writeJSON(carsPath, dbCars);
  writeJSON(ordersPath, dbOrders);

  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
