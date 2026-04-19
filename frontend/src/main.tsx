import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for 'TrustedScript' assignment error in strict CSP environments
if ((window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  if (!(window as any).trustedTypes.defaultPolicy) {
    (window as any).trustedTypes.createPolicy('default', {
      createHTML: (string: string) => string,
      createScriptURL: (string: string) => string,
      createScript: (string: string) => string,
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
