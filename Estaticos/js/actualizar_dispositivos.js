// archivo: actualizar_estados.js

function actualizarEstadosDispositivos() {
    fetch('/estado_dispositivos')
        .then(response => response.json())
        .then(estados => {
            for (const [nombre, estado] of Object.entries(estados)) {
                const celdaEstado = document.getElementById(`estado-${nombre}`);
                if (celdaEstado) {
                    celdaEstado.textContent = estado;
                    celdaEstado.style.color = (estado === "Conectado") ? "green" : "red";
                    celdaEstado.style.fontWeight = "bold";
                }
            }
        })
        .catch(error => {
            console.error("Error al actualizar estados:", error);
        });
}

// Ejecutar cada 5 segundos
setInterval(actualizarEstadosDispositivos, 5000);
