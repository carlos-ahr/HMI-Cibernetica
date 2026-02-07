import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarBarraProgreso(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-barra-progreso';
  bloque.style.padding = '10px';
  bloque.style.margin = '15px 0';
  bloque.style.border = '1px solid #ccc';
  bloque.style.borderRadius = '10px';
  bloque.style.background = '#fff';
  bloque.style.width = '300px';

  bloque.setAttribute('data-topico-pub', '');
  bloque.setAttribute('data-color', '#4caf50');
  bloque.setAttribute('data-max', '100');

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico" style="margin-bottom: 8px;">Barra de progreso</div>
    <div class="contenedor-barra" style="width: 100%; background: #eee; height: 25px; border-radius: 5px; overflow: hidden;">
      <div class="barra" style="width: 0%; height: 100%; background: #4caf50;"></div>
    </div>
    <div class="valor-barra" style="text-align: center; margin-top: 5px;">0%</div>
  `;

  document.getElementById('editor').appendChild(bloque);

  if (!window._bloquesBarrasProgreso) window._bloquesBarrasProgreso = [];
  window._bloquesBarrasProgreso.push(bloque);

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesBarraProgreso(bloque, contenedor) {
  contenedor.innerHTML = '';

  const labelTopico = document.createElement('label');
  labelTopico.textContent = 'Tópico de publicación:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-pub';

  // Restauramos el valor justo después de cargar los tópicos
  cargarTopicosEnSelect(bloque, "pub", selectTopico, (select) => {
    const valorGuardado = bloque.getAttribute("data-topico-pub");
    if (valorGuardado) {
      select.value = valorGuardado;

      // Forzamos el disparo del evento change para que actualice visualmente y suscriba
      const evento = new Event('change', { bubbles: true });
      select.dispatchEvent(evento);
    }
  });

  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-pub', selectTopico.value);
  });

  const labelColor = document.createElement('label');
  labelColor.textContent = 'Color:';

  const inputColor = document.createElement('input');
  inputColor.type = 'color';
  inputColor.value = bloque.getAttribute('data-color') || '#4caf50';
  inputColor.addEventListener('input', () => {
    bloque.setAttribute('data-color', inputColor.value);
    const barra = bloque.querySelector('.barra');
    if (barra) barra.style.background = inputColor.value;
  });

  const labelMax = document.createElement('label');
  labelMax.textContent = 'Máximo:';

  const inputMax = document.createElement('input');
  inputMax.type = 'number';
  inputMax.value = bloque.getAttribute('data-max') || '100';
  inputMax.addEventListener('input', () => {
    bloque.setAttribute('data-max', inputMax.value);
  });

  contenedor.appendChild(labelTopico);
  contenedor.appendChild(selectTopico);
  contenedor.appendChild(labelColor);
  contenedor.appendChild(inputColor);
  contenedor.appendChild(labelMax);
  contenedor.appendChild(inputMax);
}

export function restaurarPropiedadesBarra(bloque, datos) {

  if (datos.topicoPub) {
    bloque.setAttribute('data-topico-pub', datos.topicoPub);
    const select = bloque.querySelector('.select-topico-pub');
    if (select) select.value = datos.topicoPub;
  }
  if (datos.color) {
    bloque.setAttribute('data-color', datos.color);
    bloque.querySelector('.barra').style.background = datos.color;
  }
  if (datos.max) bloque.setAttribute('data-max', datos.max);
  if (datos.min) bloque.setAttribute('data-min', datos.min);
}
