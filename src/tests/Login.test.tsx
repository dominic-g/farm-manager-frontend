import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock Axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock React Router's useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

// Helper to render with all Providers (Context, Router, Mantine)
const renderWithProviders = (component: any) => {
    return render(
        <MantineProvider>
            <Notifications />
            <BrowserRouter>
                <AuthProvider>
                    {component}
                </AuthProvider>
            </BrowserRouter>
        </MantineProvider>
    );
};

describe('Login Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the login form correctly', () => {
        renderWithProviders(<Login />);
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        // 1. Setup Mock Response
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                token: 'fake-jwt-token',
                user_email: 'test@farm.com',
                user_nicename: 'FarmerTest',
                user_display_name: 'Farmer Test'
            }
        });

        renderWithProviders(<Login />);

        // 2. Fill Form
        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'farmer' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });

        // 3. Submit
        fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

        // 4. Assertions
        await waitFor(() => {
            // Check if Axios was called with correct URL and data
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/jwt-auth/v1/token'),
                { username: 'farmer', password: 'password' }
            );
            
            // Check if redirect happened
            expect(mockedNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('handles login failure', async () => {
        // 1. Setup Mock Failure
        mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

        renderWithProviders(<Login />);

        // 2. Fill & Submit
        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'wrong' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

        // 3. Assertions
        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalled();
            // Navigate should NOT be called
            expect(mockedNavigate).not.toHaveBeenCalled();
            // In a real browser, a notification appears. 
            // We can check if the button is no longer loading or form is still there
            expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
        });
    });
});