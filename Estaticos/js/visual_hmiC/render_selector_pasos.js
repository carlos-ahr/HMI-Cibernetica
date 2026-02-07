export function renderizarSelectorPasos(bloque, mqttClient) {
  const div = document.createElement('div');
  div.classList.add('bloque', 'tipo-selector-pasos');
  div.style.padding = '10px';
  div.style.margin = '10px';
  div.style.border = '1px solid #ccc';
  div.style.borderRadius = '8px';
  div.style.background = '#fff';
  div.style.width = '260px';
  div.style.textAlign = 'center';

  const nombre = bloque.nombre || 'Selector';
  const proyecto = window.nombreProyecto || 'default';
  const topico = bloque.topicoSub || '';
  const paso = parseFloat(bloque.paso || 1);
  let valorActual = parseFloat(bloque.valor || 0);
  let timeout = null;

  // Etiqueta
  const etiqueta = document.createElement('div');
  etiqueta.className = 'etiqueta-topico';
  etiqueta.textContent = `${nombre} (${valorActual})`;
  etiqueta.style.fontWeight = 'bold';
  etiqueta.style.marginBottom = '8px';

  // Botones y valor
  const contenedor = document.createElement('div');
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'center';
  contenedor.style.justifyContent = 'center';
  contenedor.style.gap = '10px';

  const btnMenos = document.createElement('button');
  btnMenos.textContent = '−';
  btnMenos.className = 'menos';
  btnMenos.style.padding = '6px 12px';

  const input = document.createElement('input');
  input.type = 'number';
  input.value = valorActual;
  input.readOnly = true;
  input.style.width = '60px';
  input.style.textAlign = 'center';

  const btnMas = document.createElement('button');
  btnMas.textContent = '+';
  btnMas.className = 'mas';
  btnMas.style.padding = '6px 12px';

  contenedor.appendChild(btnMenos);
  contenedor.appendChild(input);
  contenedor.appendChild(btnMas);

  function actualizarValor(nuevoValor) {
    valorActual = nuevoValor;
    input.value = valorActual;
    etiqueta.textContent = `${nombre} (${valorActual})`;

    if (!mqttClient?.connected || !topico) return;

    mqttClient.publish(topico, valorActual.toString());
    console.log(`[VISUAL MQTT] Publicado → ${topico}: ${valorActual}`);

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      fetch(`/actualizar_bloque/${proyecto}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topico: topico,
          clave: 'valor',
          valor: valorActual
        })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.ok) {
          console.warn("[Guardar Selector] Error:", data.error);
        }
      })
      .catch(err => {
        console.error("[Guardar Selector] Fallo de red:", err);
      });
    }, 50);
  }

  btnMas.addEventListener('click', () => {
    actualizarValor(valorActual + paso);
  });

  btnMenos.addEventListener('click', () => {
    actualizarValor(valorActual - paso);
  });

  div.appendChild(etiqueta);
  div.appendChild(contenedor);
  return div;
}
