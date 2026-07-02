# iWare Schedule — Mobile (Flutter)

Aplikasi Flutter yang hanya berisi halaman **Schedule** (jadwal sales order)
dari sistem iWare Warehouse, untuk dipakai staf gudang dari HP. Terhubung ke
backend Express yang sama dengan `../frontend`.

## Menjalankan (development)

```bash
cd mobile
flutter pub get
flutter run
```

Pilih device/emulator yang muncul di CLI, atau colokkan HP Android via USB
(aktifkan USB debugging) / jalankan simulator iOS.

### Mengarahkan ke backend lokal

Secara default app menembak `https://iwareid.com/api` (backend production).
Untuk testing melawan backend lokal:

```bash
flutter run --dart-define=API_URL=http://<IP-LAN-KOMPUTER-ANDA>:5000/api
```

Gunakan IP LAN komputer (bukan `localhost`/`127.0.0.1`), karena HP fisik atau
emulator tidak bisa resolve `localhost` ke mesin development. Cari IP LAN
dengan `ipconfig` (Windows) lalu cari `IPv4 Address`.

## Struktur

```
lib/
  config.dart          API_URL (bisa di-override via --dart-define)
  api/                 Dio client + panggilan endpoint (auth, sales-orders)
  models/               AppUser, SalesOrder
  providers/            AuthProvider (ChangeNotifier — login/logout/session)
  screens/               LoginScreen, ScheduleScreen
  utils/                 helper status/tanggal/format, di-port dari frontend web
```

## Build APK/IPA (produksi)

```bash
flutter build apk --release --dart-define=API_URL=https://iwareid.com/api
# hasil: build/app/outputs/flutter-apk/app-release.apk

flutter build ios --release --dart-define=API_URL=https://iwareid.com/api
# butuh macOS + akun Apple Developer untuk distribusi
```

APK hasil build bisa langsung di-install ke device Android (aktifkan "Install
dari sumber tidak dikenal" di pengaturan HP), tanpa perlu Play Store.

## Catatan

- Login memakai endpoint `/api/auth/login` yang sama dengan web — gunakan
  akun yang sudah ada di sistem.
- Auto-refresh data setiap 30 detik + pull-to-refresh manual.
- Tidak ada notifikasi suara/TTS atau mode TV seperti di web — app ini fokus
  untuk dilihat cepat dari HP.
