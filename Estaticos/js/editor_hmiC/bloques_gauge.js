import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarGauge(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-gauge';
  bloque.style.padding = '15px';
  bloque.style.margin = '15px 0';
  bloque.style.border = '1px solid #ccc';
  bloque.style.borderRadius = '10px';
  bloque.style.background = '#fff';
  bloque.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
  bloque.style.width = '300px';

  const idCanvas = `gauge_${Date.now()}`;

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico" style="font-weight:bold; font-size:16px; margin-bottom:10px;">Gauge</div>
    <canvas id="${idCanvas}" width="280" height="140"></canvas>
  `;

  document.getElementById('editor').appendChild(bloque);
  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);

  const canvas = bloque.querySelector(`#${idCanvas}`);
  const ctx = canvas.getContext('2d');

  bloque.setAttribute('data-min', '0');
  bloque.setAttribute('data-max', '100');
  bloque.setAttribute('data-topico-pub', '');

  function dibujarGauge(valor) {
    const min = parseFloat(bloque.getAttribute('data-min')) || 0;
    const max = parseFloat(bloque.getAttribute('data-max')) || 100;
    const porcentaje = Math.max(0, Math.min((valor - min) / (max - min), 1));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radio = 100;
    const centroX = canvas.width / 2;
    const centroY = canvas.height;

    ctx.beginPath();
    ctx.arc(centroX, centroY, radio, Math.PI, 2 * Math.PI);
    ctx.fillStyle = "#eee";
    ctx.fill();

    const angulo = Math.PI + porcentaje * Math.PI;
    const agujaX = centroX + radio * Math.cos(angulo);
    const agujaY = centroY + radio * Math.sin(angulo);

    ctx.beginPath();
    ctx.moveTo(centroX, centroY);
    ctx.lineTo(agujaX, agujaY);
    ctx.strokeStyle = "#f44336";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Valor: ${valor.toFixed(1)}`, centroX, centroY - 10);
  }

  dibujarGauge(0);  // Inicial

  if (!window._bloquesGauges) window._bloquesGauges = [];
  window._bloquesGauges.push({ bloque, dibujarGauge });

  return bloque;
}

export function mostrarPropiedadesGauge(bloque, contenedor) {
  contenedor.innerHTML = '';

  const labelTopico = document.createElement('label');
  labelTopico.textContent = 'Tópico de publicación:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-pub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-pub', selectTopico.value);
  });
  cargarTopicosEnSelect(bloque, "pub", selectTopico);

  const labelMin = document.createElement('label');
  labelMin.textContent = 'Mínimo:';

  const inputMin = document.createElement('input');
  inputMin.type = 'number';
  inputMin.value = bloque.getAttribute('data-min') || '0';
  inputMin.addEventListener('input', () => {
    bloque.setAttribute('data-min', inputMin.value);
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
  contenedor.appendChild(labelMin);
  contenedor.appendChild(inputMin);
  contenedor.appendChild(labelMax);
  contenedor.appendChild(inputMax);
}

export function restaurarPropiedadesGauge(bloque, datos) {
  if (datos.min) bloque.setAttribute('data-min', datos.min);
  if (datos.max) bloque.setAttribute('data-max', datos.max);
  if (datos.topicoPub) bloque.setAttribute('data-topico-pub', datos.topicoPub);
  if (datos.valor) bloque.setAttribute('data-valor', datos.valor);

  // Dibujar el valor restaurado en el gauge
  const canvas = bloque.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const valor = parseFloat(datos.valor) || 0;

  const min = parseFloat(bloque.getAttribute('data-min')) || 0;
  const max = parseFloat(bloque.getAttribute('data-max')) || 100;
  const porcentaje = Math.max(0, Math.min((valor - min) / (max - min), 1));

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radio = 100;
  const centroX = canvas.width / 2;
  const centroY = canvas.height;

  ctx.beginPath();
  ctx.arc(centroX, centroY, radio, Math.PI, 2 * Math.PI);
  ctx.fillStyle = "#eee";
  ctx.fill();

  const angulo = Math.PI + porcentaje * Math.PI;
  const agujaX = centroX + radio * Math.cos(angulo);
  const agujaY = centroY + radio * Math.sin(angulo);

  ctx.beginPath();
  ctx.moveTo(centroX, centroY);
  ctx.lineTo(agujaX, agujaY);
  ctx.strokeStyle = "#f44336";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Valor: ${valor.toFixed(1)}`, centroX, centroY - 10);
}
