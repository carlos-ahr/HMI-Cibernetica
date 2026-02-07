document.addEventListener("DOMContentLoaded", () => {
  cargarProyectos();
});

function cargarProyectos() {
  fetch("/listar_proyectos")
    .then(res => res.json())
    .then(data => {
      const contenedor = document.getElementById("lista-proyectos");
      const sinProyectos = contenedor.querySelector(".sin-proyectos");

      if (data.proyectos.length > 0) {
        sinProyectos.style.display = "none";

        data.proyectos.forEach(nombre => {
          const div = document.createElement("div");
          div.classList.add("proyecto");

          div.innerHTML = `
            <span>${nombre}</span>
            <div class="controles">
              <button class="abrir" onclick="abrirProyecto('${nombre}')">Abrir</button>
              <button class="eliminar" onclick="eliminarProyecto('${nombre}')">Eliminar</button>
            </div>
          `;

          contenedor.appendChild(div);
        });
      }
    })
    .catch(err => {
      console.error("Error cargando proyectos:", err);
    });
}

function abrirProyecto(nombre) {
  window.location.href = `/proyecto/${nombre}/menu`;
}


function eliminarProyecto(nombre) {
  if (confirm(`¿Estás seguro de eliminar el proyecto "${nombre}"?`)) {
    fetch(`/eliminar_proyecto/${nombre}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        if (data.exito) {
          alert("Proyecto eliminado exitosamente.");
          window.location.reload();
        } else {
          alert("Error al eliminar el proyecto.");
        }
      })
      .catch(err => {
        console.error("Error al eliminar:", err);
      });
  }
}

function crearProyecto() {
  window.location.href = "/crear_proyecto";
}
