import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

loadEnv(path.join(rootDir, '.env'));

const config = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '127.0.0.1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://127.0.0.1:5173',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET
};

const bookings = new Map();
const payments = new Map();

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function getSecurityHeaders(requestId) {
  return {
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Request-Id',
    'Content-Security-Policy': "default-src 'self'",
    'Content-Type': 'application/json',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Request-Id': requestId
  };
}

function sendJson(response, statusCode, payload, requestId) {
  response.writeHead(statusCode, getSecurityHeaders(requestId));
  response.end(JSON.stringify(payload));
}

function sendSuccess(response, statusCode, data, requestId) {
  sendJson(response, statusCode, { success: true, data }, requestId);
}

function sendError(response, statusCode, message, requestId, details = null) {
  sendJson(response, statusCode, {
    success: false,
    error: { message, details }
  }, requestId);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });

    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON request body.'));
      }
    });

    request.on('error', reject);
  });
}

function assertRazorpayConfig() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.');
  }
}

function validateAmount(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  return numericAmount;
}

function sanitizeText(value, fallback) {
  if (typeof value !== 'string') return fallback;

  const sanitized = value.trim().slice(0, 120);
  return sanitized || fallback;
}

function logRequest(request, statusCode, requestId, startedAt) {
  const durationMs = Date.now() - startedAt;
  console.log(`${requestId} ${request.method} ${request.url} ${statusCode} ${durationMs}ms`);
}

async function createRazorpayOrder(request, response, requestId) {
  assertRazorpayConfig();

  const body = await readJsonBody(request);
  const amount = validateAmount(body.amount);

  if (!amount) {
    sendError(response, 400, 'A valid amount is required.', requestId);
    return 400;
  }

  const hotelName = sanitizeText(body.hotelName, 'StayEase booking');
  const hotelId = sanitizeText(String(body.hotelId || ''), 'hotel_unavailable');
  const receipt = createId('stay');

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      payment_capture: 1,
      notes: {
        hotel_id: hotelId,
        hotel_name: hotelName
      }
    })
  });

  const order = await razorpayResponse.json();

  if (!razorpayResponse.ok) {
    sendError(
      response,
      razorpayResponse.status,
      order?.error?.description || 'Unable to create Razorpay order.',
      requestId
    );
    return razorpayResponse.status;
  }

  payments.set(order.id, {
    amount,
    currency: order.currency,
    hotelId,
    hotelName,
    orderId: order.id,
    receipt: order.receipt,
    status: 'created',
    createdAt: new Date().toISOString()
  });

  sendSuccess(response, 200, {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    keyId: config.razorpayKeyId
  }, requestId);
  return 200;
}

async function verifyRazorpayPayment(request, response, requestId) {
  assertRazorpayConfig();

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = await readJsonBody(request);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    sendError(response, 400, 'Payment verification data is incomplete.', requestId);
    return 400;
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isVerified =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!isVerified) {
    sendError(response, 400, 'Payment signature verification failed.', requestId);
    return 400;
  }

  const payment = payments.get(razorpay_order_id) || {};
  const bookingId = createId('booking');
  const booking = {
    id: bookingId,
    hotelId: payment.hotelId || null,
    hotelName: payment.hotelName || 'StayEase booking',
    amount: payment.amount || null,
    currency: payment.currency || 'INR',
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    status: 'confirmed',
    confirmedAt: new Date().toISOString()
  };

  payments.set(razorpay_order_id, {
    ...payment,
    paymentId: razorpay_payment_id,
    status: 'verified',
    verifiedAt: booking.confirmedAt
  });
  bookings.set(bookingId, booking);

  sendSuccess(response, 200, {
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    booking
  }, requestId);
  return 200;
}

function listBookings(response, requestId) {
  const latestBookings = Array.from(bookings.values()).sort((a, b) =>
    new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
  );

  sendSuccess(response, 200, latestBookings, requestId);
  return 200;
}

async function routeRequest(request, response, requestId) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {}, requestId);
    return 204;
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    sendSuccess(response, 200, {
      ok: true,
      service: 'stayease-payments',
      bookings: bookings.size,
      payments: payments.size
    }, requestId);
    return 200;
  }

  if (request.method === 'GET' && request.url === '/api/bookings') {
    return listBookings(response, requestId);
  }

  if (request.method === 'POST' && request.url === '/api/razorpay/order') {
    return createRazorpayOrder(request, response, requestId);
  }

  if (request.method === 'POST' && request.url === '/api/razorpay/verify') {
    return verifyRazorpayPayment(request, response, requestId);
  }

  sendError(response, 404, 'Route not found.', requestId);
  return 404;
}

const server = http.createServer(async (request, response) => {
  const requestId = request.headers['x-request-id'] || createId('req');
  const startedAt = Date.now();
  let statusCode = 500;

  try {
    statusCode = await routeRequest(request, response, requestId);
  } catch (error) {
    const message = error.message || 'Server error.';
    statusCode = message.includes('Missing RAZORPAY') ? 503 : 500;
    sendError(response, statusCode, message, requestId);
  } finally {
    logRequest(request, statusCode, requestId, startedAt);
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Payment backend running on http://${config.host}:${config.port}`);
});
