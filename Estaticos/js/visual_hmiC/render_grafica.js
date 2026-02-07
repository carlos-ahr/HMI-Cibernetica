export function renderizarGrafica(bloque, mqttClient) {
  const div = document.createElement("div");
  div.classList.add("bloque", "tipo-grafica");

  // Estilo del bloque contenedor
  div.style.width = "100%";
  div.style.maxWidth = "800px";
  div.style.background = "#fff";
  div.style.border = "1px solid #ccc";
  div.style.borderRadius = "10px";
  div.style.padding = "20px";
  div.style.margin = "20px auto";
  div.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.1)";

  const nombre = bloque.nombre || "Gráfica";
  const señales = bloque.senales || [];

  // Título
  const titulo = document.createElement("div");
  titulo.style.fontWeight = "bold";
  titulo.style.textAlign = "center";
  titulo.style.fontSize = "18px";
  titulo.style.marginBottom = "15px";
  titulo.textContent = nombre;

  // Contenedor fijo para evitar que el canvas se colapse
  const contenedorCanvas = document.createElement("div");
  contenedorCanvas.style.width = "100%";
  contenedorCanvas.style.height = "400px";
  contenedorCanvas.style.position = "relative";

  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  contenedorCanvas.appendChild(canvas);
  div.appendChild(titulo);
  div.appendChild(contenedorCanvas);

  const ctx = canvas.getContext("2d");

  const datasets = señales.map(senal => ({
    label: senal.nombre || "Señal",
    borderColor: senal.color || "#000",
    backgroundColor: "transparent",
    data: [],
    tension: 0.3
  }));

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "top",
          labels: { boxWidth: 12 }
        }
      },
      scales: {
        x: {
          display: true,
          ticks: { color: "#666" },
          grid: { color: "#eee" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#666" },
          grid: { color: "#eee" }
        }
      }
    }
  });

  const maxPuntos = 20;

  señales.forEach((senal, index) => {
    if (!senal.topico) return;

    mqttClient.subscribe(senal.topico);

    mqttClient.on("message", (topic, message) => {
      if (topic === senal.topico) {
        const valor = parseFloat(message.toString());
        if (!isNaN(valor)) {
          const dataset = chart.data.datasets[index];
          dataset.data.push(valor);
          if (dataset.data.length > maxPuntos) dataset.data.shift();

          chart.data.labels.push("");
          if (chart.data.labels.length > maxPuntos) chart.data.labels.shift();

          chart.update();
        }
      }
    });
  });

  return div;
}
