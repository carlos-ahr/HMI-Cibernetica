import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarContador() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-contador';

  bloque.style.position = 'absolute';
  bloque.style.left = '0px';
  bloque.style.top = '0px';
  bloque.setAttribute('data-topico-pub', '');
  bloque.setAttribute('data-contador', '0');

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico" style="text-align: center;">Contador</div>
    <div class="valor-contador" style="font-size: 24px; text-align: center; margin-top: 5px;">0</div>
    <button class="btn-reset-contador" style="margin-top: 4px; font-size: 12px;">Reiniciar</button>
  `;

  // Reinicio desde el botón del bloque
  bloque.querySelector('.btn-reset-contador').addEventListener('click', () => {
    bloque.setAttribute('data-contador', '0');
    bloque.querySelector('.valor-contador').textContent = '0';
  });

  document.getElementById('editor').appendChild(bloque);
  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesContador(bloque, contenedor) {
  contenedor.innerHTML = '';

  const etiqueta = bloque.querySelector('.etiqueta-topico');

  // Nombre visible
  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre visible:';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = etiqueta.textContent;
  nombreInput.addEventListener('input', () => {
    etiqueta.textContent = nombreInput.value || 'Contador';
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

  contenedor.appendChild(nombreLabel);
  contenedor.appendChild(nombreInput);
  contenedor.appendChild(topicoLabel);
  contenedor.appendChild(selectTopico);
}
