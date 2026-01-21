"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSocketMessage = void 0;
const handleSocketMessage = (ms, ws, origin) => {
    const raw = JSON.parse(Buffer.isBuffer(ms) ? ms.toString(`utf8`) : `string` == typeof ms ? ms : ms.data);
    const respond = (a, m) => {
        if (ws && ws.readyState == WebSocket.OPEN) {
            ws.send(JSON.stringify({ a, m, }));
        }
    };
    if (`a` in raw && `m` in raw) {
        switch (raw.a) {
            case "ping":
                respond("pong", {});
                break;
        }
    }
};
exports.handleSocketMessage = handleSocketMessage;
