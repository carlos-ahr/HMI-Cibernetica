export function renderizarTermometro(bloque, mqttClient) {
  const div = document.createElement("div");
  const color = bloque.color || "#2196f3";
  const min = parseFloat(bloque.min || 0);
  const max = parseFloat(bloque.max || 100);
  const topico = bloque.topicoPub;

  div.innerHTML = `
    <div style="text-align: center; font-weight: bold; margin-bottom: 8px;">
      ${bloque.nombre || 'Termómetro'}
    </div>
    <div class="contenedor-termometro" style="position: relative; height: 200px; width: 40px; margin: auto; background: #eee; border-radius: 10px;">
      <div class="relleno-termometro" style="position: absolute; bottom: 0; width: 100%; height: 0; background: ${color}; border-radius: 10px;"></div>
    </div>
    <div class="valor-termometro" style="text-align: center; margin-top: 6px;">0 °C</div>
  `;

  const relleno = div.querySelector('.relleno-termometro');
  const texto = div.querySelector('.valor-termometro');

  if (topico) {
    mqttClient.subscribe(topico);
    mqttClient.on("message", (topic, message) => {
      if (topic === topico) {
        const valor = parseFloat(message.toString());
        const porcentaje = Math.min(Math.max((valor - min) / (max - min), 0), 1);
        const altura = porcentaje * 100;

        relleno.style.height = `${altura}%`;
        texto.textContent = `${valor.toFixed(1)} °C`;
      }
    });
  }

  return div;
}
