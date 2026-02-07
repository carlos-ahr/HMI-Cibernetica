import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarSelectorNumerico(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-selector-numerico';

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Selector numérico</div>
    <input type="number" class="input-numerico" step="0.01" placeholder="Ej. 3.5" style="width: 100px; margin: 5px 0;">
    <button class="boton-enviar" style="
      background-color: #007BFF;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      padding: 10px 18px;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s, transform 0.1s;">
      Enviar
    </button>
  `;

  document.getElementById('editor').appendChild(bloque);
  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);

  const boton = bloque.querySelector('.boton-enviar');
  const input = bloque.querySelector('.input-numerico');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  boton.addEventListener('click', () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const valor = input.value.trim();

    if (!topico || valor === "") return;

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) return;

    if (mqttClient.connected) {
      mqttClient.publish(topico, valorNumerico.toString());
      console.log(`[PUBLICADO] ${topico} → ${valorNumerico}`);
      const nombre = bloque.getAttribute('data-nombre-visible') || "Selector numérico";
      etiqueta.textContent = `${nombre} (${valorNumerico})`;
    }
  });

  return bloque;
}

export function mostrarPropiedadesSelectorNumerico(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');

  // Campo para nombre visible
  const labelNombre = document.createElement('label');
  labelNombre.textContent = 'Nombre visible:';

  const inputNombre = document.createElement('input');
  inputNombre.type = 'text';
  inputNombre.value = bloque.getAttribute('data-nombre-visible') || 'Selector numérico';
  inputNombre.addEventListener('input', () => {
    bloque.setAttribute('data-nombre-visible', inputNombre.value);
    const valor = bloque.querySelector('.input-numerico').value || '0';
    etiqueta.textContent = `${inputNombre.value} (${valor})`;
  });

  // Selector de tópico
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
  contenedor.appendChild(labelTopico);
  contenedor.appendChild(selectTopico);
}

export function restaurarPropiedadesSelectorNumerico(bloque, datos) {
  if (datos.topicoSub) {
    bloque.setAttribute("data-topico-sub", datos.topicoSub);
  }

  const nombre = datos.nombreVisible || datos.nombre || "Selector numérico";
  bloque.setAttribute("data-nombre-visible", nombre);

  const valor = datos.valor || "0";

  const etiqueta = bloque.querySelector('.etiqueta-topico');
  if (etiqueta) etiqueta.textContent = `${nombre} (${valor})`;

  const input = bloque.querySelector('.input-numerico');
  if (input) input.value = valor;
}
