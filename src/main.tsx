import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';
import { AppProvider } from './ui/AppContext';
import { buildAgendaService } from './app/container';
import { applyBrandPalette } from './ui/theme/applyBrand';
import { brand } from './config/brand.config';

applyBrandPalette(brand.palette);

const { service, mode } = buildAgendaService();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider service={service} mode={mode}>
      <App />
    </AppProvider>
  </StrictMode>,
);
