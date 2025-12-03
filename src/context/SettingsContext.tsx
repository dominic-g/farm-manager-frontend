import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
    currency: string;
    weightUnit: string;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    formatCurrency: (amount: number | string) => string;
    formatWeight: (amount: number | string) => string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>({
        currency: 'KSH',
        weightUnit: 'lbs'
    });

    // Load from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('farm_settings');
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('farm_settings', JSON.stringify(updated));
    };

    const formatCurrency = (amount: number | string) => {
        return `${settings.currency}${amount}`;
    };

    const formatWeight = (amount: number | string) => {
        return `${amount} ${settings.weightUnit}`;
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency, formatWeight }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};