# CHECK GOLIVE - SECTION 5: WEBSOCKET

## Mục tiêu
Test WebSocket kết nối, reconnect, và broadcast.

## Cài đặt wscat (nếu chưa có)
```bash
npm install -g wscat
```

## Checklist

### 5.1 Kết nối WebSocket cơ bản
```bash
# Terminal 1: Mở WebSocket
wscat -c ws://localhost:3000/ws

# Expected: Connected
# Gõ message test:
> ping

# Expected: Pong hoặc echo response
```

### 5.2 Test reconnect khi mất mạng
```bash
# 1. Kết nối WebSocket
wscat -c ws://localhost:3000/ws

# 2. Ngắt mạng (Ctrl+C hoặc kill connection)

# 3. Reconnect
wscat -c ws://localhost:3000/ws

# Expected: Kết nối lại thành công
```

### 5.3 Test nhiều clients
```bash
# Terminal 1
wscat -c ws://localhost:3000/ws

# Terminal 2
wscat -c ws://localhost:3000/ws

# Terminal 3
wscat -c ws://localhost:3000/ws

# Expected: Cả 3 kết nối thành công
```

### 5.4-5.5 Test broadcast realtime
```bash
# Terminal 1: Subscribe vào sensor updates
wscat -c ws://localhost:3000/ws
> {"type":"subscribe","channel":"sensors"}

# Terminal 2: Gửi cảm biến mới
curl -s -X POST http://localhost:3000/api/sensors/temperature \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":30}'

# Terminal 1: Expected nhận được broadcast
```

### 5.6 Kiểm tra cleanup khi client đóng
```bash
# Kiểm tra số kết nối WebSocket
# (Cần code monitoring hoặc logs)

# Connect rồi disconnect nhiều lần
for i in {1..10}; do
  wscat -c ws://localhost:3000/ws -x "ping" 2>/dev/null
done

# Kiểm tra logs không có connection leaks
grep -i "websocket\|connection" logs/*.log | tail -20
```

## Test với JavaScript (Node.js)
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('Connected!');
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('close', () => {
  console.log('Disconnected');
});

// Auto reconnect test
let reconnectAttempts = 0;
function connect() {
  const ws = new WebSocket('ws://localhost:3000/ws');
  ws.on('close', () => {
    reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
    setTimeout(connect, 1000);
  });
}
```

## Sign-off
- [ ] WebSocket kết nối thành công
- [ ] Reconnect hoạt động
- [ ] Nhiều clients cùng kết nối được
- [ ] Broadcast dữ liệu realtime
- [ ] Không rò rỉ kết nối

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
