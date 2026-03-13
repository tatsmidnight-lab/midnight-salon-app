const SQUARE_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://connect.squareup.com/v2'
  : 'https://connect.squareupsandbox.com/v2'
const SQUARE_VERSION = '2024-01-18'

function squareHeaders() {
  return {
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    'Square-Version': SQUARE_VERSION,
    'Content-Type': 'application/json',
  }
}

// -------------------------------------------------------------------
// createPaymentLink
// Creates a Square Online Checkout payment link for a booking.
// -------------------------------------------------------------------

export interface CreatePaymentLinkParams {
  bookingId: string
  amount: number       // in dollars (will be converted to cents)
  currency: string     // e.g. "USD"
  itemName: string
  redirectUrl: string
  supportEmail: string
}

export interface PaymentLinkResult {
  paymentUrl: string
  orderId: string
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResult> {
  const { bookingId, amount, currency, itemName, redirectUrl, supportEmail } = params
  const amountInCents = Math.round(amount * 100)

  const body = {
    idempotency_key: `booking-${bookingId}-${Date.now()}`,
    quick_pay: {
      name: itemName,
      price_money: {
        amount: amountInCents,
        currency,
      },
      location_id: process.env.SQUARE_LOCATION_ID,
    },
    checkout_options: {
      redirect_url: redirectUrl,
      merchant_support_email: supportEmail,
    },
  }

  const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
    method: 'POST',
    headers: squareHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Square createPaymentLink failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return {
    paymentUrl: data.payment_link?.url ?? '',
    orderId: data.payment_link?.order_id ?? '',
  }
}

// -------------------------------------------------------------------
// getPaymentStatus
// Fetches the status of a Square order by orderId.
// -------------------------------------------------------------------

export async function getPaymentStatus(orderId: string): Promise<string> {
  const res = await fetch(`${SQUARE_API_BASE}/orders/${orderId}`, {
    method: 'GET',
    headers: squareHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Square getPaymentStatus failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.order?.state ?? 'UNKNOWN'
}

// -------------------------------------------------------------------
// createOrderPaymentLink
// Creates a Square payment link for a product order with line items.
// -------------------------------------------------------------------

export interface OrderItem {
  name: string
  quantity: number
  amountCents: number
}

export interface CreateOrderPaymentLinkParams {
  orderId: string
  items: OrderItem[]
  redirectUrl: string
}

export async function createOrderPaymentLink(
  params: CreateOrderPaymentLinkParams
): Promise<PaymentLinkResult> {
  const { orderId, items, redirectUrl } = params

  const lineItems = items.map((item) => ({
    name: item.name,
    quantity: String(item.quantity),
    base_price_money: {
      amount: item.amountCents,
      currency: 'USD',
    },
  }))

  const body = {
    idempotency_key: `order-${orderId}-${Date.now()}`,
    order: {
      location_id: process.env.SQUARE_LOCATION_ID,
      line_items: lineItems,
      reference_id: orderId,
    },
    checkout_options: {
      redirect_url: redirectUrl,
    },
  }

  const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
    method: 'POST',
    headers: squareHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Square createOrderPaymentLink failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return {
    paymentUrl: data.payment_link?.url ?? '',
    orderId: data.payment_link?.order_id ?? '',
  }
}
