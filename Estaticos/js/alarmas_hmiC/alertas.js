// ─────────────────────────────────────────────
// INICIALIZA BLOQUES DE ALERTA PARA EL DISPOSITIVO ACTUAL
// ─────────────────────────────────────────────
export async function inicializarBloquesAlerta() {
  const dispositivo = window.nombreProyecto;

  if (!dispositivo) {
    console.error("⚠ No se detectó el nombre del dispositivo (window.nombreProyecto)");
    return;
  }

  const contenedor = document.getElementById("contenedor-prioritaria");
  contenedor.innerHTML = "";

  const topicos = await obtenerTopicosDelDispositivo(dispositivo);

  for (const topico of topicos) {
    crearBloqueAlerta(dispositivo, topico);
  }

  await cargarConfiguracionDesdeServidor(dispositivo); // ← NUEVO
  aplicarConfiguracionPrevia(dispositivo);

  inicializarBotonGuardar(dispositivo);
}

// ─────────────────────────────────────────────
// OBTIENE TÓPICOS DEL DISPOSITIVO ACTUAL
// ─────────────────────────────────────────────
async function obtenerTopicosDelDispositivo(nombre) {
  const res = await fetch("/reg_json");
  const data = await res.json();
  return data[nombre]?.topics_pub || [];
}

// ─────────────────────────────────────────────
// CREA BLOQUE DE ALERTA PARA UN TÓPICO
// ─────────────────────────────────────────────
function crearBloqueAlerta(dispositivo, topico) {
  const contenedor = document.getElementById("contenedor-prioritaria");

  const bloque = document.createElement("div");
  bloque.className = "bloque-alerta";
  bloque.setAttribute("data-topico", topico);
  bloque.setAttribute("data-dispositivo", dispositivo);

  bloque.innerHTML = `
    <h4>${dispositivo} — ${topico}</h4>
    <p>Valor actual: <span class="valor">---</span></p>
    <select class="modo-alerta">
      <option value="ninguna">Sin alerta</option>
      <option value="prioritaria">Alerta Prioritaria</option>
      <option value="personalizada">Alerta Personalizada</option>
    </select>
    <div class="config-personalizada" style="display: none;">
      Límite mín: <input type="number" class="limite-min"><br>
      Límite máx: <input type="number" class="limite-max">
    </div>
  `;

  contenedor.appendChild(bloque);

  const selector = bloque.querySelector(".modo-alerta");
  const configDiv = bloque.querySelector(".config-personalizada");

  selector.addEventListener("change", () => {
    configDiv.style.display = selector.value === "personalizada" ? "block" : "none";
  });
}

// ─────────────────────────────────────────────
// CARGA CONFIGURACIÓN DESDE EL BACKEND (JSON)
// ─────────────────────────────────────────────
async function cargarConfiguracionDesdeServidor(dispositivo) {
  try {
    const res = await fetch(`/proyecto/${dispositivo}/config_alertas`);
    if (!res.ok) throw new Error("Respuesta no válida del servidor");
    const config = await res.json();

    window.configAlertaCargada = {
      [dispositivo]: config
    };

  } catch (error) {
    console.warn("⚠ No se pudo cargar la configuración previa:", error);
    window.configAlertaCargada = {};
  }
}

// ─────────────────────────────────────────────
// APLICA CONFIGURACIÓN PREVIA (si existe)
// ─────────────────────────────────────────────
function aplicarConfiguracionPrevia(dispositivo) {
  const config = window.configAlertaCargada?.[dispositivo];
  if (!config) return;

  const alertasPers = config.alertas_personalizadas || {};
  const alertasPrio = config.alertas_prioritarias || [];

  for (const topico in alertasPers) {
    const bloque = document.querySelector(
      `.bloque-alerta[data-dispositivo="${dispositivo}"][data-topico="${topico}"]`
    );
    if (bloque) {
      const selector = bloque.querySelector(".modo-alerta");
      const inputMin = bloque.querySelector(".limite-min");
      const inputMax = bloque.querySelector(".limite-max");

      selector.value = "personalizada";
      selector.dispatchEvent(new Event("change"));
      inputMin.value = alertasPers[topico]["límite mínimo"];
      inputMax.value = alertasPers[topico]["límite máximo"];
    }
  }

  for (const topico of alertasPrio) {
    const bloque = document.querySelector(
      `.bloque-alerta[data-dispositivo="${dispositivo}"][data-topico="${topico}"]`
    );
    if (bloque) {
      const selector = bloque.querySelector(".modo-alerta");
      selector.value = "prioritaria";
      selector.dispatchEvent(new Event("change"));
    }
  }
}

// ─────────────────────────────────────────────
// BOTÓN DE GUARDAR CONFIGURACIÓN
// ─────────────────────────────────────────────
function inicializarBotonGuardar(dispositivo) {
  let botonGuardar = document.getElementById("guardar-configuracion");

  if (!botonGuardar) {
    botonGuardar = document.createElement("button");
    botonGuardar.id = "guardar-configuracion";
    botonGuardar.textContent = "Guardar Configuración";
    botonGuardar.classList.add("btn-guardar-config");
    document.getElementById("contenedor-prioritaria").appendChild(botonGuardar);
  }

  // Evitar múltiples listeners
  botonGuardar.replaceWith(botonGuardar.cloneNode(true));
  botonGuardar = document.getElementById("guardar-configuracion");

  botonGuardar.addEventListener("click", () => guardarConfiguracionEnJSON(dispositivo));
}

// ─────────────────────────────────────────────
// GUARDA CONFIGURACIÓN DEL DISPOSITIVO ACTUAL
// ─────────────────────────────────────────────
async function guardarConfiguracionEnJSON(dispositivo) {
  const bloques = document.querySelectorAll(
    `.bloque-alerta[data-dispositivo="${dispositivo}"]`
  );

  const resultado = {
    [dispositivo]: {
      alertas_prioritarias: [],
      alertas_personalizadas: {}
    }
  };

  bloques.forEach(bloque => {
    const topico = bloque.getAttribute("data-topico");
    const modo = bloque.querySelector(".modo-alerta").value;
    const min = bloque.querySelector(".limite-min")?.value;
    const max = bloque.querySelector(".limite-max")?.value;

    if (modo === "prioritaria") {
      resultado[dispositivo].alertas_prioritarias.push(topico);
    }

    if (modo === "personalizada") {
      resultado[dispositivo].alertas_personalizadas[topico] = {
        "límite mínimo": parseFloat(min),
        "límite máximo": parseFloat(max)
      };
    }
  });

  try {
    const res = await fetch("/guardar_json_alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultado)
    });

    const data = await res.json();
    alert(data.status === "ok" ? "✔ Configuración guardada." : "❌ Error al guardar.");
  } catch (err) {
    console.error("Error al guardar configuración:", err);
    alert("❌ Falló la conexión al guardar.");
  }
}
