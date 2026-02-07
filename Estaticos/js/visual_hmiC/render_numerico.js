export function renderizarSelectorNumerico(bloque, mqttClient) {
  const div = document.createElement('div');
  div.classList.add('bloque', 'tipo-selector-numerico');

  const nombre = bloque.nombre || 'Selector numérico';
  const topico = bloque.topicoSub || '';
  const valorInicial = bloque.valor || '';
  const proyecto = window.nombreProyecto || 'default';

  div.innerHTML = `
    <div class="etiqueta-topico">${nombre} (${valorInicial})</div>
    <input type="number" class="input-numerico" step="0.01" value="${valorInicial}" style="width: 100px; margin: 5px 0;">
     <button class="boton-enviar" style="
      background-color: #007BFF;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      padding: 10px 18px;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s, transform 0.1s;">
      Enviar
    </button>
  `;

  const input = div.querySelector('.input-numerico');
  const boton = div.querySelector('.boton-enviar');
  const etiqueta = div.querySelector('.etiqueta-topico');

  boton.addEventListener('click', () => {
    const valor = input.value.trim();
    if (!valor || !topico || !mqttClient?.connected) return;

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) return;

    mqttClient.publish(topico, valorNumerico.toString());
    console.log(`[VISUAL MQTT] Publicado → ${topico}: ${valorNumerico}`);
    etiqueta.textContent = `${nombre} (${valorNumerico})`;

    // Actualizar JSON del proyecto
    fetch(`/actualizar_bloque/${proyecto}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topico, clave: 'valor', valor: valorNumerico })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        console.warn('[Guardar Selector Numérico] Error:', data.error);
      }
    });
  });

  return div;
}
