const mqtt = window.mqtt;
let clientMQTTalertas;
const estadoAlertas = {}; // Guarda estado actual por tópico

// ==============================================
// INICIALIZAR CONEXIÓN MQTT Y SUSCRIPCIONES
// ==============================================
export async function inicializarMQTTalertas() {
  const dispositivo = window.nombreProyecto; // ← dinámico
  const topicos = await obtenerTopicosDispositivo(dispositivo);
  conectarMQTTalertas(topicos);
}

// ==============================================
//  CONECTAR AL BROKER Y SUSCRIBIRSE A TÓPICOS
// ==============================================
function conectarMQTTalertas(topicos) {
  clientMQTTalertas = mqtt.connect("ws://localhost:9001");

  clientMQTTalertas.on("connect", () => {
    console.log("✅ Conectado al broker MQTT (alertas)");
    topicos.forEach(topico => clientMQTTalertas.subscribe(topico));
  });

  clientMQTTalertas.on("message", (topic, message) => {
    const valor = parseFloat(message.toString());
    actualizarValorEnPantalla(topic, valor);
  });

  clientMQTTalertas.on("error", (error) => {
    console.error("❌ Error en conexión MQTT (alertas):", error);
  });
}

// ==============================================
// ACTUALIZAR VALOR EN LA PANTALLA SEGÚN TÓPICO
// ==============================================
function actualizarValorEnPantalla(topico, valor) {
  const bloques = document.querySelectorAll(`[data-topico="${topico}"]`);
  bloques.forEach(bloque => {
    const spanValor = bloque.querySelector(".valor");
    if (spanValor) spanValor.textContent = valor;

    const modo = bloque.querySelector("select").value;

    if (!estadoAlertas[topico]) {
      estadoAlertas[topico] = {
        tipo: modo,
        estado: "normal",
        valorActual: valor,
        limites: { min: 0, max: 100 }
      };
    } else {
      estadoAlertas[topico].tipo = modo;
      estadoAlertas[topico].valorActual = valor;
    }

    // Evaluación visual según tipo de alerta
    if (modo === "prioritaria") {
      evaluarAlertaPrioritaria(topico, valor, bloque);
    } else if (modo === "personalizada") {
      const min = parseFloat(bloque.querySelector(".limite-min").value);
      const max = parseFloat(bloque.querySelector(".limite-max").value);
      estadoAlertas[topico].limites = { min, max };
      evaluarAlertaPersonalizada(valor, min, max, bloque);
    } else {
      bloque.style.border = "1px solid #ccc";
      bloque.style.backgroundColor = "white";
    }
  });
}

// ==============================================
//EVALUAR ALERTA PRIORITARIA (DESCONEXIÓN)
// ==============================================
function evaluarAlertaPrioritaria(topico, valor, bloque) {
  if (valor === 0 || valor >= 1023) {
    bloque.style.border = "2px solid red";
    bloque.style.backgroundColor = "#f8d7da";
  } else {
    bloque.style.border = "2px solid green";
    bloque.style.backgroundColor = "#d4edda";
  }
}

// ==============================================
// EVALUAR ALERTA PERSONALIZADA (LÍMITES MÍN/MAX)
// ==============================================
function evaluarAlertaPersonalizada(valor, min, max, bloque) {
  if (valor < min || valor > max) {
    bloque.style.border = "2px solid red";
    bloque.style.backgroundColor = "#f8d7da";
  } else {
    bloque.style.border = "2px solid green";
    bloque.style.backgroundColor = "#d4edda";
  }
}

// ==============================================
//OBTENER TÓPICOS PUBLICADOS POR EL DISPOSITIVO ACTUAL
// ==============================================
async function obtenerTopicosDispositivo(nombre) {
  const res = await fetch("/reg_json");
  const data = await res.json();
  return data[nombre]?.topics_pub || [];
}
