export function renderizarGauge(bloque, mqttClient) {
  const div = document.createElement("div");
  const max = parseFloat(bloque.max || 100);
  const min = parseFloat(bloque.min || 0);
  const topico = bloque.topicoPub;

  const idCanvas = `gauge_${Date.now()}`;
  div.innerHTML = `
    <div style="font-weight: bold; text-align:center; margin-bottom: 5px;">
      ${bloque.nombre || 'Gauge'}
    </div>
    <canvas id="${idCanvas}" width="280" height="140"></canvas>
  `;

  const canvas = div.querySelector(`#${idCanvas}`);
  const ctx = canvas.getContext("2d");

  function dibujarGauge(valor) {
    const porcentaje = Math.max(0, Math.min((valor - min) / (max - min), 1));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radio = 100;
    const centroX = canvas.width / 2;
    const centroY = canvas.height;

    // Semicírculo gris
    ctx.beginPath();
    ctx.arc(centroX, centroY, radio, Math.PI, 2 * Math.PI);
    ctx.fillStyle = "#eee";
    ctx.fill();

    // Aguja
    const angulo = Math.PI + porcentaje * Math.PI;
    const agujaX = centroX + radio * Math.cos(angulo);
    const agujaY = centroY + radio * Math.sin(angulo);

    ctx.beginPath();
    ctx.moveTo(centroX, centroY);
    ctx.lineTo(agujaX, agujaY);
    ctx.strokeStyle = "#4cafef";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Texto
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Valor: ${valor.toFixed(1)}`, centroX, centroY - 10);
  }

  // Inicializar
  dibujarGauge(0);

  // Escuchar MQTT
  if (topico && mqttClient?.connected) {
    mqttClient.subscribe(topico);
    mqttClient.on("message", (topic, message) => {
      if (topic === topico) {
        const valor = parseFloat(message.toString());
        if (!isNaN(valor)) dibujarGauge(valor);
      }
    });
  }

  return div;
}
