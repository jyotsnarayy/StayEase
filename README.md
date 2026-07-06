# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Razorpay Payment Gateway

Booking a hotel ("Book Now" in the hotel detail modal) opens the **Razorpay Checkout** widget so the "stay" is actually paid for before the booking is confirmed.

- Integration code lives in `src/services/razorpay.js` and is used from `src/components/HotelDetailModal.jsx`.
- The Razorpay Checkout script is loaded via a `<script>` tag in `index.html` (with a runtime fallback loader in `razorpay.js` in case that tag is ever removed).
- This demo uses Razorpay Checkout directly from the browser. For production, create orders and verify signatures on a backend.

### Setup

1. Copy `.env.example` to `.env` and set your own test credentials:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   ```
   Get a test key from the [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) (Settings → API Keys → Generate Test Key).
2. Start the React app:
   ```
   npm run dev
   ```
3. Click **Book Now** on any hotel to open the Razorpay Checkout modal.

### Testing payments

Use Razorpay's test credentials (only work in test mode, no real money moves):
- **Card:** 4111 1111 1111 1111, any future expiry date, any CVV
- **UPI:** `success@razorpay` (simulates success) or `failure@razorpay` (simulates failure)

On success, a "Stay Confirmed" screen shows the `razorpay_payment_id`. On failure or if the checkout modal is closed, the booking is not confirmed.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
