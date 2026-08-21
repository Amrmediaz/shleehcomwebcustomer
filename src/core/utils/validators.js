export function isValidOmaniPhone(phone) {
    return /^[79]\d{7}$/.test((phone || '').trim());
}

export function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 8
        && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}
