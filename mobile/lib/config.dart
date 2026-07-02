// Default ke domain production. Untuk development lokal, override lewat
// --dart-define=API_URL=http://<IP-LAN-KOMPUTER-ANDA>:5000/api saat
// `flutter run` — "localhost" tidak resolve dari device fisik/emulator
// ke mesin dev.
const String apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://iwareid.com/api',
);
