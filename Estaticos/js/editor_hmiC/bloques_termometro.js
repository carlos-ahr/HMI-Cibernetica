import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarTermometro(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-termometro';
  bloque.style.cssText = `
    padding: 15px;
    margin: 15px 0;
    border: 1px solid #ccc;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    width: 120px;
    text-align: center;
  `;

  bloque.setAttribute('data-topico-pub', '');
  bloque.setAttribute('data-color', '#2196f3');
  bloque.setAttribute('data-min', '0');
  bloque.setAttribute('data-max', '100');

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Termómetro</div>
    <div class="valor-termometro" style="margin-bottom: 10px; font-weight: bold;">0 °C</div>
    <div class="contenedor-termometro" style="position: relative; height: 200px; width: 40px; margin: auto; background: #eee; border-radius: 10px;">
      <div class="relleno-termometro" style="position: absolute; bottom: 0; width: 100%; height: 0; background: #2196f3; border-radius: 10px;"></div>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);

  if (!window._bloquesTermometros) window._bloquesTermometros = [];

  const valorDiv = bloque.querySelector('.valor-termometro');
  const relleno = bloque.querySelector('.relleno-termometro');

  window._bloquesTermometros.push({ 
    bloque, valorDiv, relleno,
    getTopico: () => bloque.getAttribute('data-topico-pub'),
    getMin: () => parseFloat(bloque.getAttribute('data-min')) || 0,
    getMax: () => parseFloat(bloque.getAttribute('data-max')) || 100,
    getColor: () => bloque.getAttribute('data-color')
  });

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesTermometro(bloque, contenedor) {
  contenedor.innerHTML = '';

  const labelTopico = document.createElement('label');
  labelTopico.textContent = 'Tópico de publicación:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-pub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-pub', selectTopico.value);
  });
  cargarTopicosEnSelect(bloque, "pub", selectTopico);

  const labelColor = document.createElement('label');
  labelColor.textContent = 'Color:';

  const inputColor = document.createElement('input');
  inputColor.type = 'color';
  inputColor.value = bloque.getAttribute('data-color');
  inputColor.addEventListener('input', () => {
    bloque.setAttribute('data-color', inputColor.value);
    const relleno = bloque.querySelector('.relleno-termometro');
    if (relleno) relleno.style.background = inputColor.value;
  });

  const labelMin = document.createElement('label');
  labelMin.textContent = 'Mín:';

  const inputMin = document.createElement('input');
  inputMin.type = 'number';
  inputMin.value = bloque.getAttribute('data-min');
  inputMin.addEventListener('input', () => {
    bloque.setAttribute('data-min', inputMin.value);
  });

  const labelMax = document.createElement('label');
  labelMax.textContent = 'Máx:';

  const inputMax = document.createElement('input');
  inputMax.type = 'number';
  inputMax.value = bloque.getAttribute('data-max');
  inputMax.addEventListener('input', () => {
    bloque.setAttribute('data-max', inputMax.value);
  });

  contenedor.appendChild(labelTopico);
  contenedor.appendChild(selectTopico);
  contenedor.appendChild(labelColor);
  contenedor.appendChild(inputColor);
  contenedor.appendChild(labelMin);
  contenedor.appendChild(inputMin);
  contenedor.appendChild(labelMax);
  contenedor.appendChild(inputMax);
}

export function restaurarPropiedadesTermometro(bloque, data) {
  if (data.topicoPub) {
    bloque.setAttribute('data-topico-pub', data.topicoPub);
  }

  if (data.color) {
    bloque.setAttribute('data-color', data.color);
    const relleno = bloque.querySelector('.relleno-termometro');
    if (relleno) relleno.style.background = data.color;
  }

  if (data.min !== undefined) {
    bloque.setAttribute('data-min', data.min);
  }

  if (data.max !== undefined) {
    bloque.setAttribute('data-max', data.max);
  }

  if (data.nombre) {
    bloque.setAttribute('data-nombre-visible', data.nombre);
    const etiqueta = bloque.querySelector('.etiqueta-topico');
    if (etiqueta) etiqueta.textContent = data.nombre;
  }
}
