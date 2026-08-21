import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './presentation/context/LanguageContext.jsx';
import { AuthProvider } from './presentation/context/AuthContext.jsx';
import { FavoritesProvider } from './presentation/context/FavoritesContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LanguageProvider>
            <AuthProvider>
                <FavoritesProvider>
                    <App />
                </FavoritesProvider>
            </AuthProvider>
        </LanguageProvider>
    </React.StrictMode>
);
