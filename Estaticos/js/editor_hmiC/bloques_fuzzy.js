// bloques_fuzzy.js
import { agregarBotonEliminar } from './utilidades_bloques.js'; 

export function agregarFuzzy(mqttClient, cargarTopicosEnSelect) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-fuzzy';
  bloque.style.padding = '15px';
  bloque.style.margin = '15px 0';
  bloque.style.border = '1px solid #ccc';
  bloque.style.borderRadius = '10px';
  bloque.style.background = '#fff';
  bloque.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
  bloque.style.width = '400px';

  const idCanvas = `fuzzy_${Date.now()}`;

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico" style="font-weight:bold; font-size:16px; margin-bottom:10px;">Gráfica Fuzzy</div>
    <canvas id="${idCanvas}" width="380" height="200" style="background:#f9f9f9; border:1px solid #ccc;"></canvas>
    <div class="slider-config">
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-pub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "pub");

  const canvas = bloque.querySelector(`#${idCanvas}`);
  const ctx = canvas.getContext('2d');

  const funciones = [
    { nombre: "Bajo", color: "#4CAF50", puntos: [[0, 1], [50, 0]] },
    { nombre: "Medio", color: "#2196F3", puntos: [[25, 0], [50, 1], [75, 0]] },
    { nombre: "Alto", color: "#F44336", puntos: [[50, 0], [100, 1]] }
  ];

  function dibujarFuzzy(valorActual = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    funciones.forEach(f => {
      ctx.beginPath();
      const [px0, py0] = mapear(f.puntos[0]);
      ctx.moveTo(px0, py0);
      for (let i = 1; i < f.puntos.length; i++) {
        const [px, py] = mapear(f.puntos[i]);
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    if (valorActual !== null) {
      const x = (valorActual / 100) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x, 0);
      ctx.strokeStyle = "#000";
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Valor: ${valorActual.toFixed(1)}`, x + 5, 15);
    }
  }

  function mapear([x, y]) {
    const px = (x / 100) * canvas.width;
    const py = canvas.height - (y * canvas.height);
    return [px, py];
  }

  dibujarFuzzy();

  if (!window._bloquesFuzzy) window._bloquesFuzzy = [];
  window._bloquesFuzzy.push({ bloque, canvas, ctx, dibujarFuzzy });
  
  agregarBotonEliminar(bloque);
}
