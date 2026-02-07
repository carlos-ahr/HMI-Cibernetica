export function configurarManejadorMensajes(mqttClient) {
  mqttClient.on('message', (topic, message) => {
    const valor = message.toString();
    const numero = parseFloat(valor);
    console.log(`[MQTT] Mensaje recibido: ${topic} → ${valor}`);

    
    // LEDS
	document.querySelectorAll('.tipo-led').forEach(bloque => {
	  const topico = bloque.getAttribute('data-topico-pub');
	  const led = bloque.querySelector('.led');

	  if (topic === topico && led) {
		const estado = (valor === "1" || valor.toLowerCase() === "true");
		const colorOn = bloque.dataset.colorOn || 'limegreen';
		const colorOff = bloque.dataset.colorOff || '#333';

		led.style.background = estado ? colorOn : colorOff;
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
    
    // GAUGES
	if (window._bloquesGauges) {
	  window._bloquesGauges.forEach(({ bloque, dibujarGauge }) => {
		const topico = bloque.getAttribute('data-topico-pub');
		if (topic === topico) {
		  const valorNum = parseFloat(valor);
		  if (!isNaN(valorNum)) {
			dibujarGauge(valorNum);
		  }
		}
	  });
	}
	
	// BARRAS DE PROGRESO
	if (window._bloquesBarrasProgreso) {
	  window._bloquesBarrasProgreso.forEach(bloque => {
		const topico = bloque.getAttribute('data-topico-pub');
		if (topic === topico) {
		  const valor = parseFloat(message.toString());
		  const barra = bloque.querySelector('.barra');
		  const texto = bloque.querySelector('.valor-barra');

		  if (!isNaN(valor)) {
			const porcentaje = Math.max(0, Math.min(100, valor)); // Limitar a 0-100%
			barra.style.width = `${porcentaje}%`;
			texto.textContent = `${porcentaje.toFixed(1)}%`;
		  }
		}
	  });
	}
	
	// BARRAS DE PROGRESO
	if (window._bloquesBarrasProgreso) {
	  window._bloquesBarrasProgreso.forEach(bloque => {
		const topico = bloque.getAttribute('data-topico-pub');
		if (topic === topico) {
		  const valor = parseFloat(message.toString());
		  const max = parseFloat(bloque.getAttribute('data-max') || '100');
		  const porcentaje = Math.min(Math.max((valor / max) * 100, 0), 100);

		  const barra = bloque.querySelector('.barra');
		  const texto = bloque.querySelector('.valor-barra');

		  if (barra && texto) {
			barra.style.width = `${porcentaje}%`;
			texto.textContent = `${porcentaje.toFixed(1)}%`;
		  }
		}
	  });
	}
    
        // TERMÓMETROS
	if (window._bloquesTermometros) {
	  window._bloquesTermometros.forEach(({ bloque, valorDiv, relleno, getTopico, getMin, getMax, getColor }) => {
		const topico = getTopico();
		if (topic === topico) {
		  const valorNum = parseFloat(valor);
		  if (isNaN(valorNum)) return;

		  const min = getMin();
		  const max = getMax();
		  const porcentaje = Math.min(Math.max((valorNum - min) / (max - min), 0), 1);
		  const altura = porcentaje * 100;

		  relleno.style.height = `${altura}%`;
		  relleno.style.background = getColor();
		  valorDiv.textContent = `${valorNum.toFixed(1)} °C`;
		}
	  });
	}
    
    // ROTATORIOS
	if (window._bloquesRotatorios) {
	  window._bloquesRotatorios.forEach(bloque => {
		const topico = bloque.getAttribute('data-topico-pub');
		const rotatorio = bloque._rotatorio;
		if (topic === topico && rotatorio) {
		  const valorNum = parseFloat(valor);
		  if (!isNaN(valorNum)) {
			rotatorio.valor = valorNum;
			rotatorio.dibujar(valorNum);
		  }
		}
	  });
	}
	
	// FUZZY
	if (window._bloquesFuzzy) {
	  window._bloquesFuzzy.forEach(({ bloque, dibujarFuzzy }) => {
		const topico = bloque.getAttribute('data-topico-pub');
		if (topic === topico) {
		  const valor = parseFloat(message.toString());
		  if (!isNaN(valor)) dibujarFuzzy(valor);
		}
	  });
	}
	
	// CONTADOR
	document.querySelectorAll('.tipo-contador').forEach(bloque => {
	  const topico = bloque.getAttribute('data-topico-pub');
	  if (topico === topic) {
	    let contador = parseInt(bloque.getAttribute('data-contador') || '0');
	    contador++;
	    bloque.setAttribute('data-contador', contador);
	    bloque.querySelector('.valor-contador').textContent = contador;
	  }
	});

    
  });
}
