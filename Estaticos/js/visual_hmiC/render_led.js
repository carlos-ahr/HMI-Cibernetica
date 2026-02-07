import { oscurecerColor } from './utilidades.js';

export function renderizarLED(bloque, mqttClient) {
  const div = document.createElement("div");
  const colorOn = bloque.colorOn || '#00ff00';
  const colorOff = oscurecerColor(colorOn, 0.2);

  div.classList.add("bloque", "bloque-led");
  div.style.transform = `translate(${bloque.x}px, ${bloque.y}px)`;

  div.innerHTML = `
    <div style="text-align: center; font-weight: bold; margin-bottom: 5px;">
      ${bloque.nombre || 'LED'}
    </div>
    <div class="led" style="background:${colorOff}; width: 30px; height: 30px; border-radius: 50%; margin:auto;"></div>
  `;

  const led = div.querySelector('.led');
  const topico = bloque.topicoPub;

  if (topico && mqttClient) {
    mqttClient.subscribe(topico);
    mqttClient.on('message', (topic, message) => {
      if (topic === topico) {
        const valor = message.toString().toLowerCase();
        const encendido = valor === "1" || valor === "on";
        led.style.background = encendido ? colorOn : colorOff;
      }
    });
  }

  return div;
}
