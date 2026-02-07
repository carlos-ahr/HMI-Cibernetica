export function cargarTopicosEnSelect(bloque, tipo, selectDirecto = null, callbackFinal = null) {
  if (!window.nombreDispositivo) {
    console.warn("nombreDispositivo no definido");
    return;
  }

  fetch(`/topicos_dispositivo/${window.nombreDispositivo}`)
    .then(res => res.json())
    .then(data => {
      const select = selectDirecto || bloque.querySelector(`.select-topico-${tipo}`);
      if (!select) return;

      const lista = tipo === "sub" ? data.topics_sub : data.topics_pub;
      select.innerHTML = `<option value="">Selecciona un tópico</option>`;

      lista.forEach(topico => {
        const option = document.createElement('option');
        option.value = topico;
        option.textContent = topico;
        select.appendChild(option);
      });

      //  Agregamos el listener antes de restaurar
      select.addEventListener('change', () => {
        if (bloque instanceof HTMLElement) {
          bloque.setAttribute(`data-topico-${tipo}`, select.value);
        }

        const etiqueta = bloque.querySelector?.('.etiqueta-topico');
        const ultimaParte = select.value.split('/').pop();

        if (bloque.classList?.contains('tipo-slider')) {
          const variable = bloque.querySelector('.variable')?.value?.trim();
          etiqueta.textContent = variable ? `${ultimaParte} - ${variable}` : ultimaParte;
        } else if (bloque.classList?.contains('tipo-alarma')) {
          const nombre = bloque.querySelector('.nombre-objeto')?.value?.trim();
          etiqueta.textContent = nombre || 'Alarma';

          if (!window._bloquesAlarmas) window._bloquesAlarmas = [];
          const existente = window._bloquesAlarmas.find(b => b.bloque === bloque);
          if (existente) {
            existente.topico = select.value;
          } else {
            const estadoDiv = bloque.querySelector('.alarma-estado');
            window._bloquesAlarmas.push({ bloque, estadoDiv, topico: select.value });
          }

          if (window.mqttClient) window.mqttClient.subscribe(select.value);
        } else if (etiqueta) {
          etiqueta.textContent = ultimaParte;
        }

        if (tipo === "pub") window.mqttClient?.subscribe(select.value);
      });

      // ✅ Restauramos el valor guardado y disparamos el evento
      const valorGuardado = bloque.getAttribute(`data-topico-${tipo}`);
      if (valorGuardado) {
        select.value = valorGuardado;
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      }

      //  Callback final opcional
      if (typeof callbackFinal === 'function') {
        callbackFinal(select);
      }
    })
    .catch(error => console.error("Error al cargar tópicos:", error));
}
