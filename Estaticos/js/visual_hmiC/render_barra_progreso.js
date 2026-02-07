// render_barra_progreso.js

export function renderizarBarraProgreso(bloque, mqttClient) {
  const div = document.createElement("div");
  const max = parseFloat(bloque.max || 100);
  const color = bloque.color || "#4caf50";
  const topico = bloque.topicoPub;

  div.innerHTML = `
    <div style="font-weight: bold; text-align:center; margin-bottom: 5px;">
      ${bloque.nombre || 'Barra de progreso'}
    </div>
    <div class="contenedor-barra" style="width: 300px; background: #eee; height: 25px; border-radius: 5px; overflow: hidden;">
      <div class="barra" style="width: 0%; height: 100%; background: ${color};"></div>
    </div>
    <div class="valor-barra" style="text-align: center; margin-top: 5px;">0%</div>
  `;

  const barra = div.querySelector(".barra");
  const texto = div.querySelector(".valor-barra");

  if (topico) {
    mqttClient.subscribe(topico);
    mqttClient.on("message", (topic, message) => {
      if (topic === topico) {
        const valor = parseFloat(message.toString());
        const porcentaje = Math.min(Math.max((valor / max) * 100, 0), 100);
        barra.style.width = `${porcentaje}%`;
        texto.textContent = `${Math.round(porcentaje)}%`;
      }
    });
  }

  return div;
}
