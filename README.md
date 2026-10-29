# KasirKita POS + Katalog Online

Sistem kasir digital (offline-first) dengan sinkronisasi **Google Sheets**, plus halaman **katalog toko** untuk pelanggan memesan via WhatsApp.

> Status: **setup sementara sudah berfungsi** — pastikan URL Web App Google Apps Script sudah diisi di kasir dan di katalog.

---

## Daftar file

| File | Fungsi |
|------|--------|
| `kasirkita_pos_sheets.html` | Aplikasi kasir (POS) + sync Google Sheets |
| `katalog_toko.html` | Katalog pelanggan (tanpa gambar, keranjang → WA) |
| `GoogleAppsScript_KasirKita.gs` | Backend API untuk Google Spreadsheet |
| `kasirkita_pos_v3.html` | Versi POS lokal saja (tanpa Sheets) — arsip |

---

## Fitur kasir (`kasirkita_pos_sheets.html`)

- Mesin kasir: cari produk, keranjang, checkout
- Metode pembayaran: Tunai, Transfer, QRIS, Kartu, E-Wallet, Lainnya
- Kelola produk (SKU, kategori, modal, jual, stok)
- Laporan: omzet, COGS, profit, grafik, riwayat transaksi
- Struk digital → unduh / bagikan sebagai **gambar PNG**
- Pengaturan profil toko (nama, alamat, WA, footer struk)
- Backup / restore JSON
- **Google Sheets**: produk, profil, transaksi tersimpan di cloud
- Cache lokal: tetap bisa dipakai saat offline

---

## Fitur katalog (`katalog_toko.html`)

- Tampilan modern, responsif (HP & desktop)
- Tanpa gambar produk & tanpa halaman detail (sengaja ringkas)
- Cari + filter kategori
- Keranjang multi-item + jumlah
- Pesan via WhatsApp (daftar item + total otomatis)
- Data produk & profil toko dari **Google Sheets** (URL API di dalam kode)
- Link bersih (tidak menampilkan URL API ke pelanggan)

---

## Setup Google Sheets (wajib sekali)

### 1. Spreadsheet + Apps Script

1. Buat [Google Spreadsheet](https://sheets.google.com) baru.
2. **Extensions → Apps Script**.
3. Hapus kode default, paste seluruh isi `GoogleAppsScript_KasirKita.gs`.
4. Simpan project.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Deploy, salin URL yang berakhiran `/exec`.

Setelah mengubah script, selalu:

**Deploy → Manage deployments → Edit (pensil) → New version → Deploy**

### 2. Sheet yang dibuat otomatis

| Sheet | Isi |
|-------|-----|
| `Products` | id, sku, name, category, costPrice, sellPrice, stock |
| `Transactions` | id, date, customer, items, grandTotal, costTotal, profit, cashGiven, change, paymentMethod |
| `Settings` | storeName, storeAddress, storePhone, receiptFooter |

### 3. Hubungkan aplikasi kasir

1. Buka `kasirkita_pos_sheets.html` di browser (lebih baik lewat server/hosting, bukan `file://`).
2. Menu **Pengaturan → Database Google Sheets**.
3. Tempel URL Web App → **Simpan URL**.
4. **Uji koneksi API**.
5. **Kirim ke Sheets** (upload data lokal pertama kali).

Setelah itu, simpan produk / profil / transaksi akan ikut push ke spreadsheet (saat online).

### 4. Hubungkan katalog

1. Buka `katalog_toko.html` di editor.
2. Cari baris:

```js
const SHEETS_API_URL = 'https://script.google.com/macros/s/GANTI_DENGAN_ID_WEB_APP_ANDA/exec';
```

3. Ganti dengan **URL Web App yang sama** seperti di kasir.
4. Simpan, lalu host/upload file katalog.

Pelanggan cukup membuka:

```text
https://domain-anda.com/katalog_toko.html
```

---

## Alur data

```
┌──────────────────┐     online      ┌─────────────────────┐
│  Kasir (POS)     │ ◄─────────────► │  Google Spreadsheet │
│  + cache lokal   │                 │  Products           │
└──────────────────┘                 │  Transactions       │
                                     │  Settings           │
┌──────────────────┐     baca        └──────────┬──────────┘
│  Katalog toko    │ ◄──────────────────────────┘
│  (pelanggan)     │
└────────┬─────────┘
         │ pesanan
         ▼
   WhatsApp toko
```

| Kondisi | Perilaku |
|---------|----------|
| Kasir offline | Pakai cache LocalStorage |
| Kasir online + URL API terisi | Auto sync ke Sheets |
| Katalog online + URL di kode benar | Tampilkan produk & profil dari Sheets |
| API belum diisi di katalog | Tampil data contoh (fallback) |

---

## Saran hosting

- **Kasir**: bisa lokal / internal toko (PC kasir).
- **Katalog**: hosting publik (Netlify, Vercel, GitHub Pages, hosting biasa).
- Hindari membuka lewat `file://` saat uji sync — browser sering memblokir request ke Google.

Contoh uji lokal:

```bash
npx serve .
```

---

## Troubleshooting

| Masalah | Cek |
|---------|-----|
| Produk tidak masuk Sheets | URL disimpan? Deploy **Anyone**? Versi deployment terbaru? Klik **Kirim ke Sheets** |
| Uji koneksi gagal | URL harus `/exec`, akses Anyone, authorize script saat deploy pertama |
| Katalog masih data contoh | `SHEETS_API_URL` di kode katalog masih placeholder |
| Laporan kosong di kasir | Belum ada transaksi, atau belum **Ambil dari Sheets** |
| CORS / fetch error | Jangan pakai `file://`; host via `http(s)` |

---

## Catatan keamanan

- URL Web App bersifat **rahasia operasional** (bisa baca/tulis data toko).
- Jangan sebarkan URL di chat publik.
- Katalog: API disimpan di kode sumber (tidak di query string) agar link pelanggan tetap bersih; tetap batasi siapa yang bisa mengakses file sumber jika perlu.

---

## Versi

- Kasir Sheets: **v3.2**
- Katalog: desain ringkas + keranjang WA + Sheets
- Backend: Google Apps Script (`Products` · `Transactions` · `Settings`)

---

## Langkah singkat setelah clone / unduh

1. Deploy `GoogleAppsScript_KasirKita.gs` → dapatkan URL `/exec`.
2. Isi URL di kasir (Pengaturan) → Uji → Kirim ke Sheets.
3. Isi URL yang sama di `katalog_toko.html` (`SHEETS_API_URL`).
4. Host katalog, bagikan link ke pelanggan.
'''
)
print('README written')
ls -la /home/workdir/artifacts/README.md
