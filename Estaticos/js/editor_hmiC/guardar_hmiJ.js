export function guardarHMI(nombreDispositivo) {
  const bloques = [];

  document.querySelectorAll('.bloque').forEach(bloque => {
    const tipo = Array.from(bloque.classList).find(cl => cl.startsWith('tipo-'));

    const data = {
      tipo,
      x: bloque.dataset.x || 0,
      y: bloque.dataset.y || 0,
    };

    const nombre = bloque.getAttribute('data-nombre-visible') 
                || bloque.querySelector('.nombre-objeto')?.value 
                || bloque.querySelector('.etiqueta-topico')?.textContent;
    if (nombre) data.nombre = nombre.trim();

    switch (tipo) {
      case 'tipo-slider': {
        const slider = bloque.querySelector('input[type="range"]');
        data.topicoSub = bloque.getAttribute('data-topico-sub') || null;
        data.valor = slider?.value || "0";
        data.valorMin = slider?.min || "0";
        data.valorMax = slider?.max || "255";
        data.nombreVisible = bloque._nombreVisible || '';
        break;
      }
      case 'tipo-led': {
        data.topicoPub = bloque.getAttribute('data-topico-pub') || null;
        data.colorOn = bloque.dataset.colorOn || '#00ff00';
        break;
      }
      case 'tipo-selector-numerico': {
        const input = bloque.querySelector('.input-numerico');
        data.topicoSub = bloque.getAttribute('data-topico-sub') || null;
        data.valor = input?.value || "0";
        data.nombreVisible = bloque.getAttribute('data-nombre-visible') || 'Selector numérico';
        break;
      }
      case 'tipo-selector-pasos': {
        data.topicoSub = bloque.getAttribute('data-topico-sub') || null;
        data.valor = bloque.querySelector('.valor-pasos')?.value || "0";
        data.paso = bloque.getAttribute('data-paso') || "1";
        break;
      }
      case 'tipo-boton': {
        data.topicoSub = bloque.getAttribute('data-topico-sub') || null;
        const estado = bloque.getAttribute('data-estado');
        data.estado = estado === 'true';
        break;
      }
      case 'tipo-texto-enviar': {
        data.topicoSub = bloque.getAttribute('data-topico-sub') || null;
        const texto = bloque.querySelector('.input-texto')?.value;
        data.valor = texto || "";
        break;
      }
      case 'tipo-barra-progreso': {
        data.topicoPub = bloque.getAttribute('data-topico-pub') || null;
        data.color = bloque.getAttribute('data-color') || "#2196f3";
        data.min = bloque.getAttribute('data-min') || "0";
        data.max = bloque.getAttribute('data-max') || "100";
        break;
      }
      case 'tipo-gauge':{
        data.topicoPub = bloque.getAttribute('data-topico-pub') || null;
        data.min = bloque.getAttribute('data-min') || "0";
        data.max = bloque.getAttribute('data-max') || "100";
        break;
      }
      case 'tipo-rotatorio': {
        data.topicoPub = bloque.getAttribute('data-topico-pub') || null;
        data.max = bloque.getAttribute('data-max') || "100";

        // Guardar el valor actual mostrado si existe (opcional)
        if (bloque._rotatorio) {
          data.valor = bloque._rotatorio.valor || "0";
        }

        break;
      }
      case 'tipo-termometro': {
        data.topicoPub = bloque.getAttribute('data-topico-pub') || null;
        data.min = bloque.getAttribute('data-min') || "0";
        data.max = bloque.getAttribute('data-max') || "100";
        break;
      }
      case 'tipo-fuzzy': {
        data.topicoPub = bloque.getAttribute('data-topico-pub') || null;
        data.rango = bloque.getAttribute('data-rango') || "100";
        break;
      }
      case 'tipo-grafica': {
        const nombre = bloque.querySelector('.etiqueta-topico')?.textContent || 'Gráfica';
        data.nombre = nombre.trim();
        data.senales = bloque._senales ? [...bloque._senales] : [];
        break;
      }
    }

    bloques.push(data);
  });

  // Guardar el JSON del HMI
  fetch(`/guardar_hmi_json/${nombreDispositivo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bloques })
  })
    .then(res => res.json())
    .then(data => {
      if (data.guardado) {
        alert("HMI guardado exitosamente.");
        window.location.href = `/proyecto/${nombreDispositivo}/visual`;
      } else {
        alert("Error al guardar HMI.");
        console.error(data.error);
      }
    })
    .catch(err => {
      alert("Error en la operación.");
      console.error(err);
    });
}
