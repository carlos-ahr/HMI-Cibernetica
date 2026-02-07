import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarBotonBooleano(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-boton';

  // Atributos iniciales
  bloque.setAttribute('data-nombre-visible', 'Botón');
  bloque.setAttribute('data-topico-sub', '');
  bloque.setAttribute('data-estado', 'false');

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Botón</div>
    <button class="boton-toggle" style="padding: 10px 20px; font-weight: bold;">OFF</button>
  `;

  document.getElementById('editor').appendChild(bloque);
  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);

  const boton = bloque.querySelector('.boton-toggle');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  // Leer estado desde atributo
  let estado = bloque.getAttribute('data-estado') === 'true';
  boton.textContent = estado ? 'ON' : 'OFF';
  boton.style.background = estado ? '#4caf50' : '#ccc';

  boton.addEventListener('click', () => {
    estado = !estado;
    boton.textContent = estado ? 'ON' : 'OFF';
    boton.style.background = estado ? '#4caf50' : '#ccc';
    bloque.setAttribute('data-estado', estado);

    const topico = bloque.getAttribute('data-topico-sub');
    if (topico && mqttClient.connected) {
      mqttClient.publish(topico, estado ? 'ON' : 'OFF');
      console.log(`[PUBLICADO] ${topico} → ${estado ? "ON" : "OFF"}`);
    }
  });

  return bloque;
}

export function mostrarPropiedadesBotonBooleano(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');

  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre visible:';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = bloque.getAttribute('data-nombre-visible') || 'Botón';
  nombreInput.addEventListener('input', () => {
    bloque.setAttribute('data-nombre-visible', nombreInput.value);
    etiqueta.textContent = nombreInput.value;
  });

  const topicoLabel = document.createElement('label');
  topicoLabel.textContent = 'Tópico de suscripción:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-sub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-sub', selectTopico.value);
  });

  cargarTopicosEnSelect(bloque, 'sub', selectTopico);

  contenedor.appendChild(nombreLabel);
  contenedor.appendChild(nombreInput);
  contenedor.appendChild(topicoLabel);
  contenedor.appendChild(selectTopico);
}

export function restaurarPropiedadesBotonBooleano(bloque, datos) {
  const nombre = datos.nombre || 'Botón';
  const topico = datos.topicoSub || '';
  const estadoBool = datos.estado === true || datos.estado === 'true';

  bloque.setAttribute('data-nombre-visible', nombre);
  bloque.setAttribute('data-topico-sub', topico);
  bloque.setAttribute('data-estado', estadoBool ? 'true' : 'false');

  const boton = bloque.querySelector('.boton-toggle');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  boton.textContent = estadoBool ? 'ON' : 'OFF';
  boton.style.background = estadoBool ? '#4caf50' : '#ccc';
  etiqueta.textContent = nombre;
}
