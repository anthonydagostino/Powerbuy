# Powerbuy Arbitrage Tracker

A full-stack web app for tracking Amazon/retail arbitrage purchases, payouts, delivery status, cashback, and profit.

Built with:

- React frontend
- ASP.NET Core Web API backend
- PostgreSQL database hosted on AWS RDS
- Entity Framework Core
- Render backend deployment
- Vercel frontend deployment
- xUnit tests for receipt/payment logic

---
## How to Use

Use the Live App (Recommended)

Open the app in your browser:
https://YOUR-VERCEL-URL.vercel.app

1. Sign in (if authentication is enabled)
2. Fill out the form at the top
3. Click **Add Purchase**
4. Track your purchases, payments, and profit in the table below

---

## Features

- Add purchases with item, UPC, model, quantity, order date, expiration date, card used, and source
- Automatically calculate:
  - total sell price
  - cashback amount
  - expected profit
- Select cashback rate: 5%, 6%, or 7%
- Edit and delete purchases
- Track:
  - payment status
  - delivery status
  - tracking number
  - quantity paid
  - amount paid
- Dashboard cards:
  - total expected profit
  - all-time profit
  - current total profit
  - unpaid count
  - not delivered count
- Resettable current profit tracker for batch-based profit tracking
- Filter purchases by:
  - all
  - not paid
  - not delivered
  - expiring soon
  - refunded
- Row highlighting for important statuses
- Light mode / dark mode
- Backend receipt processing endpoint for automatically updating payment status from parsed receipt data
- Unit tests for Paid / Half / Issue receipt matching logic

---

## Project Structure

```txt
Powerbuy/
  Powerbuy.Api/
    Powerbuy.Api/
      Controllers/
      Data/
      Dtos/
      Models/
      Services/
      Migrations/
    Powerbuy.Tests/

  Powerbuy.Web/
    src/
      components/
      services/
      utils/
