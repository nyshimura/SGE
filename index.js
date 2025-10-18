/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from './src/router.js';
import * as eventHandlers from './src/events.js';
import * as dragDropHandlers from './src/utils/helpers.js';
import { appState } from './src/state.js'; // Importa o appState

// Anexa todos os manipuladores de eventos ao objeto window
Object.keys(eventHandlers).forEach(key => {
    window[key] = eventHandlers[key];
});

Object.keys(dragDropHandlers).forEach(key => {
    if (key.startsWith('handle')) {
        window[key] = dragDropHandlers[key];
    }
});


/**
 * Inicializa a aplicação.
 */
function init() {
  // CORREÇÃO: Verifica se há um usuário salvo no localStorage
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      appState.currentView = 'dashboard';
    } catch (e) {
      console.error("Falha ao analisar os dados do usuário salvo", e);
      localStorage.removeItem('currentUser'); // Limpa dados corrompidos
    }
  }
  render();
}

init();