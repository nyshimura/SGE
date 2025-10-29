// index.js
/**
 * Ponto de Entrada Principal (Frontend)
 */

import { render } from './src/router.js';
import { appState } from './src/state.js';

// Importa todos os handlers dos módulos
import * as authHandlers from './src/handlers/authHandlers.js';
import { navigationHandlers } from './src/handlers/navigationHandlers.js';
import * as enrollmentHandlers from './src/handlers/enrollmentHandlers.js';
// <<< Importa o objeto nomeado 'courseHandlers' >>>
import { courseHandlers } from './src/handlers/courseHandlers.js';
import * as financialHandlers from './src/handlers/financialHandlers.js';
import * as profileHandlers from './src/handlers/profileHandlers.js';
import * as modalHandlers from './src/handlers/modalHandlers.js';
import * as systemHandlers from './src/handlers/systemHandlers.js';
import * as uiHandlers from './src/handlers/uiHandlers.js';
import * as aiHandlers from './src/handlers/aiHandlers.js';
import { certificateHandlers } from './src/handlers/certificateHandlers.js';
// <<< Importa as funções de drag/drop de helpers.js >>>
import { handleDragStart, handleDragEnd, handleDragOver, handleDrop } from './src/utils/helpers.js';


// Cria um objeto global para anexar os handlers
window.AppHandlers = {
    ...authHandlers,
    ...navigationHandlers, // Espalha o objeto importado de navigationHandlers
    ...enrollmentHandlers,
    ...courseHandlers,    // <<< Espalha o objeto importado de courseHandlers (já inclui os novos)
    ...financialHandlers,
    ...profileHandlers,
    ...modalHandlers,
    ...systemHandlers,
    ...uiHandlers,
    ...aiHandlers,
    ...certificateHandlers, // Espalha o objeto importado de certificateHandlers
    // <<< Adiciona explicitamente os handlers de drag/drop >>>
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
};

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Listener para mudanças na hash (usado principalmente para login/logout e reset de senha)
window.addEventListener('hashchange', render);

/**
 * Inicializa a aplicação, verificando o estado de login.
 */
async function initializeApp() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      // Se logado, limpa hashes de autenticação e redireciona para dashboard se necessário
      if (window.location.hash.startsWith('#resetPassword') || window.location.hash === '#forgotPasswordRequest') {
          appState.currentView = 'dashboard';
          history.pushState("", document.title, window.location.pathname + window.location.search);
      } else {
          // Tenta restaurar a view do hash se existir e for válida, senão dashboard
          const currentHash = window.location.hash.substring(1);
          // (Poderia adicionar uma lista de views válidas aqui para checar o hash)
          appState.currentView = currentHash || 'dashboard'; // Se hash vazia, vai para dashboard
      }
    } catch (e) {
      console.error("Falha ao analisar usuário salvo:", e);
      localStorage.removeItem('currentUser');
      appState.currentView = 'login';
    }
  } else {
    // Se não logado, verifica se hash é de reset/esqueci senha
    if (window.location.hash.startsWith('#resetPassword')) {
        appState.currentView = 'resetPassword';
    } else if (window.location.hash === '#forgotPasswordRequest') {
        appState.currentView = 'forgotPasswordRequest';
    } else {
        // Se não logado e sem hash especial, vai para login
        appState.currentView = 'login';
        // Limpa qualquer outra hash que possa existir
        if (window.location.hash) { history.pushState("", document.title, window.location.pathname + window.location.search); }
    }
  }
  render(); // Chama a primeira renderização
}