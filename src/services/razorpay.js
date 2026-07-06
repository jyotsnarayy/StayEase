/**
 * Razorpay Payment Gateway Integration
 * ------------------------------------
 * This client-only demo opens Razorpay Checkout directly from the browser.
 * For production, create orders and verify signatures on a backend.
 *
 * Test Mode:
 * - Set VITE_RAZORPAY_KEY_ID in .env to use your Razorpay test key.
 * - Use Razorpay's test cards (e.g. 4111 1111 1111 1111, any future expiry,
 *   any CVV) or test UPI id `success@razorpay` to simulate a successful payment.
 */

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

/**
 * Ensures the Razorpay Checkout script is available.
 * It's normally already loaded via a <script> tag in index.html, but this
 * acts as a safety net (e.g. if that tag is ever removed, or is blocked and
 * needs a retry).
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens the Razorpay Checkout modal for a hotel booking payment.
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in INR (rupees, not paise).
 * @param {string} params.hotelName - Hotel name, shown in the checkout description.
 * @param {Object} [params.customer] - Optional prefill info { name, email, contact }.
 * @param {(response: {razorpay_payment_id: string}) => void} params.onSuccess - Called on successful payment.
 * @param {(error: any) => void} [params.onFailure] - Called if the payment attempt fails.
 * @param {() => void} [params.onDismiss] - Called if the user closes the checkout modal without paying.
 */
export async function openRazorpayCheckout({
  amount,
  hotelName,
  customer = {},
  onSuccess,
  onFailure,
  onDismiss
}) {
  if (!RAZORPAY_KEY_ID) {
    onFailure?.(new Error('Razorpay key is missing. Add VITE_RAZORPAY_KEY_ID to your .env file.'));
    return;
  }

  const scriptLoaded = await loadRazorpayScript();

  if (!scriptLoaded || !window.Razorpay) {
    onFailure?.(new Error('Unable to load Razorpay Checkout. Please check your internet connection.'));
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(Number(amount) * 100),
    currency: 'INR',
    name: 'StayFinder',
    description: `Booking payment for ${hotelName}`,
    image: '/favicon.svg',
    prefill: {
      name: customer.name || '',
      email: customer.email || '',
      contact: customer.contact || ''
    },
    notes: {
      hotel_name: hotelName
    },
    theme: {
      color: '#0f766e' // matches --primary from src/index.css
    },
    handler: function (response) {
      onSuccess?.(response);
    },
    modal: {
      ondismiss: function () {
        onDismiss?.();
      }
    }
  };

  const razorpayInstance = new window.Razorpay(options);

  razorpayInstance.on('payment.failed', function (response) {
    onFailure?.(response.error);
  });

  razorpayInstance.open();
}
