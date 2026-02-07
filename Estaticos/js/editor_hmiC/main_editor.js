//main_editor.js
import { mqttClient } from './mqtt_cliente.js';
import { cargarTopicosEnSelect } from './cargar_topicos.js';
import { configurarManejadorMensajes } from './mqtt_receptor.js';

// Bloques individuales
import { agregarSlider } from './bloques_slider.js';
import { agregarLED } from './bloques_led.js';
import { agregarGrafica } from './bloques_grafica.js';
import { agregarAlarma } from './bloques_alarma.js';
import { agregarBotonBooleano } from './bloques_boton.js';
import { agregarTextoEditable } from './bloques_texto.js';
import { agregarSelectorNumerico } from './bloques_numerico.js';
import { agregarSelectorPorPasos } from './bloques_selectpas.js';
import { agregarGauge } from './bloques_gauge.js';
import { agregarBarraProgreso } from './bloques_barra_progreso.js';
import { agregarTermometro } from './bloques_termometro.js';
import { agregarRotatorio } from './bloques_rotatorio.js';
import { agregarFuzzy } from './bloques_fuzzy.js';
import { agregarContador } from './bloques_contador.js';

import { mostrarPanelDePropiedades } from './panel_propiedades.js';

// Almacenamiento
import { guardarHMI } from './guardar_hmiJ.js';
import { cargarHMI } from './cargar_hmiJ.js';

window.onload = () => {
  const nombre = window.nombreDispositivo;
  if (nombre) {
    cargarHMI(nombre, mqttClient, cargarTopicosEnSelect);
  }
  
  // Vincula botones con funciones
  document.getElementById('btn-agregar-slider')?.addEventListener('click', () => {
    agregarSlider(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-led')?.addEventListener('click', () => {
    agregarLED(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-grafica')?.addEventListener('click', () => {
    agregarGrafica(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-alarma')?.addEventListener('click', () => {
    agregarAlarma(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-boton')?.addEventListener('click', () => {
    agregarBotonBooleano(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-texto')?.addEventListener('click', () => {
    agregarTextoEditable(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-num')?.addEventListener('click', () => {
    agregarSelectorNumerico(mqttClient, cargarTopicosEnSelect);
  });

  document.getElementById('btn-agregar-pasos')?.addEventListener('click', () => {
    agregarSelectorPorPasos(mqttClient, cargarTopicosEnSelect);
  });
  
  document.getElementById('btn-agregar-gauge')?.addEventListener('click', () => {
    agregarGauge(mqttClient, cargarTopicosEnSelect);
  });
  
  document.getElementById('btn-agregar-barra')?.addEventListener('click', () => {
    agregarBarraProgreso(mqttClient, cargarTopicosEnSelect);
  });
  
  document.getElementById('btn-agregar-termo')?.addEventListener('click', () => {
    agregarTermometro(mqttClient, cargarTopicosEnSelect);
  });
  
  document.getElementById('btn-agregar-rpm')?.addEventListener('click', () => {
    agregarRotatorio(mqttClient, cargarTopicosEnSelect);
  });
  
  document.getElementById('btn-agregar-fuzzy')?.addEventListener('click', () => {
    agregarFuzzy(mqttClient, cargarTopicosEnSelect);
  });
  document.getElementById('btn-agregar-contador')?.addEventListener('click', () => {
    agregarContador(mqttClient, cargarTopicosEnSelect);
  });
  
  // Almacenamiento
  document.getElementById('btn-agregar-guardar')?.addEventListener('click', () => {
    guardarHMI(nombreDispositivo);
  });
  
  //Propiedades del bloque
  document.getElementById('cerrar-panel').addEventListener('click', () => {
    document.getElementById('panel-propiedades').style.display = 'none';
  });


  document.getElementById('editor').addEventListener('click', (e) => {
    const bloque = e.target.closest('.bloque');
    if (!bloque) return;
    mostrarPanelDePropiedades(bloque);
  });
  
  // Configura manejador de mensajes entrantes
  configurarManejadorMensajes(mqttClient);
};
