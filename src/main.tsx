import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { PrimeReactProvider } from '@primereact/core';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import Error500 from './pages/errors/Error500.tsx';

const PRIME_UI_LICENSE =
  'eyJpZCI6ImFjMWUyZWIwLWY2NmYtNDg5Yi1hNjYxLTJjM2MxZGM4OGZmNyIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTQ4NzgwMDksImV4cCI6MTgyNjQxNDAwOX0.GBy4uga9X6yOmQlYc2pNCuJlvNzLviOaCBpbXwBbo5f-Rxvs_bXytsA5SpLpE3AD17OoaiogM6JhRRZI6SbKAg';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={Error500}>
      <PrimeReactProvider license={PRIME_UI_LICENSE}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </PrimeReactProvider>
    </ErrorBoundary>
  </StrictMode>
);
