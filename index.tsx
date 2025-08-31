// Polyfill for globalThis, to fix issues in some browser/bundler environments
if (typeof globalThis === 'undefined') {
  // Ensure 'var' is used as per original, and that 'window' is the intended global context
  var globalThis = window;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Không tìm thấy phần tử root để gắn vào");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);