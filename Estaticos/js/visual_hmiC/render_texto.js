export function renderizarTextoEnviar(bloque, mqttClient) {
  const div = document.createElement('div');
  div.classList.add('bloque', 'tipo-texto-enviar');

  const nombre = bloque.nombre || 'Texto a enviar';
  const topico = bloque.topicoSub || '';
  const valorInicial = bloque.valor || '';
  const proyecto = window.nombreProyecto || 'default';

  div.innerHTML = `
    <div class="etiqueta-topico">${nombre}</div>
    <input type="text" class="input-texto" maxlength="50" value="${valorInicial}" 
      style="width: 80%; padding: 8px; margin: 5px 0;">
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

  const input = div.querySelector('.input-texto');
  const boton = div.querySelector('.boton-enviar');

  boton.addEventListener('click', () => {
    const mensaje = input.value.trim();
    if (!mensaje || !topico || !mqttClient?.connected) return;

    mqttClient.publish(topico, mensaje);
    console.log(`[VISUAL MQTT] Publicado → ${topico}: ${mensaje}`);

    // Actualizar valor en el JSON del proyecto
    fetch(`/actualizar_bloque/${proyecto}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topico, clave: 'valor', valor: mensaje })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        console.warn('[Guardar Texto] Error:', data.error);
      }
    });
  });

  return div;
}
