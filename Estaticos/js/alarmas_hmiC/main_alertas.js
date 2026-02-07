// main_alertas.js
import { inicializarBloquesAlerta } from './alertas.js';
import { inicializarMQTTalertas } from './mqtt_alertas.js';

document.addEventListener("DOMContentLoaded", async () => {
  await inicializarBloquesAlerta();
  await inicializarMQTTalertas();
});
