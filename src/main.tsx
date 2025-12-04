import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ErrorBoundary } from './components/ErrorBoundary';

// Import Mantine Styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import '@mantine/charts/styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary> 
    </MantineProvider>
  </React.StrictMode>,
)