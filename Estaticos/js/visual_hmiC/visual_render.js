import { renderizarLED } from './render_led.js';
import { renderizarSelectorPasos } from './render_selector_pasos.js';
import { renderizarBarraProgreso } from './render_barra_progreso.js';
import { renderizarBoton } from './render_boton.js';
import { renderizarGrafica } from './render_grafica.js';
import { renderizarSlider } from './render_slider.js';
import { renderizarTextoEnviar } from './render_texto.js';
import { renderizarSelectorNumerico } from './render_numerico.js';
import { renderizarGauge } from './render_gauge.js';
import { renderizarTermometro } from './render_termometro.js';
import { renderizarRotatorio } from './render_rotatorio.js';

// 1) Fuerza URL absoluta y path raíz
window.mqttClient = mqtt.connect('ws://0.0.0.0:9001', {
  protocolVersion: 4,
  path: "/",
  // 2) Loguea la URL que mqtt.js va a usar
  createWebsocket: (url, protocols, opts) => {
    console.log("[MQTT WS] URL:", url, "protocols:", protocols);
    try {
      const ws = new WebSocket(url, protocols);
      ws.onerror = (e) => console.log("[MQTT WS] onerror:", e);
      return ws;
    } catch (err) {
      console.log("[MQTT WS] ctor error:", err);
      throw err;
    }
  },
});

// Para ver errores de conexión MQTT
window.mqttClient.on('error', (err) => console.log("[MQTT] error:", err));


window.mqttClient.on('connect', () => {
  console.log("[MQTT] Conectado desde visual");
});

export function renderizarBloques(bloques) {
  const contenedor = document.getElementById("contenedor-bloques");

  bloques.forEach(bloque => {
    let div;

    switch (bloque.tipo) {
      case 'tipo-led':
        div = renderizarLED(bloque, mqttClient);
        break;

      case 'tipo-selector-pasos':
        div = renderizarSelectorPasos(bloque, mqttClient);
        break;

      case 'tipo-barra-progreso':
        div = renderizarBarraProgreso(bloque, mqttClient);
        break;
      
      case 'tipo-boton':
        div = renderizarBoton(bloque, mqttClient);
        break;

      case 'tipo-grafica':
        div = renderizarGrafica(bloque, mqttClient);
        break;

      case 'tipo-slider':
        div = renderizarSlider(bloque, mqttClient);
        break;
        
      case 'tipo-texto-enviar':
        div = renderizarTextoEnviar(bloque, mqttClient);
        break;  
        
      case 'tipo-selector-numerico':
        div = renderizarSelectorNumerico(bloque, mqttClient);
        break;  
        
      case 'tipo-gauge':
        div = renderizarGauge(bloque, mqttClient);
        break;    
        
      case 'tipo-termometro':
        div = renderizarTermometro(bloque, mqttClient);
        break;    
        
      case 'tipo-rotatorio':
        div = renderizarRotatorio(bloque, mqttClient);
        break;   

      default:
        div = document.createElement("div");
        div.className = "bloque";
        div.innerHTML = `<div style="color: gray;">(Bloque ${bloque.tipo} no soportado aún)</div>`;
    }

    if (bloque.x && bloque.y) {
      div.style.transform = `translate(${bloque.x}px, ${bloque.y}px)`;
    }

    div.classList.add("bloque");
    contenedor.appendChild(div);
  });
}
