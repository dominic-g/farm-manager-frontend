import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingOverlay } from '@mantine/core';

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
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // <--- New Loading State

    useEffect(() => {
        // Check LocalStorage on load
        const storedUser = localStorage.getItem('farm_user');
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                
                // Restore the Header immediately so queries work on refresh
                axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('farm_user');
            }
        }
        
        // Mark check as complete
        setLoading(false); 
    }, []);

    const login = (token: string, userData: any) => {
        const userObj = { ...userData, token };
        setUser(userObj);
        localStorage.setItem('farm_user', JSON.stringify(userObj));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('farm_user');
        delete axios.defaults.headers.common['Authorization'];
    };

    // Block rendering until we know if the user is logged in
    if (loading) {
        return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading: loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};