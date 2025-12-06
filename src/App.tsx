import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/Layout/MainLayout';
import { CreateAnimalTypeModal } from './components/Modals/CreateAnimalTypeModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import { GlobalDashboard } from './pages/GlobalDashboard';
import { AnimalTypesList } from './pages/AnimalTypesList';
import { AnimalsList } from './pages/AnimalsList';
import { GroupsList } from './pages/GroupsList';
import { AnimalTypeDashboard } from './pages/AnimalTypeDashboard';
import { BreedsList } from './pages/BreedsList';
import { AnimalProfile } from './pages/AnimalProfile';
import { FinanceList } from './pages/FinanceList';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { ResourcesList } from './pages/ResourcesList';
import { ResourcesDashboard } from './pages/ResourcesDashboard';
import { ResourceDetails } from './pages/ResourceDetails';
import { BirthLog } from './pages/BirthLog';


// Setup Query Client
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};


function AppContent() {
    const [opened, { open, close }] = useDisclosure(false);
    const [editTypeId, setEditTypeId] = useState<number | null>(null);

    // Helper functions passed down
    const handleOpenCreate = () => {
        setEditTypeId(null); // Clear ID = Create Mode
        open();
    };

    const handleOpenEdit = (id: number) => {
        setEditTypeId(id); // Set ID = Edit Mode
        open();
    };

    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes wrapped in Main Layout */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                        {/*
                        <MainLayout openCreateModal={open}>
                        */}
                            <GlobalDashboard />
                        </MainLayout>
                    </ProtectedRoute>
                } />



                <Route path="/type/:slug/breeds" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                            <BreedsList />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/type/:slug/list" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                            <AnimalsList />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/type/:slug/groups" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                            <GroupsList />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Specific Animal Route: /animal/cow/A409 */}
                <Route path="/animal/:typeSlug/:tag" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                            <AnimalProfile />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/types" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                            <AnimalTypesList openCreateModal={handleOpenCreate} openEditModal={handleOpenEdit} />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/type/:slug" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}>
                            <AnimalTypeDashboard openEditModal={handleOpenEdit}/>
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/birth/:id" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}><BirthLog /></MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/resources/:id" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}><ResourceDetails /></MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/resources/list" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}><ResourcesList /></MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/resources" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}><ResourcesDashboard /></MainLayout>
                    </ProtectedRoute>
                } />

                {/* Finance */ }
                <Route path="/finance/list" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}><FinanceList /></MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/finance" element={
                    <ProtectedRoute>
                        <MainLayout openCreateModal={handleOpenCreate}><FinanceDashboard /></MainLayout>
                    </ProtectedRoute>
                } />

            </Routes>
            
            {/* The Modal lives here so it can be opened from anywhere */}
            <CreateAnimalTypeModal opened={opened} close={close} editTypeId={editTypeId}/>
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