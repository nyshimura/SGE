/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from './src/router.js';
import * as eventHandlers from './src/events.js';
import * as dragDropHandlers from './src/utils/helpers.js';

// Anexa todos os manipuladores de eventos ao objeto window para torná-los globalmente acessíveis a partir do HTML renderizado.
// Isso mantém a funcionalidade existente enquanto o código é modularizado.
Object.keys(eventHandlers).forEach(key => {
    window[key] = eventHandlers[key];
});

Object.keys(dragDropHandlers).forEach(key => {
    // Apenas anexa funções que são destinadas a serem handlers de eventos diretos
    if (key.startsWith('handle')) {
        window[key] = dragDropHandlers[key];
    }
});


/**
 * Inicializa a aplicação.
 */
function init() {
  render();
}

init();
