import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth';
import App from './App';
import DialogHost from './components/DialogHost';
import './pwa'; // registra o service worker e captura o evento de instalação o quanto antes
import '@fontsource-variable/inter';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <DialogHost />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
