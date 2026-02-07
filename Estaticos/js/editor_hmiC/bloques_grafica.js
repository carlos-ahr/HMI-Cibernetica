import { hacerBloqueMovible } from './editor_dragdrop.js';
import { agregarBotonEliminar } from './utilidades_bloques.js';

export function agregarGrafica(mqttClient) {
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
  bloque.id = idCanvas;  // asignamos el id al bloque también

  bloque.innerHTML = `
    <button class="btn-eliminar-bloque">✕</button>
    <div class="etiqueta-topico" style="font-weight:bold; font-size:18px; margin-bottom:10px;">Gráfica</div>
    <div style="width: 100%; min-width: 700px; height: 450px;">
      <canvas id="${idCanvas}" style="width: 100%; height: 100%;"></canvas>
    </div>
  `;

  document.getElementById('editor').appendChild(bloque);

  const ctx = bloque.querySelector(`#${idCanvas}`).getContext('2d');
  const datos = { labels: [], datasets: [] };

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
  bloque._senales = []; // aquí almacenaremos los datos de cada señal

  hacerBloqueMovible(bloque);
  agregarBotonEliminar(bloque);
  return bloque;
}

export function mostrarPropiedadesGrafica(bloque, contenedor, mqttClient) {
  contenedor.innerHTML = '';

  const colores = [
    { nombre: 'Rojo', valor: '#FF6384' },
    { nombre: 'Azul', valor: '#36A2EB' },
    { nombre: 'Amarillo', valor: '#FFCE56' },
    { nombre: 'Turquesa', valor: '#4BC0C0' },
    { nombre: 'Morado', valor: '#9966FF' },
    { nombre: 'Naranja', valor: '#FF9F40' },
    { nombre: 'Gris Claro', valor: '#E7E9ED' },
    { nombre: 'Verde', valor: '#8BC34A' },
    { nombre: 'Rojo Intenso', valor: '#F44336' },
    { nombre: 'Azul Oscuro', valor: '#3F51B5' }
  ];

  const nombreLabel = document.createElement('label');
  nombreLabel.textContent = 'Nombre de la gráfica:';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.value = bloque.querySelector('.etiqueta-topico')?.textContent || 'Gráfica';
  nombreInput.addEventListener('input', () => {
    bloque.querySelector('.etiqueta-topico').textContent = nombreInput.value;
  });

  const btnAgregar = document.createElement('button');
  btnAgregar.textContent = '+ Agregar señal';
  btnAgregar.style.marginTop = '15px';

  const contenedorSenales = document.createElement('div');
  contenedorSenales.className = 'panel-senales-grafica';

  contenedor.appendChild(nombreLabel);
  contenedor.appendChild(nombreInput);
  contenedor.appendChild(btnAgregar);
  contenedor.appendChild(contenedorSenales);

  // Función para crear un bloque de señal editable
  function crearElementoSenal(senalData) {
    const senal = document.createElement('div');
    senal.classList.add('senal');
    senal.style.marginTop = '10px';
    // Si se pasa un tópico, se guarda; si no, se inicializa vacío.
    senal.dataset.topicoActual = senalData.topico || '';

    const selectTopico = document.createElement('select');
    selectTopico.classList.add('select-topico-pub');

    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.placeholder = 'Nombre de señal';
    inputNombre.classList.add('input-nombre-senal');
    inputNombre.value = senalData.nombre || '';

    const selectColor = document.createElement('select');
    selectColor.classList.add('select-color-senal');

    colores.forEach(color => {
      const opt = document.createElement('option');
      opt.value = color.valor;
      opt.textContent = color.nombre;
      opt.style.backgroundColor = color.valor;
      opt.style.color = '#000';
      opt.style.padding = '2px 6px';
      opt.style.border = '1px solid #ccc';
      if (color.valor === senalData.color) opt.selected = true;
      selectColor.appendChild(opt);
    });

    // Botón para eliminar la señal
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '✕';
    btnEliminar.style.marginLeft = '5px';
    btnEliminar.style.color = 'red';
    btnEliminar.style.border = 'none';
    btnEliminar.style.background = 'transparent';
    btnEliminar.style.cursor = 'pointer';
    btnEliminar.style.fontSize = '16px';

    btnEliminar.addEventListener('click', () => {
      const topico = senal.dataset.topicoActual;
      const dataset = bloque._datasets[topico];
      const index = bloque._grafica.data.datasets.indexOf(dataset);
      if (index !== -1) {
        bloque._grafica.data.datasets.splice(index, 1);
      }
      delete bloque._datasets[topico];
      bloque._senales = bloque._senales.filter(s => s.topico !== topico);
      bloque._grafica.update();
      senal.remove();
    });

    // Cargar la lista de tópicos
    fetch(`/topicos_dispositivo/${window.nombreDispositivo}`)
      .then(res => res.json())
      .then(data => {
        const lista = data.topics_pub || [];
        selectTopico.innerHTML = `<option value="">Selecciona un tópico</option>`;
        lista.forEach(topico => {
          const opt = document.createElement('option');
          opt.value = topico;
          opt.textContent = topico;
          if (topico === senalData.topico) opt.selected = true;
          selectTopico.appendChild(opt);
        });
      });

    // Al cambiar el tópico
    selectTopico.addEventListener('change', () => {
      const nuevoTopico = selectTopico.value;
      if (!nuevoTopico) return;
      const anteriorTopico = senal.dataset.topicoActual;

      // Si ya existe otro dataset con este tópico y no es el mismo que tenía, cancelar.
      if (bloque._datasets[nuevoTopico] && nuevoTopico !== anteriorTopico) {
        alert("Este tópico ya está en uso.");
        selectTopico.value = anteriorTopico || "";
        return;
      }

      // Si ya había un tópico asignado, eliminar el dataset anterior y quitarlo de _senales.
      if (anteriorTopico) {
        const index = bloque._grafica.data.datasets.indexOf(bloque._datasets[anteriorTopico]);
        if (index !== -1) {
          bloque._grafica.data.datasets.splice(index, 1);
        }
        delete bloque._datasets[anteriorTopico];
        bloque._senales = bloque._senales.filter(s => s.topico !== anteriorTopico);
      }

      // Crear nuevo dataset con los datos actuales
      const nombre = inputNombre.value.trim() || nuevoTopico;
      const color = selectColor.value;
      const nuevoDataset = {
        label: nombre,
        borderColor: color,
        backgroundColor: color,
        data: [],
        fill: false,
        tension: 0.3
      };

      bloque._grafica.data.datasets.push(nuevoDataset);
      bloque._datasets[nuevoTopico] = nuevoDataset;
      bloque._senales.push({ topico: nuevoTopico, nombre, color });
      senal.dataset.topicoActual = nuevoTopico;
      bloque._grafica.update();

      // Suscribirse al nuevo tópico
      if (mqttClient && nuevoTopico) {
        mqttClient.subscribe(nuevoTopico);
        console.log("Suscrito a nuevo tópico desde gráfica:", nuevoTopico);
      }
    });

    // Actualizar el nombre de la señal
    inputNombre.addEventListener('input', () => {
      const topico = senal.dataset.topicoActual;
      const nuevoNombre = inputNombre.value.trim() || topico;
      if (bloque._datasets[topico]) {
        bloque._datasets[topico].label = nuevoNombre;
        const obj = bloque._senales.find(s => s.topico === topico);
        if (obj) obj.nombre = nuevoNombre;
        bloque._grafica.update();
      }
    });

    // Actualizar el color de la señal
    selectColor.addEventListener('change', () => {
      const topico = senal.dataset.topicoActual;
      const nuevoColor = selectColor.value;
      if (bloque._datasets[topico]) {
        bloque._datasets[topico].borderColor = nuevoColor;
        bloque._datasets[topico].backgroundColor = nuevoColor;
        const obj = bloque._senales.find(s => s.topico === topico);
        if (obj) obj.color = nuevoColor;
        bloque._grafica.update();
      }
    });

    senal.appendChild(selectTopico);
    senal.appendChild(selectColor);
    senal.appendChild(inputNombre);
    senal.appendChild(btnEliminar);
    contenedorSenales.appendChild(senal);
  }

  // Reconstruir los elementos de señal a partir del estado guardado
  if (bloque._senales && bloque._senales.length > 0) {
    bloque._senales.forEach(senalData => {
      crearElementoSenal(senalData);
    });
  }

  // Permitir agregar una nueva señal
  btnAgregar.addEventListener('click', () => {
    if (contenedorSenales.querySelectorAll('.senal').length >= 6) {
      alert("Solo se permiten hasta 6 señales por gráfica.");
      return;
    }
    crearElementoSenal({ topico: '', nombre: '', color: '#36A2EB' });
  });
}

export function restaurarPropiedadesGrafica(bloque, datosGuardados) {
  if (!bloque || !datosGuardados) return;

  const etiqueta = bloque.querySelector('.etiqueta-topico');
  if (etiqueta && datosGuardados.nombre) {
    etiqueta.textContent = datosGuardados.nombre;
  }

  const grafica = bloque._grafica;
  const datasets = datosGuardados.senales || [];
  bloque._senales = [];

  datasets.forEach(senal => {
    const { topico, color, nombre } = senal;

    if (topico && !bloque._datasets[topico]) {
      const nuevo = {
        label: nombre || topico,
        borderColor: color || '#36A2EB',
        backgroundColor: color || '#36A2EB',
        data: [],
        fill: false,
        tension: 0.3
      };

      grafica.data.datasets.push(nuevo);
      bloque._datasets[topico] = nuevo;

      // Guardar también en _senales para que se pueda guardar luego
      bloque._senales.push({ topico, nombre, color });

      if (window.mqttClient) mqttClient.subscribe(topico);
    }
  });

  grafica.update();
}
