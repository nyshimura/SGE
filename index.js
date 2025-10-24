// index.js
/**
 * Ponto de Entrada Principal (Frontend)
 */

import { render } from './src/router.js';
import { appState } from './src/state.js';

// Importa todos os handlers dos módulos
import * as authHandlers from './src/handlers/authHandlers.js';
import * as navigationHandlers from './src/handlers/navigationHandlers.js';
import * as enrollmentHandlers from './src/handlers/enrollmentHandlers.js';
import * as courseHandlers from './src/handlers/courseHandlers.js';
import * as financialHandlers from './src/handlers/financialHandlers.js';
import * as profileHandlers from './src/handlers/profileHandlers.js';
import * as modalHandlers from './src/handlers/modalHandlers.js';
import * as systemHandlers from './src/handlers/systemHandlers.js';
import * as uiHandlers from './src/handlers/uiHandlers.js';
import * as aiHandlers from './src/handlers/aiHandlers.js';
import * as certificateHandlers from './src/handlers/certificateHandlers.js'; // <-- NOVA IMPORTAÇÃO
import * as dragDropHandlers from './src/utils/helpers.js';

// Cria um objeto global para anexar os handlers
window.AppHandlers = {
    ...authHandlers,
    ...navigationHandlers,
    ...enrollmentHandlers,
    ...courseHandlers,
    ...financialHandlers,
    ...profileHandlers,
    ...modalHandlers,
    ...systemHandlers,
    ...uiHandlers,
    ...aiHandlers,
    ...certificateHandlers, // <-- ADICIONADO
    // Adiciona handlers de drag/drop e fileToBase64
    ...(Object.keys(dragDropHandlers).filter(key => key.startsWith('handle')).reduce((obj, key) => { obj[key] = dragDropHandlers[key]; return obj; }, {})),
    ...(Object.keys(systemHandlers).filter(key => key === 'fileToBase64').reduce((obj, key) => { obj[key] = systemHandlers[key]; return obj; }, {})) // Adiciona fileToBase64
};


/**
 * Inicializa a aplicação.
 */
function init() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      if (window.location.hash.startsWith('#resetPassword') || window.location.hash === '#forgotPasswordRequest') {
            appState.currentView = 'dashboard';
            history.pushState("", document.title, window.location.pathname + window.location.search);
      } else {
            appState.currentView = 'dashboard';
      }
    } catch (e) {
      console.error("Falha ao analisar usuário salvo:", e);
      localStorage.removeItem('currentUser');
      appState.currentView = 'login';
    }
  } else {
    if (window.location.hash.startsWith('#resetPassword')) {
        appState.currentView = 'resetPassword';
    } else if (window.location.hash === '#forgotPasswordRequest') {
        appState.currentView = 'forgotPasswordRequest';
    } else {
        appState.currentView = 'login';
        if (window.location.hash) { history.pushState("", document.title, window.location.pathname + window.location.search); }
    }
  }
  render(); // Chama a primeira renderização
}

// Listener para mudanças na hash
window.addEventListener('hashchange', () => {
    if (!appState.currentUser) {
        if (window.location.hash.startsWith('#resetPassword')) { appState.currentView = 'resetPassword'; }
        else if (window.location.hash === '#forgotPasswordRequest') { appState.currentView = 'forgotPasswordRequest'; }
        else {
             appState.currentView = 'login';
             if (window.location.hash && !window.location.hash.startsWith('#resetPassword') && window.location.hash !== '#forgotPasswordRequest'){
                  history.pushState("", document.title, window.location.pathname + window.location.search);
             }
        }
    } else {
        appState.currentView = 'dashboard';
        if (window.location.hash) { history.pushState("", document.title, window.location.pathname + window.location.search); }
    }
    render();
});

// Inicializa
init();