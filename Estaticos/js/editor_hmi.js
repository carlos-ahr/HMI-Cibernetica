const mqttClient = mqtt.connect('ws://localhost:9001');
const valoresParciales = {};  // { tópico: { variable: valor } }

mqttClient.on('connect', () => {
  console.log("MQTT conectado");
});

mqttClient.on('message', (topic, message) => {
  const valor = message.toString();
  const numero = parseFloat(valor);
  console.log(`[MQTT] Mensaje recibido: ${topic} → ${valor}`);

  // LEDS
  document.querySelectorAll('.tipo-led').forEach(bloque => {
    const topico = bloque.getAttribute('data-topico-pub');
    const led = bloque.querySelector('.led');
    if (topic === topico && led) {
      led.style.background = (valor === "1" || valor.toLowerCase() === "true") ? "limegreen" : "#333";
    }
  });

  // GRÁFICAS
  document.querySelectorAll('.tipo-grafica').forEach(bloque => {
    const grafica = bloque._grafica;
    const dataset = bloque._datasets[topic];

    if (grafica && dataset) {
      const tiempo = new Date().toLocaleTimeString().slice(0, 8);
      if (dataset.data.length >= 60) dataset.data.shift();
      if (grafica.data.labels.length >= 60) grafica.data.labels.shift();

      dataset.data.push(numero);
      grafica.data.labels.push(tiempo);
      grafica.update();

      const span = bloque._ultimosValores?.[topic];
      if (span) span.textContent = `(${numero})`;
    }
  });

  // ALARMAS
  if (window._bloquesAlarmas) {
    window._bloquesAlarmas.forEach(({ bloque, estadoDiv, topico }) => {
      if (topic === topico) {
        const valorNum = parseFloat(valor);
        estadoDiv.textContent = `Valor: ${valorNum}`;

        if (isNaN(valorNum)) {
          estadoDiv.style.background = '#ccc';
          estadoDiv.textContent = 'Valor inválido';
          return;
        }

        if (valorNum === 0 || valorNum >= 1023) {
          estadoDiv.style.background = '#ff4d4d';  // Rojo (desconectado)
          estadoDiv.textContent = 'Desconectado';
        } else {
          // Historial para inestabilidad
          if (!bloque._historial) bloque._historial = [];
          bloque._historial.push(valorNum);
          if (bloque._historial.length > 10) bloque._historial.shift();

          const max = Math.max(...bloque._historial);
          const min = Math.min(...bloque._historial);
          const variacion = max - min;

          if (variacion > 100) {
            estadoDiv.style.background = '#ffc107';  // Amarillo
            estadoDiv.textContent = 'Sensor inestable';
          } else {
            estadoDiv.style.background = '#c8e6c9';  // Verde claro
            estadoDiv.textContent = `Valor: ${valorNum}`;
          }
        }
      }
    });
  }
  
  
  
});

function agregarSlider() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-slider';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Sin nombre (0)</div>
    <input type="range" min="0" max="255" value="0" class="slider">
    <div class="slider-config">
      <label>Nombre visible:</label>
      <input type="text" class="nombre-objeto" placeholder="Ej. Rojo">
      
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-sub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "sub");

  const slider = bloque.querySelector('.slider');
  const etiqueta = bloque.querySelector('.etiqueta-topico');
  const nombreInput = bloque.querySelector('.nombre-objeto');

  // Función para actualizar el texto del nombre + valor
  const actualizarEtiqueta = () => {
    const topic = bloque.getAttribute('data-topico-sub') || '';
    const ultimaParte = topic.split('/').pop();
    const nombre = nombreInput.value.trim();
    const valor = slider.value;
    etiqueta.textContent = `${nombre || ultimaParte} (${valor})`;
  };

  nombreInput.addEventListener('input', actualizarEtiqueta);
  slider.addEventListener('input', () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const valor = parseInt(slider.value);
    actualizarEtiqueta();

    if (!mqttClient.connected || !topico) return;

    // Evitar saturación de mensajes
    if (bloque._timeout) clearTimeout(bloque._timeout);
    bloque._timeout = setTimeout(() => {
      mqttClient.publish(topico, valor.toString());
      console.log(`[PUBLICADO] ${topico} → ${valor}`);
    },850);
  });
}

function agregarLED() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-led';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Sin tópico</div>
    <div class="led off"></div>
    <div class="slider-config">
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-pub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "pub");
}

function cargarTopicosEnSelect(bloque, tipo) {
  if (!window.nombreDispositivo) {
    console.warn("nombreDispositivo no definido");
    return;
  }

  fetch(`/topicos_dispositivo/${window.nombreDispositivo}`)
    .then(res => res.json())
    .then(data => {
      const select = bloque.querySelector(`.select-topico-${tipo}`);
      if (!select) return;

      const lista = tipo === "sub" ? data.topics_sub : data.topics_pub;
      select.innerHTML = `<option value="">Selecciona un tópico</option>`;

      lista.forEach(topico => {
        const option = document.createElement('option');
        option.value = topico;
        option.textContent = topico;
        select.appendChild(option);
      });

      select.addEventListener('change', () => {
        bloque.setAttribute(`data-topico-${tipo}`, select.value);
        const etiqueta = bloque.querySelector('.etiqueta-topico');
        const ultimaParte = select.value.split('/').pop();

        if (bloque.classList.contains('tipo-slider')) {
          const variable = bloque.querySelector('.variable')?.value?.trim();
          etiqueta.textContent = variable ? `${ultimaParte} - ${variable}` : ultimaParte;

        } else if (bloque.classList.contains('tipo-alarma')) {
          const nombre = bloque.querySelector('.nombre-objeto')?.value?.trim();
          etiqueta.textContent = nombre || 'Alarma';

          // Registrar o actualizar en _bloquesAlarmas
          if (!window._bloquesAlarmas) window._bloquesAlarmas = [];

          const existente = window._bloquesAlarmas.find(b => b.bloque === bloque);
          if (existente) {
            existente.topico = select.value;
          } else {
            const estadoDiv = bloque.querySelector('.alarma-estado');
            window._bloquesAlarmas.push({ bloque, estadoDiv, topico: select.value });
          }

          if (mqttClient) mqttClient.subscribe(select.value);

        } else {
          etiqueta.textContent = ultimaParte;
        }

        if (tipo === "pub") mqttClient.subscribe(select.value);
      });
    })
    .catch(error => console.error("Error al cargar tópicos:", error));
}

function agregarGrafica() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-grafica';
  bloque.style.padding = '20px';
  bloque.style.margin = '20px 0';
  bloque.style.border = '1px solid #ccc';
  bloque.style.borderRadius = '10px';
  bloque.style.background = '#fff';
  bloque.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
  bloque.style.width = '100%';

  const idCanvas = `grafica_${Date.now()}`;
  const colores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#8BC34A', '#F44336', '#3F51B5'];

  bloque.innerHTML = `
    <div class="etiqueta-topico" style="font-weight:bold; font-size:18px; margin-bottom:10px;">Gráfica</div>
    <div style="width: 100%; min-width: 700px; height: 450px;">
      <canvas id="${idCanvas}" style="width: 100%; height: 100%;"></canvas>
    </div>
    <div class="señales-contenedor" style="margin-top: 15px;"></div>
    <button class="agregar-senal" style="margin-top:10px;">+ Agregar señal</button>
    <div class="slider-config" style="margin-top: 15px;">
      <label>Nombre de la gráfica:</label>
      <input type="text" class="nombre-objeto" placeholder="Ej. Sensor Temp">
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);

  const ctx = bloque.querySelector(`#${idCanvas}`).getContext('2d');
  const datos = {
    labels: [],
    datasets: []
  };

  const grafica = new Chart(ctx, {
    type: 'line',
    data: datos,
    options: {
      responsive: true,
      animation: false,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: true,
          ticks: { color: '#333', maxRotation: 45 },
          grid: { color: '#eee' }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { color: '#333' },
          grid: { color: '#eee' }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#333' }
        }
      }
    }
  });

  bloque._grafica = grafica;
  bloque._datasets = {};
  bloque._ultimosValores = {};

  const contenedorSenales = bloque.querySelector('.señales-contenedor');
  const botonAgregar = bloque.querySelector('.agregar-senal');

  const nombreInput = bloque.querySelector('.nombre-objeto');
  nombreInput.addEventListener('input', () => {
    const nuevo = nombreInput.value.trim();
    const etiqueta = bloque.querySelector('.etiqueta-topico');
    if (nuevo) etiqueta.textContent = nuevo;
  });

  botonAgregar.addEventListener('click', () => {
    const senalDiv = document.createElement('div');
    senalDiv.className = 'senal';
    senalDiv.style.marginBottom = '10px';

    const selectColor = document.createElement('select');
    colores.forEach(color => {
      const op = document.createElement('option');
      op.value = color;
      op.textContent = color;
      op.style.background = color;
      selectColor.appendChild(op);
    });

    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.placeholder = 'Nombre de señal';

    const spanValor = document.createElement('span');
    spanValor.style.marginLeft = '10px';
    spanValor.style.fontWeight = 'bold';
    spanValor.textContent = "(--)";
    
    const selectTopico = document.createElement('select');
    selectTopico.className = 'select-topico-pub';

    let topicoAnterior = null;

    fetch(`/topicos_dispositivo/${window.nombreDispositivo}`)
      .then(res => res.json())
      .then(data => {
        const lista = data.topics_pub || [];
        selectTopico.innerHTML = `<option value="">Selecciona un tópico</option>`;
        lista.forEach(topico => {
          const opt = document.createElement('option');
          opt.value = topico;
          opt.textContent = topico;
          selectTopico.appendChild(opt);
        });
      });

    selectTopico.addEventListener('change', () => {
      const nuevoTopico = selectTopico.value;
      const nombre = inputNombre.value.trim() || nuevoTopico;
      const color = selectColor.value;

      if (topicoAnterior && bloque._datasets[topicoAnterior]) {
        const idx = grafica.data.datasets.findIndex(ds => ds.label === bloque._datasets[topicoAnterior].label);
        if (idx !== -1) grafica.data.datasets.splice(idx, 1);
        delete bloque._datasets[topicoAnterior];
        delete bloque._ultimosValores[topicoAnterior];
      }

      if (nuevoTopico && !bloque._datasets[nuevoTopico]) {
        const nuevo = {
          label: nombre,
          borderColor: color,
          backgroundColor: color,
          data: [],
          fill: false,
          tension: 0.3
        };
        grafica.data.datasets.push(nuevo);
        bloque._datasets[nuevoTopico] = nuevo;
        bloque._ultimosValores[nuevoTopico] = spanValor;
        grafica.update();

        if (mqttClient) mqttClient.subscribe(nuevoTopico);
        topicoAnterior = nuevoTopico;
      }
    });

    inputNombre.addEventListener('input', () => {
      const topico = selectTopico.value;
      if (bloque._datasets[topico]) {
        bloque._datasets[topico].label = inputNombre.value.trim() || topico;
        grafica.update();
      }
    });

    selectColor.addEventListener('change', () => {
      const topico = selectTopico.value;
      if (bloque._datasets[topico]) {
        bloque._datasets[topico].borderColor = selectColor.value;
        bloque._datasets[topico].backgroundColor = selectColor.value;
        grafica.update();
      }
    });

    senalDiv.appendChild(selectTopico);
    senalDiv.appendChild(selectColor);
    senalDiv.appendChild(inputNombre);
    senalDiv.appendChild(spanValor);
    contenedorSenales.appendChild(senalDiv);
  });
}

function agregarAlarma() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-alarma';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Alarma</div>
    <div class="alarma-estado" style="
      width: 100%;
      padding: 10px;
      border-radius: 5px;
      background: #ccc;
      color: #000;
      font-weight: bold;
      text-align: center;">
      Sin conexión
    </div>
    <div class="slider-config">
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-pub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "pub");

  const estadoDiv = bloque.querySelector('.alarma-estado');

  // Registro dinámico
  if (!window._bloquesAlarmas) window._bloquesAlarmas = [];

  // Pre-registro (el tópico se actualizará al seleccionar)
  window._bloquesAlarmas.push({ bloque, estadoDiv, topico: null });
}

function agregarBotonBooleano() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-boton';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Botón</div>
    <button class="boton-toggle" style="padding: 10px 20px; font-weight: bold;">OFF</button>
    <div class="slider-config">
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-sub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "sub");

  const boton = bloque.querySelector('.boton-toggle');
  let estado = false;  // Estado local del botón

  boton.addEventListener('click', () => {
    estado = !estado;

    // Cambia texto y color visual
    boton.textContent = estado ? "ON" : "OFF";
    boton.style.background = estado ? "#4caf50" : "#ccc";

    const topico = bloque.getAttribute('data-topico-sub');
    if (topico && mqttClient.connected) {
      mqttClient.publish(topico, estado ? "ON" : "OFF");
      console.log(`[PUBLICADO] ${topico} → ${estado ? "ON" : "OFF"}`);
    }
  });
}

function agregarTextoEditable() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-texto-enviar';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Texto a enviar</div>
    <input type="text" class="input-texto" maxlength="50" placeholder="Ej. encender_modo1" style="width: 80%; padding: 8px; margin: 5px 0;">
    <button class="boton-enviar" style="padding: 6px 12px;">Enviar</button>
    <div class="slider-config">
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-sub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "sub");

  const boton = bloque.querySelector('.boton-enviar');
  const input = bloque.querySelector('.input-texto');

  // Evita caracteres inválidos y reemplaza espacios
  input.addEventListener('input', () => {
    let texto = input.value;
    texto = texto.replace(/[^\w\-]/g, ''); // Solo letras, números, _ y -
    input.value = texto.slice(0, 50); // Máx 50 caracteres
  });

  boton.addEventListener('click', () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const mensaje = input.value.trim();

    if (!topico || !mensaje) return;

    if (mqttClient.connected) {
      mqttClient.publish(topico, mensaje);
      console.log(`[PUBLICADO] ${topico} → ${mensaje}`);
    }
  });
}

function agregarSelectorNumerico() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-selector-numerico';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Selector numérico</div>
    <input type="number" class="input-numerico" step="0.01" placeholder="Ej. 3.5" style="width: 100px; margin: 5px 0;">
    <button class="boton-enviar" style="padding: 5px 10px;">Enviar</button>
    <div class="slider-config">
      <label>Nombre visible:</label>
      <input type="text" class="nombre-objeto" placeholder="Ej. Kp">
      
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-sub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "sub");

  const boton = bloque.querySelector('.boton-enviar');
  const input = bloque.querySelector('.input-numerico');
  const nombreInput = bloque.querySelector('.nombre-objeto');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  // Actualizar nombre
  nombreInput.addEventListener('input', () => {
    const nombre = nombreInput.value.trim();
    const valor = input.value || "0";
    etiqueta.textContent = `${nombre || "Selector numérico"} (${valor})`;
  });

  // Publicar valor
  boton.addEventListener('click', () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const valor = input.value.trim();

    if (!topico || valor === "") return;

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) return;

    if (mqttClient.connected) {
      mqttClient.publish(topico, valorNumerico.toString());
      console.log(`[PUBLICADO] ${topico} → ${valorNumerico}`);
      etiqueta.textContent = `${nombreInput.value.trim() || "Selector numérico"} (${valorNumerico})`;
    }
  });
}

function agregarSelectorPorPasos() {
  const bloque = document.createElement('div');
  bloque.className = 'bloque tipo-selector-pasos';

  bloque.innerHTML = `
    <div class="etiqueta-topico">Selector por pasos (0)</div>
    <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
      <button class="boton-menos">−</button>
      <input type="number" class="valor-pasos" value="0" style="width: 60px; text-align: center;" readonly>
      <button class="boton-mas">+</button>
    </div>
    <div class="slider-config">
      <label>Nombre visible:</label>
      <input type="text" class="nombre-objeto" placeholder="Ej. Setpoint">
      <label>Incremento:</label>
      <input type="number" class="input-incremento" value="1" style="width: 60px;">
      <label>Seleccionar tópico desde lista:</label>
      <select class="select-topico-sub"></select>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);
  cargarTopicosEnSelect(bloque, "sub");

  const botonMenos = bloque.querySelector('.boton-menos');
  const botonMas = bloque.querySelector('.boton-mas');
  const inputValor = bloque.querySelector('.valor-pasos');
  const inputNombre = bloque.querySelector('.nombre-objeto');
  const inputPaso = bloque.querySelector('.input-incremento');
  const etiqueta = bloque.querySelector('.etiqueta-topico');

  const actualizarEtiqueta = () => {
    const nombre = inputNombre.value.trim() || "Selector por pasos";
    const valor = inputValor.value;
    etiqueta.textContent = `${nombre} (${valor})`;
  };

  inputNombre.addEventListener('input', actualizarEtiqueta);

  const publicarValor = () => {
    const topico = bloque.getAttribute('data-topico-sub');
    const valor = parseFloat(inputValor.value);

    if (!topico || isNaN(valor)) return;
    if (mqttClient.connected) {
      mqttClient.publish(topico, valor.toString());
      console.log(`[PUBLICADO] ${topico} → ${valor}`);
    }
  };

  botonMas.addEventListener('click', () => {
    const paso = parseFloat(inputPaso.value) || 1;
    inputValor.value = parseFloat(inputValor.value) + paso;
    actualizarEtiqueta();
    publicarValor();
  });

  botonMenos.addEventListener('click', () => {
    const paso = parseFloat(inputPaso.value) || 1;
    inputValor.value = parseFloat(inputValor.value) - paso;
    actualizarEtiqueta();
    publicarValor();
  });
}
