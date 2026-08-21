export const USER_TOKEN_KEY = 'shleeh_customer_token';
export const USER_TOKEN_EXPIRE_KEY = 'shleeh_customer_token_expire';
export const USER_PROFILE_KEY = 'shleeh_customer_profile';

// Payment happens on the bank's own domain — we do a full top-level
// redirect there and back, which throws away React Router's in-memory
// location.state. Stash which booking is being paid for here right before
// leaving, so /RequestPay/Success and /RequestPay/Error (where the bank
// sends the browser back to) can look it up again.
export const PENDING_PAYMENT_KEY = 'shleeh_pending_payment';
