import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/Layout/MainLayout';
import { CreateAnimalTypeModal } from './components/Modals/CreateAnimalTypeModal';
import { AnimalTypesList } from './pages/AnimalTypesList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import { GlobalDashboard } from './pages/GlobalDashboard';

// Setup Query Client
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

// Placeholder for the specific Animal Dashboard
const AnimalDashboard = () => <h2>Animal Type Dashboard (Coming Soon)</h2>;
// const GlobalDashboard = () => <h2>Global Farm Analytics (Coming Soon)</h2>;

function AppContent() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes wrapped in Main Layout */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={open}>
                            <GlobalDashboard />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/type/:id/*" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={open}>
                            <AnimalDashboard />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/types" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={open}>
                            <AnimalTypesList openCreateModal={open} />
                        </MainLayout>
                    </ProtectedRoute>
                } />
            </Routes>
            
            {/* The Modal lives here so it can be opened from anywhere */}
            <CreateAnimalTypeModal opened={opened} close={close} />
        </>
    );
}

function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
  );
}

export default App;