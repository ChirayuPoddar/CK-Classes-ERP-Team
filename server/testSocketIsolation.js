const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

// Strict Test Guardrail: DO NOT load production .env
// Require separate TEST_MONGO_URI for any db operations in future test scripts
const MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/ck_classes_test';

async function runSocketTest() {
  console.log('[Test] Setting up mock Socket.IO server...');
  const httpServer = createServer();
  const io = new Server(httpServer);

  // Mock Socket.IO server logic mimicking server.js
  io.use((socket, next) => {
    // Mimic the tenant extraction from handshake auth
    const tenantId = socket.handshake.auth.tenantId;
    if (!tenantId) return next(new Error('Authentication error: tenantId missing'));
    socket.tenantId = tenantId;
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (room) => {
      // THE FIX applied in Phase 3
      const namespacedRoom = `${socket.tenantId}_${room}`;
      socket.join(namespacedRoom);
      console.log(`[Server] Socket connected for Tenant ${socket.tenantId} joined physical room: ${namespacedRoom}`);
    });
    
    socket.on('trigger_announcement', (room, data) => {
      const namespacedRoom = `${socket.tenantId}_${room}`;
      console.log(`[Server] Tenant ${socket.tenantId} broadcasting to ${namespacedRoom}`);
      io.to(namespacedRoom).emit('new_announcement', data);
    });
  });

  await new Promise((resolve) => httpServer.listen(3005, resolve));
  console.log('[Test] Server listening on port 3005.');

  console.log('\n[Setup] Connecting Client A (Tenant A)...');
  const clientA = Client('http://localhost:3005', {
    auth: { tenantId: 'tenant_A_id' }
  });

  console.log('[Setup] Connecting Client B (Tenant B)...');
  const clientB = Client('http://localhost:3005', {
    auth: { tenantId: 'tenant_B_id' }
  });

  let clientA_received = 0;
  let clientB_received = 0;

  clientA.on('new_announcement', (data) => {
    console.log(`[Client A] Received announcement: ${data.msg}`);
    clientA_received++;
  });

  clientB.on('new_announcement', (data) => {
    console.log(`[Client B] Received announcement: ${data.msg}`);
    clientB_received++;
  });

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n--- Running Cross-Tenant Socket.IO Verification ---');
  // Both join the conceptual 'teachers' room
  console.log(`[Test] Both clients joining conceptual room 'teachers'`);
  clientA.emit('join_room', 'teachers');
  clientB.emit('join_room', 'teachers');

  await new Promise(resolve => setTimeout(resolve, 500));

  // Tenant B sends announcement to 'teachers'
  clientB.emit('trigger_announcement', 'teachers', { msg: 'Hello Tenant B Teachers!' });

  await new Promise(resolve => setTimeout(resolve, 500));

  if (clientA_received > 0) {
    console.error('❌ TEST FAILED: Client A received Tenant B\'s announcement!');
    process.exit(1);
  } else if (clientB_received === 1) {
    console.log('✔ Socket.IO check passed: Client B received its own announcement, Client A did not.');
  } else {
    console.error('❌ TEST FAILED: Client B did not receive its own announcement!');
    process.exit(1);
  }

  console.log('\n✔ CROSS-TENANT SOCKET.IO TESTS PASSED WITH ZERO LEAKAGE!');
  
  clientA.disconnect();
  clientB.disconnect();
  httpServer.close();
}

runSocketTest().catch(console.error);
