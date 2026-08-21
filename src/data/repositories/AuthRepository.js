import { authApiClient } from '../api/authApiClient.js';
import { UserEntity } from '../../core/entities/User.js';

export const AuthRepository = {
    async login(phone, password) {
        const data = await authApiClient.login(phone, password);
        return { token: data?.token, expire: data?.expaire };
    },
    async register(fields) {
        const data = await authApiClient.register(fields);
        return { token: data?.token, expire: data?.expaire };
    },
    async getProfile() {
        const data = await authApiClient.getProfile();
        if (data?.status && data?.message) return new UserEntity(data.message);
        return null;
    },
    async checkUserExists(phone) {
        const data = await authApiClient.checkUserExists(phone);
        return data?.message === 'Data Used';
    },
    async sendOtp(phone, otp) {
        return authApiClient.sendOtp(phone, otp);
    },
    async resetPassword(phone) {
        return authApiClient.resetPassword(phone);
    },
    async updateProfile(fields) {
        const data = await authApiClient.updateProfile(fields);
        if (data?.status === false) throw new Error(data?.message || 'Update failed');
        return true;
    },
    async deleteAccount(userId) {
        const data = await authApiClient.deleteAccount(userId);
        if (data?.status === false) throw new Error(data?.message || 'Delete failed');
        return true;
    },
};
