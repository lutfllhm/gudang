# TV Display Mode Setup

## Perubahan yang Dilakukan

Aplikasi Schedule Board telah dioptimalkan untuk tampilan di TV 43 inch dengan auto-zoom yang membuat tampilan terlihat seperti zoom 60% tanpa perlu manual zoom browser.

### 1. CSS Auto-Zoom untuk TV (frontend/src/index.css)

Ditambahkan media queries untuk auto-zoom berdasarkan resolusi layar:

- **1920px+ (Full HD)**: Zoom 70%
- **2560px+ (2K)**: Zoom 65%
- **3840px+ (4K)**: Zoom 60%

```css
.tv-display-mode {
  zoom: 0.7; /* untuk 1920px+ */
}
```

### 2. Optimasi Layout (frontend/src/pages/SchedulePage.jsx)

#### Perubahan Spacing:
- Padding container: `p-4` → `p-3`
- Gap stats cards: `gap-3 mb-3` → `gap-2 mb-2`
- Gap filter/sort: `gap-3 mb-3` → `gap-2 mb-2`
- Padding stats cards: `p-4 lg:p-5` → `p-3 lg:p-4`

#### Perubahan Font Size:
- **Title**: `text-3xl sm:text-4xl lg:text-5xl xl:text-6xl` → `text-2xl sm:text-3xl lg:text-4xl xl:text-5xl`
- **Clock**: `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl` → `text-3xl sm:text-4xl lg:text-5xl xl:text-6xl`
- **Table Header Icons**: `w-6 h-6 lg:w-7 lg:h-7` → `w-5 h-5 lg:w-6 lg:h-6`
- **Table Row Text**: `text-xl lg:text-2xl xl:text-3xl` → `text-lg lg:text-xl xl:text-2xl`
- **Status Badge**: `text-base lg:text-lg` → `text-sm lg:text-base`
- **Stats Card Icon**: `w-12 h-12 lg:w-14 lg:h-14` → `w-10 h-10 lg:w-12 lg:h-12`
- **Stats Card Label**: `text-xs lg:text-sm` → `text-[10px] lg:text-xs`
- **Stats Card Value**: `text-2xl lg:text-3xl xl:text-4xl` → `text-xl lg:text-2xl xl:text-3xl`

#### Perubahan Tinggi Tabel:
- `h-[calc(100vh-280px)]` → `h-[calc(100vh-240px)]` (lebih banyak ruang untuk tabel)

### 3. Animasi Marquee

Ditambahkan animasi untuk auto-scroll tabel secara vertikal dengan kecepatan konstan 15px/detik.

## Cara Penggunaan

1. **Klik menu Schedule di aplikasi**
2. **Halaman akan otomatis masuk fullscreen mode**
3. **Tampilan akan otomatis ter-zoom sesuai resolusi TV**

## Perubahan UI

### Tombol yang Dihapus:
- ❌ Tombol "Kembali" - dihapus untuk tampilan TV yang lebih clean

### Tombol yang Tersisa:
- ✅ Tombol Refresh (icon sync) - ukuran diperbesar untuk TV
- ✅ Tombol Fullscreen/Exit Fullscreen - ukuran diperbesar untuk TV

### Auto Fullscreen:
- Halaman Schedule otomatis masuk fullscreen saat dibuka
- Tidak perlu tekan F11 manual lagi

## Hasil

- ✅ Tampilan di TV 43 inch akan terlihat seperti zoom 60%
- ✅ Tabel data terlihat lengkap dengan semua kolom
- ✅ Stats cards tetap terlihat jelas
- ✅ Filter dan sorting mudah dibaca
- ✅ Auto-scroll marquee untuk data yang panjang

## Testing

Untuk testing di browser desktop:
1. Buka Developer Tools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Set resolusi ke 1920x1080 atau lebih besar
4. Refresh halaman

## Catatan

- Zoom otomatis hanya aktif pada resolusi ≥ 1920px (Full HD)
- Untuk TV dengan resolusi lebih rendah, tampilan akan menggunakan responsive design normal
- Jika perlu adjust zoom level, edit nilai di `frontend/src/index.css` pada section `TV Display Mode`
