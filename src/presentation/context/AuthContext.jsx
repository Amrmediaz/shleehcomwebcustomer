import { createContext, useContext, useState, useCallback } from 'react';
import { USER_TOKEN_KEY, USER_PROFILE_KEY } from '../../core/network/keys.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(USER_TOKEN_KEY));
    const [profile, setProfile] = useState(() => {
        const raw = localStorage.getItem(USER_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
    });

    const login = useCallback((newToken, newProfile) => {
        localStorage.setItem(USER_TOKEN_KEY, newToken);
        if (newProfile) localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
        setToken(newToken);
        setProfile(newProfile ?? null);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(USER_TOKEN_KEY);
        localStorage.removeItem(USER_PROFILE_KEY);
        setToken(null);
        setProfile(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, profile, isAuthenticated: Boolean(token), login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
