// cargar_hmiJ.js

import { hacerBloqueMovible } from './editor_dragdrop.js';

import { agregarSlider , restaurarPropiedadesSlider } from './bloques_slider.js';
import { agregarLED } from './bloques_led.js';
import { agregarGrafica , restaurarPropiedadesGrafica} from './bloques_grafica.js';
import { agregarAlarma } from './bloques_alarma.js';
import { agregarBotonBooleano , restaurarPropiedadesBotonBooleano } from './bloques_boton.js';
import { agregarTextoEditable } from './bloques_texto.js';
import { agregarSelectorNumerico , restaurarPropiedadesSelectorNumerico } from './bloques_numerico.js';
import { agregarSelectorPorPasos , restaurarPropiedadesSelectorPorPasos} from './bloques_selectpas.js';
import { agregarGauge , restaurarPropiedadesGauge } from './bloques_gauge.js';
import { agregarBarraProgreso , restaurarPropiedadesBarra } from './bloques_barra_progreso.js';
import { agregarTermometro , restaurarPropiedadesTermometro } from './bloques_termometro.js';
import { agregarRotatorio , restaurarPropiedadesRotatorio } from './bloques_rotatorio.js';
import { agregarFuzzy } from './bloques_fuzzy.js';

export async function cargarHMI(nombre, mqttClient, cargarTopicosEnSelect) {
  try {
    const res = await fetch(`/cargar_hmi/${nombre}`);
    const data = await res.json();

    if (!data.bloques) return;

    for (const bloque of data.bloques) {
      let instancia = null;

      switch (bloque.tipo) {
        case 'tipo-slider': {
          instancia = agregarSlider(mqttClient, cargarTopicosEnSelect);
          restaurarPropiedadesSlider(instancia, bloque);
          break;
        }
        //Bloque 2
        case 'tipo-led': {
          instancia = agregarLED(mqttClient, cargarTopicosEnSelect);
          if (bloque.nombre) {
            const etiqueta = instancia.querySelector('.etiqueta-topico');
            etiqueta.textContent = bloque.nombre;
          }
          if (bloque.colorOn) {
            instancia.dataset.colorOn = bloque.colorOn;
            instancia.dataset.colorOff = oscurecerColor(bloque.colorOn, 0.2);
          }
          break;
        }
        //Bloque 
        case 'tipo-grafica': {
          instancia = agregarGrafica(mqttClient, cargarTopicosEnSelect);
          if (bloque.nombre) {
            const etiqueta = instancia.querySelector('.etiqueta-topico');
            etiqueta.textContent = bloque.nombre;
          }
          restaurarPropiedadesGrafica(instancia, bloque);  
          break;
        }
        //Bloque 
        case 'tipo-alarma': instancia = agregarAlarma(mqttClient, cargarTopicosEnSelect); break;
        //Bloque 
        case 'tipo-boton': {
          instancia = agregarBotonBooleano(mqttClient, cargarTopicosEnSelect);
          
          if (bloque.nombre) {
            instancia.setAttribute('data-nombre-visible', bloque.nombre);
            const etiqueta = instancia.querySelector('.etiqueta-topico');
            if (etiqueta) etiqueta.textContent = bloque.nombre;
          }

          if (bloque.topicoSub) instancia.setAttribute("data-topico-sub", bloque.topicoSub);

          // Restaurar estado del botón ON/OFF
          const boton = instancia.querySelector('.boton-toggle');
          if (boton && bloque.estado !== undefined) {
            const estado = bloque.estado;
            boton.textContent = estado ? 'ON' : 'OFF';
            boton.style.background = estado ? '#4caf50' : '#ccc';
            instancia.setAttribute('data-estado', estado ? 'true' : 'false');
          }

          break;
        }
        //Bloque 
        case 'tipo-texto-enviar': instancia = agregarTextoEditable(mqttClient, cargarTopicosEnSelect); break;
        //Bloque 
        case 'tipo-selector-pasos': {
          instancia = agregarSelectorPorPasos(mqttClient, cargarTopicosEnSelect);
          if (bloque.paso) instancia.setAttribute('data-paso', bloque.paso);
          if (bloque.nombre) {
            instancia.setAttribute('data-nombre-visible', bloque.nombre);
            const valor = instancia.querySelector('.valor-pasos')?.value || '0';
            const etiqueta = instancia.querySelector('.etiqueta-topico');
            if (etiqueta) etiqueta.textContent = `${bloque.nombre} (${valor})`;
          }
          break;
        }
        //Bloque 
        case 'tipo-selector-numerico': {
          instancia = agregarSelectorNumerico(mqttClient, cargarTopicosEnSelect);
          restaurarPropiedadesSelectorNumerico(instancia, bloque);
          break;
        }
        //Bloque 
        case 'tipo-gauge': {
          instancia = agregarGauge(mqttClient, cargarTopicosEnSelect);
          restaurarPropiedadesGauge(instancia, bloque);
          break;
        }
        //Bloque 
        case 'tipo-barra-progreso': {
          instancia = agregarBarraProgreso(mqttClient, cargarTopicosEnSelect);
          restaurarPropiedadesBarra(instancia, bloque);
          break;
        }
        //Bloque 
        case 'tipo-termometro': {
          instancia = agregarTermometro(mqttClient, cargarTopicosEnSelect);
          restaurarPropiedadesTermometro(instancia, bloque);
          break;
        }
        //Bloque 
        case 'tipo-rotatorio': {
          instancia = agregarRotatorio(mqttClient, cargarTopicosEnSelect);
          restaurarPropiedadesRotatorio(instancia, bloque);
          break;
        }
        //Bloque 
        case 'tipo-fuzzy': instancia = agregarFuzzy(mqttClient, cargarTopicosEnSelect); break;
        default: console.warn("Bloque desconocido:", bloque.tipo); continue;
      }

      if (!instancia) continue;
      
      // 1. Agregar primero al DOM (si no lo hace dentro de agregarX())
	  document.getElementById('editor').appendChild(instancia);

      // 2. Restaurar propiedades y posición
      if (bloque.topicoPub) instancia.setAttribute("data-topico-pub", bloque.topicoPub);
      if (bloque.topicoSub) instancia.setAttribute("data-topico-sub", bloque.topicoSub);
      if (bloque.nombre) instancia.querySelector('.etiqueta-topico').textContent = bloque.nombre;
      
      // 3. Restaurar posición solo después de estar en el DOM
      if (bloque.x && bloque.y) {
        instancia.style.transform = `translate(${bloque.x}px, ${bloque.y}px)`;
        instancia.setAttribute('data-x', bloque.x);
        instancia.setAttribute('data-y', bloque.y);
      }
      
      // 4. Hacerlo movible
      hacerBloqueMovible(instancia); 
    }

    console.log("[HMI] Carga completada");
  } catch (error) {
    console.error("[HMI] Error al cargar:", error);
  }
}

function oscurecerColor(hex, factorOscurecer = 0.5) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.floor(r * factorOscurecer);
  g = Math.floor(g * factorOscurecer);
  b = Math.floor(b * factorOscurecer);

  return `rgb(${r}, ${g}, ${b})`;
}
