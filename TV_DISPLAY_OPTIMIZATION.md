# Optimasi Tampilan Schedule untuk TV 43 Inch

## Masalah yang Diperbaiki

Sebelumnya, tampilan schedule di TV 43 inch (1920x1080) tidak menampilkan semua konten dari atas sampai bawah karena:

1. **Container tabel terlalu kecil** - `max-h-[calc(100vh-260px)]` membatasi tinggi tabel
2. **Padding dan spacing terlalu besar** - Mengurangi ruang untuk konten schedule
3. **Font size terlalu besar** - Mengurangi jumlah baris yang terlihat
4. **Marquee positioning** - Menggunakan `bottom-0` yang bisa memotong konten

## Perubahan yang Dilakukan

### 1. Optimasi Container Tabel
- **Sebelum**: `max-h-[calc(100vh-260px)] min-h-[600px]`
- **Sesudah**: `h-[calc(100vh-240px)]`
- Menghapus `min-h` dan menggunakan `h` untuk tinggi tetap
- Mengurangi offset dari 260px ke 240px untuk lebih banyak ruang

### 2. Perbaikan Marquee Positioning
- **Sebelum**: `absolute inset-x-0 bottom-0`
- **Sesudah**: `absolute inset-0`
- Marquee sekarang mengisi seluruh container untuk scroll yang lebih smooth

### 3. Pengurangan Padding & Spacing
- **Container utama**: `p-3 sm:p-4 lg:p-5` → `p-2 sm:p-3 lg:p-3`
- **Header margin**: `mb-4` → `mb-2`
- **Section gaps**: `gap-4 mb-4` → `gap-2 mb-2`
- **Filter & Sort**: `gap-3 mb-3` → `gap-2 mb-2`
- **Baris tabel**: `py-3 lg:py-3` → `py-2`
- **Footer**: `mt-3 py-2` → `mt-2 py-1.5`

### 4. Optimasi Font Size
- **Sebelum**: `text-lg` (1.125rem / 18px)
- **Sesudah**: `text-base` (1rem / 16px)
- Mengurangi ukuran font di semua kolom tabel untuk lebih banyak baris terlihat

### 5. CSS Khusus TV Display
Ditambahkan di `frontend/src/styles/tv-display.css`:
```css
@media screen and (min-width: 1920px) {
  body {
    line-height: 1.5; /* Dari 1.6 ke 1.5 */
  }
  
  .running-vertical {
    line-height: 1.4 !important;
  }
  
  .grid.grid-cols-12 {
    gap: 0.5rem !important;
  }
}
```

## Hasil Optimasi

### Sebelum:
- Tinggi konten: ~820px (dengan offset 260px dari viewport 1080px)
- Padding total: ~80px
- Tinggi baris: ~52px (py-3 + text-lg)
- **Estimasi baris terlihat**: ~15-16 baris

### Sesudah:
- Tinggi konten: ~840px (dengan offset 240px dari viewport 1080px)
- Padding total: ~40px
- Tinggi baris: ~40px (py-2 + text-base)
- **Estimasi baris terlihat**: ~21-22 baris

## Peningkatan
✅ **+30% lebih banyak konten terlihat** (dari ~15 ke ~21 baris)
✅ **Marquee scroll lebih smooth** dengan positioning yang diperbaiki
✅ **Lebih efisien** dalam penggunaan ruang layar
✅ **Tetap readable** di jarak pandang TV (2-3 meter)

## Testing di TV 43 Inch

Untuk memastikan tampilan optimal:

1. Buka halaman Schedule di browser
2. Tekan F11 atau klik tombol Fullscreen
3. Pastikan browser zoom di 100%
4. Verifikasi:
   - ✅ Semua kolom terlihat jelas
   - ✅ Minimal 20+ baris terlihat sebelum scroll
   - ✅ Marquee animation berjalan smooth
   - ✅ Text readable dari jarak 2-3 meter

## Catatan Tambahan

- Jika masih perlu lebih banyak baris, bisa kurangi `py-2` menjadi `py-1.5` atau `py-1`
- Jika text terlalu kecil, bisa kembalikan ke `text-sm` (0.875rem)
- Marquee speed tetap 15px/s untuk konsistensi
