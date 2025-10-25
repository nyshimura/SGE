// index.js
/**
 * Ponto de Entrada Principal (Frontend)
 */

import { render } from './src/router.js';
import { appState } from './src/state.js';

// Importa todos os handlers dos módulos
import * as authHandlers from './src/handlers/authHandlers.js';
// <<< MODIFICADO: Importa o objeto nomeado 'navigationHandlers' >>>
import { navigationHandlers } from './src/handlers/navigationHandlers.js';
import * as enrollmentHandlers from './src/handlers/enrollmentHandlers.js';
import * as courseHandlers from './src/handlers/courseHandlers.js';
import * as financialHandlers from './src/handlers/financialHandlers.js';
import * as profileHandlers from './src/handlers/profileHandlers.js';
import * as modalHandlers from './src/handlers/modalHandlers.js';
import * as systemHandlers from './src/handlers/systemHandlers.js';
import * as uiHandlers from './src/handlers/uiHandlers.js';
import * as aiHandlers from './src/handlers/aiHandlers.js';
// <<< MODIFICADO: Importa o objeto nomeado 'certificateHandlers' >>>
import { certificateHandlers } from './src/handlers/certificateHandlers.js';
import * as dragDropHandlers from './src/utils/helpers.js';

// Cria um objeto global para anexar os handlers
window.AppHandlers = {
    ...authHandlers,
    ...navigationHandlers, // Espalha o objeto importado
    ...enrollmentHandlers,
    ...courseHandlers,
    ...financialHandlers,
    ...profileHandlers,
    ...modalHandlers,
    ...systemHandlers,
    ...uiHandlers,
    ...aiHandlers,
    ...certificateHandlers, // Espalha o objeto importado
    // Adiciona handlers de drag/drop e fileToBase64
    // (Mantém a lógica original para helpers e systemHandlers se fileToBase64 estiver em systemHandlers)
    ...(Object.keys(dragDropHandlers).filter(key => key.startsWith('handle')).reduce((obj, key) => { obj[key] = dragDropHandlers[key]; return obj; }, {})),
    ...(Object.keys(systemHandlers).filter(key => key === 'fileToBase64').reduce((obj, key) => { obj[key] = systemHandlers[key]; return obj; }, {}))
};

// Remove os console.log de debug que adicionamos antes
// console.log("certificateHandlers importado:", certificateHandlers);
// console.log("window.AppHandlers após definição:", window.AppHandlers);


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
          // <<< MODIFICADO: Tenta restaurar a view do hash se existir e for válida, senão dashboard >>>
          const currentHash = window.location.hash.substring(1);
          // (Poderia adicionar uma lista de views válidas aqui para checar o hash)
          appState.currentView = currentHash || 'dashboard';
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

// Listener para mudanças na hash (Simplificado - a lógica principal está nos handlers agora)
// <<< MODIFICADO: Apenas chama render, deixa o router/handlers decidirem a view >>>
window.addEventListener('hashchange', render);

// Inicializa
init();