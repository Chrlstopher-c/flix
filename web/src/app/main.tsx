/** Montage de l'application. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '../shared/styles.css';
import '../shared/layout.css';
import '../shared/title.css';
import { App } from './app';

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
