/**
 * KasirKita POS — Google Apps Script Backend
 * ==========================================
 * Menyimpan 3 jenis data di spreadsheet:
 *
 *  1. Products      → katalog & stok produk
 *  2. Transactions  → riwayat transaksi / sumber laporan (omzet, profit, dll.)
 *  3. Settings      → profil toko (nama, alamat, WA, footer struk)
 *
 * CARA SETUP:
 * 1. Buat Google Spreadsheet baru
 * 2. Extensions → Apps Script → paste seluruh kode ini
 * 3. Simpan → Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Salin URL /exec → tempel di Kasir (Pengaturan) & hardcode di katalog
 *
 * Setelah ubah kode: Deploy → Manage deployments → Edit → New version
 */

const SHEET_PRODUCTS = 'Products';
const SHEET_TRANSACTIONS = 'Transactions';
const SHEET_SETTINGS = 'Settings';

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    let body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (_) {}
    }
    const action = params.action || body.action || 'load';
    let result;
    switch (action) {
      case 'load':
        result = loadAll();
        break;
      case 'saveProducts':
        result = saveProducts(body.products || []);
        break;
      case 'saveTransactions':
        result = saveTransactions(body.transactions || []);
        break;
      case 'saveSettings':
        result = saveSettings(body.settings || {});
        break;
      case 'saveAll':
        if (body.products) saveProducts(body.products);
        if (body.transactions) saveTransactions(body.transactions);
        if (body.settings) saveSettings(body.settings);
        result = {
          ok: true,
          message: 'Produk, transaksi (laporan), dan profil toko tersimpan',
          counts: {
            products: (body.products || []).length,
            transactions: (body.transactions || []).length
          }
        };
        break;
      case 'ping':
        result = { ok: true, message: 'KasirKita API aktif', time: new Date().toISOString() };
        break;
      default:
        result = { ok: false, error: 'Action tidak dikenal: ' + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheets() {
  const ss = getSpreadsheet();

  // --- Products ---
  let sh = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_PRODUCTS);
    sh.appendRow(['id', 'sku', 'name', 'category', 'costPrice', 'sellPrice', 'stock']);
    sh.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  // --- Transactions (sumber laporan) ---
  sh = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_TRANSACTIONS);
    sh.appendRow([
      'id', 'date', 'customer', 'items',
      'grandTotal', 'costTotal', 'profit',
      'cashGiven', 'change', 'paymentMethod'
    ]);
    sh.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  // --- Settings / Profil toko ---
  sh = ss.getSheetByName(SHEET_SETTINGS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_SETTINGS);
    sh.appendRow(['key', 'value']);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
    sh.appendRow(['storeName', 'KasirKita Store']);
    sh.appendRow(['storeAddress', 'Jl. Merdeka Raya No. 123, Jakarta']);
    sh.appendRow(['storePhone', '0812-3456-7890']);
    sh.appendRow(['receiptFooter', 'Terima kasih telah berbelanja!']);
  }

  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (_) {}
  }
}

function loadAll() {
  ensureSheets();
  return {
    ok: true,
    products: loadProducts(),
    transactions: loadTransactions(),
    settings: loadSettings()
  };
}

function loadProducts() {
  const sh = getSpreadsheet().getSheetByName(SHEET_PRODUCTS);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    rows.push({
      id: String(r[0]),
      sku: String(r[1] || ''),
      name: String(r[2] || ''),
      category: String(r[3] || ''),
      costPrice: Number(r[4]) || 0,
      sellPrice: Number(r[5]) || 0,
      stock: Number(r[6]) || 0
    });
  }
  return rows;
}

function saveProducts(products) {
  ensureSheets();
  const sh = getSpreadsheet().getSheetByName(SHEET_PRODUCTS);
  sh.clearContents();
  sh.appendRow(['id', 'sku', 'name', 'category', 'costPrice', 'sellPrice', 'stock']);
  if (products && products.length) {
    const rows = products.map(p => [
      p.id, p.sku, p.name, p.category,
      Number(p.costPrice) || 0,
      Number(p.sellPrice) || 0,
      Number(p.stock) || 0
    ]);
    sh.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  return { ok: true, count: products ? products.length : 0 };
}

function loadTransactions() {
  const sh = getSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    let items = [];
    try {
      items = typeof r[3] === 'string' ? JSON.parse(r[3] || '[]') : (r[3] || []);
    } catch (_) { items = []; }
    rows.push({
      id: String(r[0]),
      date: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''),
      customer: String(r[2] || ''),
      items: items,
      grandTotal: Number(r[4]) || 0,
      costTotal: Number(r[5]) || 0,
      profit: Number(r[6]) || 0,
      cashGiven: Number(r[7]) || 0,
      change: Number(r[8]) || 0,
      paymentMethod: String(r[9] || 'Tunai')
    });
  }
  return rows;
}

function saveTransactions(transactions) {
  ensureSheets();
  const sh = getSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  sh.clearContents();
  sh.appendRow([
    'id', 'date', 'customer', 'items',
    'grandTotal', 'costTotal', 'profit',
    'cashGiven', 'change', 'paymentMethod'
  ]);
  if (transactions && transactions.length) {
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.customer,
      JSON.stringify(t.items || []),
      Number(t.grandTotal) || 0,
      Number(t.costTotal) || 0,
      Number(t.profit) || 0,
      Number(t.cashGiven) || 0,
      Number(t.change) || 0,
      t.paymentMethod || 'Tunai'
    ]);
    sh.getRange(2, 1, rows.length, 10).setValues(rows);
  }
  return { ok: true, count: transactions ? transactions.length : 0 };
}

function loadSettings() {
  const sh = getSpreadsheet().getSheetByName(SHEET_SETTINGS);
  const data = sh.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) settings[String(data[i][0])] = String(data[i][1] || '');
  }
  return settings;
}

function saveSettings(settings) {
  ensureSheets();
  const sh = getSpreadsheet().getSheetByName(SHEET_SETTINGS);
  sh.clearContents();
  sh.appendRow(['key', 'value']);
  // Pastikan field profil penting selalu ada
  const defaults = {
    storeName: '',
    storeAddress: '',
    storePhone: '',
    receiptFooter: ''
  };
  const merged = Object.assign({}, defaults, settings || {});
  const keys = Object.keys(merged);
  if (keys.length) {
    const rows = keys.map(k => [k, merged[k] == null ? '' : String(merged[k])]);
    sh.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  return { ok: true };
}
