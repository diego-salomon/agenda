import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';
import { AppProvider } from './ui/AppContext';
import { buildApp } from './app/container';
import { applyBrandPalette } from './ui/theme/applyBrand';
import { brand } from './config/brand.config';

applyBrandPalette(brand.palette);

const { service, mode, signIn } = buildApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider service={service} mode={mode} signIn={signIn}>
      <App />
    </AppProvider>
  </StrictMode>,
);
