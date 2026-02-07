# publicador.py

import paho.mqtt.client as mqtt

# Configuración del broker
broker = "localhost"  # o IP como "192.168.2.88" si estás en otra máquina
puerto = 1883

# Crear cliente
cliente = mqtt.Client()
cliente.connect(broker, puerto, 60)

# Enviar mensaje al topic
cliente.publish("led/rgb", "250,1,1")  # Cambia a "OFF" para apagar el LED

print("Mensaje enviado al Arduino")

cliente.disconnect()
