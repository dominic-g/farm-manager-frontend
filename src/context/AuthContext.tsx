import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    token: string;
    user_email: string;
    user_nicename: string;
    user_display_name: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: any) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Check LocalStorage on load (did they log in previously?)
    useEffect(() => {
        const storedUser = localStorage.getItem('farm_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (token: string, userData: any) => {
        const userObj = { ...userData, token };
        setUser(userObj);
        localStorage.setItem('farm_user', JSON.stringify(userObj));
        // Set Default Header for future Axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('farm_user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};