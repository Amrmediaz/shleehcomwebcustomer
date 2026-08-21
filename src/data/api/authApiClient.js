import { httpClient } from './httpClient.js';
import {
    LOGIN_URL, REGISTER_URL, PROFILE_URL, CHECK_USER_EXISTS_URL,
    SEND_OTP_URL, RESET_PASSWORD_URL, UPDATE_USER_URL, DELETE_USER_URL,
} from '../../core/network/urls.js';

export const authApiClient = {
    async login(phone, password) {
        return httpClient.post(LOGIN_URL, { body: { username: phone, password } });
    },
    async register({ firstName, lastName, email, phone, password }) {
        return httpClient.post(REGISTER_URL, {
            body: { firstName, lastName, email, phoneNumber: phone, password },
        });
    },
    async getProfile() {
        return httpClient.get(PROFILE_URL, { auth: true });
    },
    async checkUserExists(phone) {
        return httpClient.post(CHECK_USER_EXISTS_URL, { body: { email: `${phone}@gmail.com` } });
    },
    async sendOtp(phone, otp) {
        return httpClient.post(SEND_OTP_URL, {
            body: { phone, message: `Your OTP code is ${otp}`, token: 'AVUD00KF14BD76DUDB' },
        });
    },
    async resetPassword(phone) {
        return httpClient.post(RESET_PASSWORD_URL, { body: { email: `${phone}@gmail.com` } });
    },
    async updateProfile({ id, firstName, lastName, points }) {
        return httpClient.post(UPDATE_USER_URL, { body: { id, firstName, lastName, points }, auth: true });
    },
    async deleteAccount(userId) {
        return httpClient.get(`${DELETE_USER_URL}?ID=${userId}`, { auth: true });
    },
};
