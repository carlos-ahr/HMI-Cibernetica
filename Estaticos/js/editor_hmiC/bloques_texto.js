import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarTextoEditable(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-texto-enviar';

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Texto a enviar</div>
    <input type="text" class="input-texto" maxlength="50" placeholder="Ej. encender_modo1" style="width: 80%; padding: 8px; margin: 5px 0;">
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
  const input = bloque.querySelector('.input-texto');

  input.addEventListener('input', () => {
    let texto = input.value;
    texto = texto.replace(/[^\w\-]/g, '');
    input.value = texto.slice(0, 50);
  });

  boton.addEventListener('click', () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const mensaje = input.value.trim();

    if (!topico || !mensaje) return;

    if (mqttClient.connected) {
      mqttClient.publish(topico, mensaje);
      console.log(`[PUBLICADO] ${topico} → ${mensaje}`);
    }
  });

  return bloque;
}

export function mostrarPropiedadesTextoEditable(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');

  // Nombre visible
  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre visible:';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = etiqueta.textContent;
  nombreInput.addEventListener('input', () => {
    etiqueta.textContent = nombreInput.value || 'Texto a enviar';
  });

  // Selector de tópico
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

export function restaurarPropiedadesTextoEnviar(bloque, datos) {
  if (datos.nombre) {
    const etiqueta = bloque.querySelector('.etiqueta-topico');
    etiqueta.textContent = datos.nombre;
  }

  if (datos.topicoSub) {
    bloque.setAttribute('data-topico-sub', datos.topicoSub);
  }

  if (datos.valor) {
    const input = bloque.querySelector('.input-texto');
    input.value = datos.valor;
  }
}
