# Panduan Tampilan Schedule di TV 43 Inch

## Spesifikasi Optimal
- **Ukuran TV**: 43 inch
- **Resolusi**: 1920x1080 (Full HD)
- **Browser**: Chrome/Edge (Recommended)
- **Mode**: Fullscreen (F11)

## Cara Setup

### 1. Buka Browser di TV
- Gunakan Chrome atau Edge untuk hasil terbaik
- Pastikan browser sudah update ke versi terbaru

### 2. Akses Schedule Page
```
http://[your-server-ip]/schedule
```

### 3. Aktifkan Fullscreen
- Tekan **F11** pada keyboard
- Atau klik tombol fullscreen di pojok kanan atas
- Tampilan akan otomatis menyesuaikan

### 4. Setting Browser (Opsional)
Jika tampilan masih tidak pas, coba setting berikut:

#### Chrome/Edge:
1. Tekan `Ctrl + 0` untuk reset zoom ke 100%
2. Pastikan zoom level di `100%` (cek di pojok kanan address bar)
3. Jika perlu, tekan `F11` untuk fullscreen

#### Jika Text Terlalu Kecil:
- Browser zoom sudah di-disable otomatis
- Ukuran font sudah dioptimalkan untuk jarak pandang 2-3 meter
- Jika masih terlalu kecil, bisa adjust di `frontend/src/styles/tv-display.css`

#### Jika Text Terlalu Besar:
- Pastikan browser zoom di 100%
- Cek resolusi TV sudah di 1920x1080

## Fitur yang Sudah Dioptimalkan

### ✅ Layout
- Padding dikurangi dari `p-6/8/10` ke `p-3/4/5`
- Margin dikurangi dari `mb-8` ke `mb-4`
- Tinggi tabel dioptimalkan: `max-h-[calc(100vh-260px)]`

### ✅ Typography
- Font data tabel: `text-base` (16px) - mudah dibaca dari jarak 2-3m
- Font header tabel: `text-xs` (12px)
- Font status badge: `text-xs` (12px)
- Icon size: `w-4 h-4` untuk header

### ✅ Spacing
- Gap antar elemen: `gap-3` (12px)
- Padding row: `py-3` (12px vertical)
- Padding horizontal: `px-4 lg:px-6`

### ✅ Stats Cards
- Padding: `p-3` (compact)
- Icon size: `w-8 h-8`
- Font value: `text-xl` (20px)

### ✅ Auto-Refresh
- Otomatis refresh setiap 30 detik
- Tidak perlu interaksi manual

## Troubleshooting

### Tampilan Terpotong
1. Pastikan browser zoom di 100% (`Ctrl + 0`)
2. Tekan F11 untuk fullscreen
3. Refresh halaman (`F5`)

### Text Terlalu Kecil/Besar
1. Cek resolusi TV: harus 1920x1080
2. Cek browser zoom: harus 100%
3. Jika masih tidak pas, edit `frontend/src/styles/tv-display.css`

### Scroll Tidak Smooth
- Marquee speed sudah dioptimalkan
- Hover pada tabel untuk pause scroll
- Speed: 15px/second (konstan)

### Browser Crash/Lag
- Gunakan Chrome/Edge (lebih stabil)
- Tutup tab lain yang tidak digunakan
- Restart browser jika perlu

## Tips Penggunaan

1. **Jarak Pandang Optimal**: 2-3 meter dari TV
2. **Pencahayaan**: Hindari silau langsung ke layar TV
3. **Auto-Refresh**: Biarkan halaman terbuka, akan update otomatis
4. **Fullscreen**: Selalu gunakan mode fullscreen (F11)
5. **Browser**: Chrome/Edge lebih stabil untuk display 24/7

## Kustomisasi Lanjutan

Jika ingin adjust ukuran font atau spacing:

### Edit Font Size
File: `frontend/src/pages/SchedulePage.jsx`

Cari dan ubah class:
- `text-base` → `text-lg` (lebih besar)
- `text-base` → `text-sm` (lebih kecil)

### Edit Spacing
File: `frontend/src/pages/SchedulePage.jsx`

Cari dan ubah class:
- `gap-3` → `gap-4` (lebih lebar)
- `py-3` → `py-4` (lebih tinggi)
- `px-4` → `px-6` (lebih lebar)

### Edit Tinggi Tabel
File: `frontend/src/pages/SchedulePage.jsx`

Cari: `max-h-[calc(100vh-260px)]`
Ubah: `max-h-[calc(100vh-240px)]` (lebih tinggi)

## Support

Jika masih ada masalah dengan tampilan di TV, hubungi tim development dengan info:
- Ukuran TV
- Resolusi TV
- Browser yang digunakan
- Screenshot tampilan
