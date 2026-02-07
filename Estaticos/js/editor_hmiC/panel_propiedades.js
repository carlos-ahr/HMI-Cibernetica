// panel_propiedades.js

import { mostrarPropiedadesLED } from './bloques_led.js';
import { mostrarPropiedadesSlider } from './bloques_slider.js';
import { mostrarPropiedadesGrafica } from './bloques_grafica.js';
import { mostrarPropiedadesAlarma } from './bloques_alarma.js';
import { mostrarPropiedadesBotonBooleano} from './bloques_boton.js';
import { mostrarPropiedadesTextoEditable } from './bloques_texto.js';
import { mostrarPropiedadesSelectorNumerico } from './bloques_numerico.js';
import { mostrarPropiedadesSelectorPorPasos } from './bloques_selectpas.js';
import { mostrarPropiedadesGauge} from './bloques_gauge.js';
import { mostrarPropiedadesBarraProgreso } from './bloques_barra_progreso.js';
import { mostrarPropiedadesTermometro } from './bloques_termometro.js';
import { mostrarPropiedadesRotatorio } from './bloques_rotatorio.js';

import { mostrarPropiedadesContador } from './bloques_contador.js';
// Importa aquí otros bloques si es necesario

export function mostrarPanelDePropiedades(bloque) {
  const panel = document.getElementById('panel-propiedades');
  const contenido = document.getElementById('contenido-propiedades');

  panel.style.display = 'block';
  contenido.innerHTML = ''; // Limpiar contenido anterior

  if (bloque.classList.contains('tipo-led')) {
    mostrarPropiedadesLED(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-slider')) {
    mostrarPropiedadesSlider(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-grafica')) {
    mostrarPropiedadesGrafica(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-alarma')) {
    mostrarPropiedadesAlarma(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-boton')) {
    mostrarPropiedadesBotonBooleano(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-texto-enviar')) {
    mostrarPropiedadesTextoEditable(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-selector-numerico')) {
    mostrarPropiedadesSelectorNumerico(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-selector-pasos')) {
    mostrarPropiedadesSelectorPorPasos(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-gauge')) {
    mostrarPropiedadesGauge(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-barra-progreso')) {
    mostrarPropiedadesBarraProgreso(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-termometro')) {
    mostrarPropiedadesTermometro(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-rotatorio')) {
    mostrarPropiedadesRotatorio(bloque, contenido);
  }
  if (bloque.classList.contains('tipo-contador')) {
    mostrarPropiedadesContador(bloque, contenido);
  }
  // Aquí puedes seguir agregando más tipos como tipo-grafica, tipo-boton, etc.
}

// Botón para cerrar panel
document.getElementById('cerrar-panel').addEventListener('click', () => {
  document.getElementById('panel-propiedades').style.display = 'none';
});
