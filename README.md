# Assignment 2 - Online Car Rental System using AJAX and JSON

### 31748 - Programming on the Internet
#### University of Technology Sydney

## **Project Overview**
This is my submission for Assignment 2 for my subject `31748 Programming on the Internet`. This project is a dynamic web application for an online car rental system called "LuxCarRentals".

### Admin Access

* Navigate to `/admin.html` there is no access natively via the sites UI.
* Enter the password: `UTSAdmin123`
* **Note:** This is a completely insecure implementation, in fact you can view the password for the admin site in inspect element in `admin.js` under sources. This is purely just to keep the grubs out.

## Technology Stack

* **Front-End:**
    * HTML
    * CSS
    * JavaScript

* **Back-End (Simulated):**
    * Node.js
    * Express.js 

* **Data Handling & Persistence:**
    * **JSON:** `cars.json` and `orders.json` are used as flat-file databases to store car inventory and customer orders.
    * **AJAX (Fetch API):** Asynchronous JavaScript techniques are implemented using the native `fetch` API for dynamic data loading and form submissions without full page reloads.
    * **`localStorage`:** Used to temporarily store user input in the reservation form, allowing users to resume an unfinished reservation.

## Setup and Running the Application

### Prerequisites

* Node.js (version 20.0.0 or higher recommended)
* npm

### Running Locally

1.  **Clone the repo.**
2.  **Navigate to the project's root directory** in your terminal.
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```
5.  **Open your web browser** and go to `http://localhost:3000` (or the port shown in your console output).

### Data Files

* `cars.json`: Contains an array of car objects. Each car has details like VIN, brand, model, availability, price per day, etc.
* `orders.json`: Contains an array of order objects. Each order includes customer details, car VIN, rental period, total price, and status (pending, confirmed, cancelled).
    The server reads from and writes to these files to simulate database operations.
