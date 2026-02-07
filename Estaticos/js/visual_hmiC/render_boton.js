export function renderizarBoton(bloque, mqttClient) {
  const div = document.createElement("div");

  div.innerHTML = `
    <div style="text-align: center; font-weight: bold; margin-bottom: 5px;">
      ${bloque.nombre || 'Botón'}
    </div>
    <button class="boton-toggle" style="padding: 10px 20px; font-size: 16px;">OFF</button>
  `;

  const boton = div.querySelector(".boton-toggle");
  const topico = bloque.topicoSub;

  let estadoActual = bloque.estado === true;  // por defecto el botón arranca como 'false'

  // Establecer estado inicial visual
  actualizarEstiloBoton(boton, estadoActual);

  // Escuchar click en el botón
  boton.addEventListener("click", () => {
    estadoActual = !estadoActual;
    actualizarEstiloBoton(boton, estadoActual);

    if (topico) {
      const mensaje = estadoActual ? "ON" : "OFF";
      mqttClient.publish(topico, mensaje);
    }
  });

  return div;
}

function actualizarEstiloBoton(boton, estado) {
  if (estado) {
    boton.textContent = "ON";
    boton.style.backgroundColor = "#4caf50";
    boton.style.color = "white";
  } else {
    boton.textContent = "OFF";
    boton.style.backgroundColor = "#ccc";
    boton.style.color = "black";
  }
}
