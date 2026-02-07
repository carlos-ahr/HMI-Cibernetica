from logs.logger_hmi import logger

def configurar_websocket(socketio):
    @socketio.on('connect')
    def cliente_conectado():
        logger.info('Cliente WebSocket conectado.')
