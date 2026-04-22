# Integrasi Accurate Online (Production)

Dokumen ini merangkum hal penting agar integrasi Accurate berjalan aman di VPS.

## 1) Variabel environment wajib

Isi di file `.env.production`:

- `ACCURATE_APP_KEY`
- `ACCURATE_CLIENT_ID`
- `ACCURATE_CLIENT_SECRET`
- `ACCURATE_SIGNATURE_SECRET`
- `ACCURATE_REDIRECT_URI` (harus sama persis dengan yang didaftarkan di Developer Portal)

Opsional tapi sangat disarankan:

- `ACCURATE_DATABASE_ID` (wajib jika akun Accurate punya lebih dari 1 database)

## 2) Redirect URI yang benar

Untuk domain produksi contoh:

`https://iwareid.com/api/accurate/callback`

Kalau tidak sama persis dengan konfigurasi di Accurate Developer Portal, OAuth akan gagal.

## 3) Catatan API Accurate pada aplikasi ini

Aplikasi backend ini menerapkan pola **read-only** untuk endpoint data bisnis:

- scope OAuth utama: `item_view`, `sales_order_view`, `sales_invoice_view`, `customer_view`, `warehouse_view`
- pembatasan rate limit internal: maksimal **8 request/detik** dan **8 proses paralel**
- token disimpan di tabel `accurate_tokens`

## 4) Alur aktivasi setelah deploy

1. Login ke aplikasi sebagai admin.
2. Buka menu integrasi Accurate.
3. Klik connect/authorize.
4. Selesaikan login OAuth Accurate.
5. Verifikasi status token aktif dan database terpilih.

## 5) Troubleshooting cepat

- Error redirect/callback: cek `ACCURATE_REDIRECT_URI`.
- Error signature/webhook: cek `ACCURATE_SIGNATURE_SECRET`.
- Error database selection: isi `ACCURATE_DATABASE_ID`.
- Error rate limit: tunggu dan ulangi sinkronisasi.
