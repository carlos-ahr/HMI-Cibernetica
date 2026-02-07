window.mqttClient = mqtt.connect('ws://' + location.hostname + ':9001');

window.mqttClient.on('connect', () => {
  console.log("[MQTT] Conectado desde visual");
});

export async function cargarVisual(nombreDispositivo) {
  try {
    const res = await fetch(`/cargar_hmi/${nombreDispositivo}`);
    const data = await res.json();
    if (data.bloques) {
      renderizarBloques(data.bloques);
    } else {
      console.warn("[VISUAL] No se encontraron bloques.");
    }
  } catch (err) {
    console.error("[VISUAL] Error al cargar el HMI:", err);
  }
}

export function renderizarBloques(bloques) {
  const contenedor = document.getElementById("contenedor-bloques");

  bloques.forEach(bloque => {
    let div;

    switch (bloque.tipo) {
      case 'tipo-led':
        div = renderizarLED(bloque);
        break;

      case 'tipo-selector-pasos':
        div = renderizarSelectorPasos(bloque);
        break;

      case 'tipo-barra-progreso':
        div = renderizarBarraProgreso(bloque);
        break;

      default:
        div = document.createElement("div");
        div.className = "bloque";
        div.innerHTML = `<div style="color: gray;">(Bloque ${bloque.tipo} no soportado aún)</div>`;
    }

    // Posición
    if (bloque.x && bloque.y) {
      div.style.transform = `translate(${bloque.x}px, ${bloque.y}px)`;
    }

    div.classList.add("bloque");
    contenedor.appendChild(div);
  });
}

function renderizarLED(bloque) {
  const div = document.createElement("div");

  const colorOn = bloque.colorOn || '#00ff00';
  const colorOff = oscurecerColor(colorOn, 0.2);

  div.innerHTML = `
    <div style="text-align: center; font-weight: bold; margin-bottom: 5px;">
      ${bloque.nombre || 'LED'}
    </div>
    <div class="led" style="background:${colorOff}; width: 30px; height: 30px; border-radius: 50%; margin:auto;"></div>
  `;

  const led = div.querySelector('.led');
  const topico = bloque.topicoPub;

  if (topico) {
    mqttClient.subscribe(topico);
    mqttClient.on('message', (topic, message) => {
      if (topic === topico) {
        const encendido = message.toString() === "1" || message.toString().toLowerCase() === "on";
        led.style.background = encendido ? colorOn : colorOff;
      }
    });
  }

  return div;
}

function renderizarSelectorPasos(bloque) {
  const div = document.createElement("div");

  div.innerHTML = `
    <div style="text-align:center; font-weight: bold;">${bloque.nombre || 'Selector'}</div>
    <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px; justify-content:center;">
      <button class="menos">−</button>
      <input type="number" value="${bloque.valor || 0}" readonly style="width: 60px; text-align: center;" />
      <button class="mas">+</button>
    </div>
  `;

  const paso = parseFloat(bloque.paso || 1);
  const input = div.querySelector("input");
  const btnMas = div.querySelector(".mas");
  const btnMenos = div.querySelector(".menos");
  const topico = bloque.topicoSub;

  btnMas.addEventListener("click", () => {
    const nuevoValor = parseFloat(input.value) + paso;
    input.value = nuevoValor;
    if (topico) mqttClient.publish(topico, nuevoValor.toString());
  });

  btnMenos.addEventListener("click", () => {
    const nuevoValor = parseFloat(input.value) - paso;
    input.value = nuevoValor;
    if (topico) mqttClient.publish(topico, nuevoValor.toString());
  });

  return div;
}

function renderizarBarraProgreso(bloque) {
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

function oscurecerColor(hex, factor = 0.5) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);
  return `rgb(${r}, ${g}, ${b})`;
}
