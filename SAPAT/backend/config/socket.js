
const handleSocket = (socket) => {
  try {
    console.log(`[Socket.io] User connected: ${socket.id}`);

    socket.on('error', (err) => {
      console.error(`[Socket.io] Socket error on ${socket.id}:`, err);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] User disconnected: ${socket.id} — reason: ${reason}`);
    });
  } catch (err) {
    console.error('[Socket.io] Uncaught error in connection handler:', err);
  }
};

export default handleSocket;
