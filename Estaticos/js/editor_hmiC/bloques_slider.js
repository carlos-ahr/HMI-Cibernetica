import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarSlider(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-slider';

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Sin nombre (0)</div>
    <input type="range" min="0" max="255" value="0" class="slider">
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "sub"); // aún necesario para los tópicos

  const slider = bloque.querySelector('.slider');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  const actualizarEtiqueta = () => {
    const topic = bloque.getAttribute('data-topico-sub') || '';
    const ultimaParte = topic.split('/').pop();
    const nombre = bloque._nombreVisible || ultimaParte;
    etiqueta.textContent = `${nombre} (${slider.value})`;
  };

  slider.addEventListener('input', () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const valor = parseInt(slider.value);
    actualizarEtiqueta();

    if (!mqttClient.connected || !topico) return;

    if (bloque._timeout) clearTimeout(bloque._timeout);
    bloque._timeout = setTimeout(() => {
      mqttClient.publish(topico, valor.toString());
      console.log(`[PUBLICADO] ${topico} → ${valor}`);
    }, 800);
  });

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);

  return bloque;
}

export function mostrarPropiedadesSlider(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');
  const slider = bloque.querySelector('.slider');

  // Nombre visible
  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre visible:';
  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = bloque._nombreVisible || '';
  nombreInput.addEventListener('input', () => {
    bloque._nombreVisible = nombreInput.value.trim();
    etiqueta.textContent = `${bloque._nombreVisible || 'Sin nombre'} (${slider.value})`;
  });

  // Valor mínimo
  const minLabel = document.createElement('label');
  minLabel.textContent = 'Valor mínimo:';
  const minInput = document.createElement('input');
  minInput.type = 'number';
  minInput.value = slider.min;
  minInput.addEventListener('input', () => {
    slider.min = minInput.value;
  });

  // Valor máximo
  const maxLabel = document.createElement('label');
  maxLabel.textContent = 'Valor máximo:';
  const maxInput = document.createElement('input');
  maxInput.type = 'number';
  maxInput.value = slider.max;
  maxInput.addEventListener('input', () => {
    slider.max = maxInput.value;
  });

  // Tópico MQTT
  const topicoLabel = document.createElement('label');
  topicoLabel.textContent = 'Tópico de suscripción:';
  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-sub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-sub', selectTopico.value);
    actualizarEtiqueta();
  });
  cargarTopicosEnSelect(bloque, 'sub', selectTopico);

  // Agregamos todo al panel
  contenedor.appendChild(nombreLabel);
  contenedor.appendChild(nombreInput);

  contenedor.appendChild(minLabel);
  contenedor.appendChild(minInput);

  contenedor.appendChild(maxLabel);
  contenedor.appendChild(maxInput);

  contenedor.appendChild(topicoLabel);
  contenedor.appendChild(selectTopico);
}

export function restaurarPropiedadesSlider(bloque, datos) {
  const slider = bloque.querySelector('input[type="range"]');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  if (datos.valorMin) slider.min = datos.valorMin;
  if (datos.valorMax) slider.max = datos.valorMax;
  if (datos.valor) slider.value = datos.valor;

  if (datos.nombreVisible) {
    bloque._nombreVisible = datos.nombreVisible;
    bloque.setAttribute('data-nombre-visible', datos.nombreVisible);
    etiqueta.textContent = `${datos.nombreVisible} (${slider.value})`;
  }

  if (datos.topicoSub) {
    bloque.setAttribute('data-topico-sub', datos.topicoSub);
  }
}
