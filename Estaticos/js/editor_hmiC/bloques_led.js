import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarLED(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-led';

  bloque.style.position = 'absolute';
  bloque.style.left = '0px';
  bloque.style.top = '0px';

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico" style="text-align: center;">Sin tópico</div>
    <div style="display: flex; justify-content: center; margin-top: 5px;">
      <div class="led off" style="width: 30px; height: 30px; border-radius: 50%; background: gray;"></div>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "pub");

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesLED(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');
  const led = bloque.querySelector('.led');

  // Nombre del bloque
  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre visible:';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = etiqueta.textContent;
  nombreInput.addEventListener('input', () => {
    etiqueta.textContent = nombreInput.value || 'Sin nombre';
  });

  // Color encendido
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color del LED (encendido):';

  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = bloque.dataset.colorOn || '#00ff00';
  colorPicker.addEventListener('input', () => {
    bloque.dataset.colorOn = colorPicker.value;
    bloque.dataset.colorOff = oscurecerColor(colorPicker.value, 0.2);  // Generamos color apagado
  });

  // Inicializar si no existe
  if (!bloque.dataset.colorOn) {
    bloque.dataset.colorOn = colorPicker.value;
    bloque.dataset.colorOff = oscurecerColor(colorPicker.value, 0.2);
  }

  // Selector de tópico
  const topicoLabel = document.createElement('label');
  topicoLabel.textContent = 'Tópico de publicación:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-pub';

  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-pub', selectTopico.value);
  });

  cargarTopicosEnSelect(bloque, 'pub', selectTopico);

  contenedor.appendChild(nombreLabel);
  contenedor.appendChild(nombreInput);
  contenedor.appendChild(colorLabel);
  contenedor.appendChild(colorPicker);
  contenedor.appendChild(topicoLabel);
  contenedor.appendChild(selectTopico);
}

// Utilidad para oscurecer un color hex
function oscurecerColor(hex, factorOscurecer = 0.5) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.floor(r * factorOscurecer);
  g = Math.floor(g * factorOscurecer);
  b = Math.floor(b * factorOscurecer);

  return `rgb(${r}, ${g}, ${b})`;
}


