// registro_alertas.js

function registrarAlerta(topico, valor, tipo, estado) {
  const alerta = estadoAlertas[topico];

  // Evitar registrar la misma alerta repetida continuamente
  if (alerta.ultimaAlerta === estado) return;

  // Marcar nueva alerta como la última registrada
  estadoAlertas[topico].ultimaAlerta = estado;

  const payload = {
    topico: topico,
    valor: valor,
    tipo: tipo,
    descripcion: estado,
    hora: new Date().toISOString()
  };

  fetch("/registrar_alerta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).then(res => {
    if (res.ok) {
      console.log(`Alerta registrada: ${topico} → ${estado}`);
    } else {
      console.warn(`️ Falló el registro de alerta para ${topico}`);
    }
  }).catch(err => {
    console.error("Error al registrar alerta:", err);
  });
}
