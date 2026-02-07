from pathlib import Path

# Definir el contenido del resumen en formato Markdown
resumen_logs = """
# Resumen del uso de logs en el sistema HMI

Este documento describe el uso actual del sistema de logs mediante `logger` en los módulos del sistema HMI.

---

## Archivos que implementan logs

| Archivo                    | Descripción del uso                                                                 | Niveles de log utilizados                       |
|---------------------------|--------------------------------------------------------------------------------------|-------------------------------------------------|
| **main.py**               | - Confirmación de conexión MQTT<br>- Eventos generales de inicio<br>- Errores en recepción | `info`, `error`, `warning`                      |
| **fragmentos_registro.py**| - Reconstrucción de mensajes fragmentados<br>- Validación y guardado de JSON        | `info`, `debug`, `success`, `error`, `warning`  |
| **analisis_red.py**       | - Escaneo IPs y puertos<br>- Análisis de tabla ARP<br>- Fallos en comandos del sistema | `info`, `error`, `debug`                        |
| **mapa_dispositivos.py**  | - Carga y guardado de `dispositivos.json`<br>- Alta/baja de dispositivos<br>- Ping por IP | `info`, `warning`, `error`                      |

---

## Detalles técnicos del logger

- **Ubicación del archivo de log**: `logs/hmi.log`
- **Rotación**: 1 MB por archivo, hasta 3 backups (`RotatingFileHandler`)
- **Formato**: 
  ```
  [YYYY-MM-DD HH:MM:SS] LEVEL - mensaje
  ```

---

## Sugerencias para mejoras futuras

1. **Logs por módulo específico**: Podrías generar archivos de log independientes por tipo de microcontrolador o módulo funcional (por ejemplo, `arduino.log`, `esp32.log`).
2. **Envío de errores críticos por email o Telegram** en caso de fallas como pérdida de conexión o datos corruptos.
3. **Integración con dashboard web** para ver el historial de eventos desde la interfaz de HMI.
4. **Indicadores de salud del sistema**: contar cuántos errores por tipo en los últimos 10 min, útil para mantenimiento.
5. **Sistema de alerta visual**: cambiar el color o estado de un ícono si se detecta un `logger.error`.

---

## ¿Se actualiza automáticamente?

Actualmente este archivo **no se actualiza automáticamente**. Si haces cambios importantes en los módulos o agregas más logs, puedes volver a generar este documento o editarlo manualmente.

---

*Este archivo fue generado automáticamente para ayudarte a mantener un sistema profesional y claro.*
"""

# Crear la carpeta docs si no existe
docs_path = Path("docs")
docs_path.mkdir(exist_ok=True)

# Escribir el archivo resumen en la carpeta docs
resumen_path = docs_path / "resumen_logs.md"
resumen_path.write_text(resumen_logs.strip(), encoding="utf-8")

resumen_path.name
