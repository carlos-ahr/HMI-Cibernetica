export function renderizarSlider(bloque, mqttClient) {
  const div = document.createElement('div');
  div.classList.add('bloque', 'tipo-slider');
  div.style.padding = '10px';
  div.style.margin = '10px';
  div.style.border = '1px solid #ccc';
  div.style.borderRadius = '8px';
  div.style.background = '#fff';
  div.style.width = '260px';

  const nombre = bloque.nombre || 'Slider';
  const valorInicial = bloque.valor || 0;
  const min = bloque.valorMin || 0;
  const max = bloque.valorMax || 255;
  const topico = bloque.topicoSub || '';
  const proyecto = window.nombreProyecto || 'default';

  // Etiqueta
  const etiqueta = document.createElement('div');
  etiqueta.className = 'etiqueta-topico';
  etiqueta.textContent = `${nombre} (${valorInicial})`;
  etiqueta.style.fontWeight = 'bold';
  etiqueta.style.marginBottom = '8px';

  // Slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min;
  slider.max = max;
  slider.value = valorInicial;
  slider.style.width = '100%';

  // Publicar y guardar valor
  let valorAnterior = valorInicial;
  let timeout = null;

  slider.addEventListener('input', () => {
    const valor = slider.value;
    etiqueta.textContent = `${nombre} (${valor})`;

    if (!mqttClient?.connected || !topico) return;
    if (valor === valorAnterior) return;
    valorAnterior = valor;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      mqttClient.publish(topico, valor.toString());
      console.log(`[VISUAL MQTT] Publicado → ${topico}: ${valor}`);

      // Usar ruta general con clave específica
      fetch(`/actualizar_bloque/${proyecto}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topico: topico,
          clave: 'valor',
          valor: valor
        })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.ok) {
          console.warn("[Guardar Slider] Error:", data.error);
        }
      })
      .catch(err => {
        console.error("[Guardar Slider] Fallo de red:", err);
      });

    }, 50);
  });

  div.appendChild(etiqueta);
  div.appendChild(slider);
  return div;
}
