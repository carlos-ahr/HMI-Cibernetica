export function renderizarRotatorio(bloque, mqttClient) {
  const div = document.createElement("div");
  div.className = "bloque tipo-rotatorio";
  div.style.margin = "15px";
  div.style.textAlign = "center";

  const max = parseFloat(bloque.max || 100);
  const topico = bloque.topicoPub || '';
  const nombre = bloque.nombre || 'Rotatorio';

  const idCanvas = `rotatorio_${Date.now()}`;

  div.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 10px;">${nombre}</div>
    <canvas id="${idCanvas}" width="250" height="250"></canvas>
  `;

  const canvas = div.querySelector(`#${idCanvas}`);
  const ctx = canvas.getContext("2d");
  const centro = { x: 125, y: 125 };
  const radio = 100;

  function dibujar(valor) {
    const porcentaje = Math.min(valor / max, 1);
    const angulo = -Math.PI / 2 + porcentaje * 2 * Math.PI;
    const agujaX = centro.x + radio * 0.8 * Math.cos(angulo);
    const agujaY = centro.y + radio * 0.8 * Math.sin(angulo);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(centro.x, centro.y, radio, 0, 2 * Math.PI);
    ctx.fillStyle = "#eee";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centro.x, centro.y);
    ctx.lineTo(agujaX, agujaY);
    ctx.strokeStyle = "#f44336";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${valor}`, centro.x, centro.y + 6);
  }

  dibujar(0);

  if (topico) {
    mqttClient.subscribe(topico);
    mqttClient.on("message", (topic, message) => {
      if (topic === topico) {
        const valor = parseFloat(message.toString());
        if (!isNaN(valor)) dibujar(valor);
      }
    });
  }

  return div;
}
