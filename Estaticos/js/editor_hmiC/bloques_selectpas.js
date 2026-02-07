import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarSelectorPorPasos(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-selector-pasos';

  bloque.setAttribute('data-nombre-visible', 'Selector por pasos');
  bloque.setAttribute('data-paso', '1');
  bloque.setAttribute('data-topico-sub', '');

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Selector por pasos (0)</div>
    <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
      <button class="boton-menos">−</button>
      <input type="number" class="valor-pasos" value="0" style="width: 60px; text-align: center;" readonly>
      <button class="boton-mas">+</button>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);

  const botonMenos = bloque.querySelector('.boton-menos');
  const botonMas = bloque.querySelector('.boton-mas');
  const inputValor = bloque.querySelector('.valor-pasos');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  const publicarYActualizar = (valor) => {
    const topico = bloque.getAttribute('data-topico-sub');
    if (!topico || isNaN(valor)) return;
    if (mqttClient.connected) {
      mqttClient.publish(topico, valor.toString());
      console.log(`[PUBLICADO] ${topico} → ${valor}`);
    }
    const nombre = bloque.getAttribute('data-nombre-visible') || "Selector por pasos";
    etiqueta.textContent = `${nombre} (${valor})`;
  };

  botonMas.addEventListener('click', () => {
    const paso = parseFloat(bloque.getAttribute('data-paso') || '1');
    const nuevoValor = parseFloat(inputValor.value) + paso;
    inputValor.value = nuevoValor;
    publicarYActualizar(nuevoValor);
  });

  botonMenos.addEventListener('click', () => {
    const paso = parseFloat(bloque.getAttribute('data-paso') || '1');
    const nuevoValor = parseFloat(inputValor.value) - paso;
    inputValor.value = nuevoValor;
    publicarYActualizar(nuevoValor);
  });

  return bloque;
}

export function mostrarPropiedadesSelectorPorPasos(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');
  const inputValor = bloque.querySelector('.valor-pasos');

  const labelNombre = document.createElement('label');
  labelNombre.textContent = 'Nombre visible:';

  const inputNombre = document.createElement('input');
  inputNombre.type = 'text';
  inputNombre.value = bloque.getAttribute('data-nombre-visible') || 'Selector por pasos';
  inputNombre.addEventListener('input', () => {
    bloque.setAttribute('data-nombre-visible', inputNombre.value);
    etiqueta.textContent = `${inputNombre.value} (${inputValor.value})`;
  });

  const labelPaso = document.createElement('label');
  labelPaso.textContent = 'Incremento (paso):';

  const inputPaso = document.createElement('input');
  inputPaso.type = 'number';
  inputPaso.value = bloque.getAttribute('data-paso') || '1';
  inputPaso.step = '0.01';
  inputPaso.addEventListener('input', () => {
    bloque.setAttribute('data-paso', inputPaso.value);
  });

  const labelTopico = document.createElement('label');
  labelTopico.textContent = 'Tópico de suscripción:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-sub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-sub', selectTopico.value);
  });

  cargarTopicosEnSelect(bloque, 'sub', selectTopico);

  contenedor.appendChild(labelNombre);
  contenedor.appendChild(inputNombre);
  contenedor.appendChild(labelPaso);
  contenedor.appendChild(inputPaso);
  contenedor.appendChild(labelTopico);
  contenedor.appendChild(selectTopico);
}

export function restaurarPropiedadesSelectorPorPasos(bloque, datos) {
  if (datos['nombre']) {
    bloque.setAttribute('data-nombre-visible', datos.nombre);
    bloque.querySelector('.etiqueta-topico').textContent = `${datos.nombre} (0)`;
  }
  if (datos['paso']) bloque.setAttribute('data-paso', datos.paso);
  if (datos['topicoSub']) bloque.setAttribute('data-topico-sub', datos.topicoSub);
}
