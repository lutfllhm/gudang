import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config.dart';

// Socket.IO di-host di origin backend (tanpa suffix /api), sama seperti
// frontend/src/utils/socket.js.
String get _socketUrl {
  final normalized = apiUrl.replaceFirst(RegExp(r'/+$'), '');
  return normalized.endsWith('/api') ? normalized.substring(0, normalized.length - 4) : normalized;
}

io.Socket createSalesOrderSocket({required String? userId}) {
  final socket = io.io(
    _socketUrl,
    io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
        .enableReconnection()
        .build(),
  );

  socket.onConnect((_) {
    if (userId != null) {
      socket.emit('authenticate', {'userId': userId});
    }
  });

  return socket;
}
