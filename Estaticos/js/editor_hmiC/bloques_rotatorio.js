import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';

export function agregarRotatorio(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-rotatorio';
  bloque.style.width = '250px';
  bloque.style.margin = '15px';

  const idCanvas = `rotatorio_${Date.now()}`;

  // Atributos de configuración
  bloque.setAttribute('data-topico-pub', '');
  bloque.setAttribute('data-max', '100');

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico">Rotatorio</div>
    <canvas id="${idCanvas}" width="250" height="250"></canvas>
  `;

  document.getElementById('editor').appendChild(bloque);
  const canvas = bloque.querySelector(`#${idCanvas}`);
  const ctx = canvas.getContext('2d');

  const centro = { x: 125, y: 125 };
  const radio = 100;

  bloque._rotatorio = {
    canvas,
    ctx,
    centro,
    radio,
    valor: 0,
    dibujar(valor) {
      const max = parseFloat(bloque.getAttribute('data-max')) || 100;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.ctx.beginPath();
      this.ctx.arc(this.centro.x, this.centro.y, this.radio, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#eee";
      this.ctx.fill();

      const porcentaje = Math.min(valor / max, 1);
      const angulo = -Math.PI / 2 + porcentaje * 2 * Math.PI;
      const agujaX = this.centro.x + this.radio * 0.8 * Math.cos(angulo);
      const agujaY = this.centro.y + this.radio * 0.8 * Math.sin(angulo);

      this.ctx.beginPath();
      this.ctx.moveTo(this.centro.x, this.centro.y);
      this.ctx.lineTo(agujaX, agujaY);
      this.ctx.strokeStyle = "#f44336";
      this.ctx.lineWidth = 4;
      this.ctx.stroke();

      this.ctx.fillStyle = "#000";
      this.ctx.font = "16px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText(`${valor}`, this.centro.x, this.centro.y + 6);
    }
  };

  bloque._rotatorio.dibujar(0);

  if (!window._bloquesRotatorios) window._bloquesRotatorios = [];
  window._bloquesRotatorios.push(bloque);

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesRotatorio(bloque, contenedor) {
  contenedor.innerHTML = '';

  const labelTopico = document.createElement('label');
  labelTopico.textContent = 'Tópico de publicación:';

  const selectTopico = document.createElement('select');
  selectTopico.className = 'select-topico-pub';
  selectTopico.addEventListener('change', () => {
    bloque.setAttribute('data-topico-pub', selectTopico.value);
  });
  cargarTopicosEnSelect(bloque, "pub", selectTopico);

  const labelMax = document.createElement('label');
  labelMax.textContent = 'Máximo:';

  const inputMax = document.createElement('input');
  inputMax.type = 'number';
  inputMax.value = bloque.getAttribute('data-max');
  inputMax.addEventListener('input', () => {
    const nuevoMax = parseFloat(inputMax.value);
    if (!isNaN(nuevoMax) && nuevoMax > 0) {
      bloque.setAttribute('data-max', nuevoMax);
      if (bloque._rotatorio) {
        bloque._rotatorio.dibujar(bloque._rotatorio.valor || 0);
      }
    }
  });

  contenedor.appendChild(labelTopico);
  contenedor.appendChild(selectTopico);
  contenedor.appendChild(labelMax);
  contenedor.appendChild(inputMax);
}

export function restaurarPropiedadesRotatorio(bloque, datos) {
  if (!bloque || !datos) return;

  if (datos.nombre) {
    const etiqueta = bloque.querySelector('.etiqueta-topico');
    if (etiqueta) etiqueta.textContent = datos.nombre;
  }

  if (datos.topicoPub) {
    bloque.setAttribute('data-topico-pub', datos.topicoPub);
  }

  if (datos.max) {
    bloque.setAttribute('data-max', datos.max);
  }

  // Redibujar con el valor si está presente
  if (bloque._rotatorio) {
    const valor = parseFloat(datos.valor || 0);
    bloque._rotatorio.valor = valor;
    bloque._rotatorio.dibujar(valor);
  }
}
