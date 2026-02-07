// mqtt_cliente.js
const proto = location.protocol === 'https:' ? 'wss' : 'ws';
const host  = location.hostname; // ejemplo: 192.168.2.25 o tu dominio

export const mqttClient = mqtt.connect(`${proto}://${host}:9001`, {
  protocolVersion: 4,
  path: "/",             // Mosquitto WebSocket usa raíz
  clean: true,
  // DEBUG opcional: borra esto cuando funcione
  // createWebsocket: (url, protocols, opts) => {
  //   console.log("[MQTT WS/edit] URL:", url, "protocols:", protocols);
  //   return new WebSocket(url, protocols);
  // },
});

mqttClient.on('connect', () => {
  console.log('[MQTT] Conectado desde mqtt_cliente.js');
});

// Export global
window.mqttClient = mqttClient;
