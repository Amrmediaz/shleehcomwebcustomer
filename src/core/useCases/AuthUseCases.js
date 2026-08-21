import { AuthRepository } from '../../data/repositories/AuthRepository.js';

export const LoginUseCase = {
    execute: (phone, password) => AuthRepository.login(phone, password),
};

export const RegisterUseCase = {
    execute: (fields) => AuthRepository.register(fields),
};

export const GetProfileUseCase = {
    execute: () => AuthRepository.getProfile(),
};

export const CheckUserExistsUseCase = {
    execute: (phone) => AuthRepository.checkUserExists(phone),
};

export const SendOtpUseCase = {
    execute: (phone, otp) => AuthRepository.sendOtp(phone, otp),
};

export const ResetPasswordUseCase = {
    execute: (phone) => AuthRepository.resetPassword(phone),
};

export const UpdateProfileUseCase = {
    execute: (fields) => AuthRepository.updateProfile(fields),
};

export const DeleteAccountUseCase = {
    execute: (userId) => AuthRepository.deleteAccount(userId),
};
