import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarAlarma(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-alarma';

  bloque.style.position = 'absolute';
  bloque.style.left = '0px';
  bloque.style.top = '0px';

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Alarma</div>
    <div class="alarma-estado" style="
      width: 100%;
      padding: 10px;
      border-radius: 5px;
      background: #ccc;
      color: #000;
      font-weight: bold;
      text-align: center;">
      Sin conexión
    </div>
  `;

  // Inicializar datos por defecto
  bloque.dataset.colorNormal = '#CCCCCC';
  bloque.dataset.colorCritico = '#FF4444';
  bloque.dataset.colorInestable = '#FFDD44';
  bloque.dataset.limiteInferior = '10';
  bloque.dataset.limiteSuperior = '90';
  bloque.setAttribute('data-topico-pub', '');

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, 'pub');

  const estadoDiv = bloque.querySelector('.alarma-estado');

  if (!window._bloquesAlarmas) window._bloquesAlarmas = [];
  window._bloquesAlarmas.push({ bloque, estadoDiv, topico: null });

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesAlarma(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');
  const estadoDiv = bloque.querySelector('.alarma-estado');

  // Nombre del bloque
  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre visible:';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = etiqueta.textContent;
  nombreInput.addEventListener('input', () => {
    etiqueta.textContent = nombreInput.value || 'Alarma';
  });

  // Selector de tópico
  const topicoLabel = document.createElement('label');
  topicoLabel.textContent = 'Tópico de publicación:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-pub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-pub', selectTopico.value);
  });
  cargarTopicosEnSelect(bloque, 'pub', selectTopico);

  // Límites
  const limInfLabel = document.createElement('label');
  limInfLabel.textContent = 'Límite inferior:';

  const limInfInput = document.createElement('input');
  limInfInput.type = 'number';
  limInfInput.value = bloque.dataset.limiteInferior || 10;
  limInfInput.addEventListener('input', () => {
    bloque.dataset.limiteInferior = limInfInput.value;
  });

  const limSupLabel = document.createElement('label');
  limSupLabel.textContent = 'Límite superior:';

  const limSupInput = document.createElement('input');
  limSupInput.type = 'number';
  limSupInput.value = bloque.dataset.limiteSuperior || 90;
  limSupInput.addEventListener('input', () => {
    bloque.dataset.limiteSuperior = limSupInput.value;
  });

  // Colores
  const colorNormalLabel = document.createElement('label');
  colorNormalLabel.textContent = 'Color Normal:';

  const colorNormalInput = document.createElement('input');
  colorNormalInput.type = 'color';
  colorNormalInput.value = bloque.dataset.colorNormal;
  colorNormalInput.addEventListener('input', () => {
    bloque.dataset.colorNormal = colorNormalInput.value;
  });

  const colorCriticoLabel = document.createElement('label');
  colorCriticoLabel.textContent = 'Color Crítico:';

  const colorCriticoInput = document.createElement('input');
  colorCriticoInput.type = 'color';
  colorCriticoInput.value = bloque.dataset.colorCritico;
  colorCriticoInput.addEventListener('input', () => {
    bloque.dataset.colorCritico = colorCriticoInput.value;
  });

  const colorInestableLabel = document.createElement('label');
  colorInestableLabel.textContent = 'Color Inestable:';

  const colorInestableInput = document.createElement('input');
  colorInestableInput.type = 'color';
  colorInestableInput.value = bloque.dataset.colorInestable;
  colorInestableInput.addEventListener('input', () => {
    bloque.dataset.colorInestable = colorInestableInput.value;
  });

  // Agregar al panel
  contenedor.appendChild(nombreLabel);
  contenedor.appendChild(nombreInput);
  contenedor.appendChild(topicoLabel);
  contenedor.appendChild(selectTopico);
  contenedor.appendChild(limInfLabel);
  contenedor.appendChild(limInfInput);
  contenedor.appendChild(limSupLabel);
  contenedor.appendChild(limSupInput);
  contenedor.appendChild(colorNormalLabel);
  contenedor.appendChild(colorNormalInput);
  contenedor.appendChild(colorCriticoLabel);
  contenedor.appendChild(colorCriticoInput);
  contenedor.appendChild(colorInestableLabel);
  contenedor.appendChild(colorInestableInput);
}
