// alertas_control.js

function evaluarAlertaPrioritaria(topico, valor, bloque) {
  let estado = "normal";

  // Criterios básicos que puedes ajustar según el sensor:
  if (isNaN(valor)) {
    estado = "desconectado";
  } else if (valor < 0 || valor > 10000 || Math.abs(valor - estadoAlertas[topico].valorActual) > 100) {
    estado = "inestable";
  }

  actualizarVisualAlerta(bloque, estado);
  estadoAlertas[topico].estado = estado;

  // Registrar si es necesario
  if (estado === "desconectado" || estado === "inestable") {
    registrarAlerta(topico, valor, "prioritaria", estado);
  }
}

function evaluarAlertaPersonalizada(topico, valor, min, max, bloque) {
  let estado = "normal";

  if (isNaN(valor)) {
    estado = "desconectado";
  } else if (valor < min || valor > max) {
    estado = "advertencia";
  }

  actualizarVisualAlerta(bloque, estado);
  estadoAlertas[topico].estado = estado;

  if (estado === "advertencia") {
    registrarAlerta(topico, valor, "personalizada", estado);
  }
}

function actualizarVisualAlerta(bloque, estado) {
  bloque.classList.remove("estado-verde", "estado-rojo", "estado-amarillo");

  switch (estado) {
    case "normal":
      bloque.classList.add("estado-verde");
      break;
    case "inestable":
      bloque.classList.add("estado-amarillo");
      break;
    case "desconectado":
    case "advertencia":
      bloque.classList.add("estado-rojo");
      break;
  }
}
