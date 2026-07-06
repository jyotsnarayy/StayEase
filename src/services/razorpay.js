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

async function handleApiResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `Request failed with status ${response.status}`);
  }

  return data.data ?? data;
}

async function createPaymentOrder({ amount, hotelId, hotelName }) {
  const response = await fetch('/api/razorpay/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount, hotelId, hotelName })
  });

  return handleApiResponse(response);
}

async function verifyPaymentSignature(paymentResponse) {
  const response = await fetch('/api/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentResponse)
  });

  return handleApiResponse(response);
}

export async function openRazorpayCheckout({
  amount,
  hotelId,
  hotelName,
  customer = {},
  onSuccess,
  onFailure,
  onDismiss
}) {
  const scriptLoaded = await loadRazorpayScript();

  if (!scriptLoaded || !window.Razorpay) {
    onFailure?.(new Error('Unable to load Razorpay Checkout. Please check your internet connection.'));
    return;
  }

  let order;

  try {
    order = await createPaymentOrder({ amount, hotelId, hotelName });
  } catch (error) {
    onFailure?.(error);
    return;
  }

  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.id,
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
      color: '#0f766e'
    },
    handler: async function (response) {
      try {
        const verification = await verifyPaymentSignature(response);
        onSuccess?.({ ...response, verification });
      } catch (error) {
        onFailure?.(error);
      }
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
