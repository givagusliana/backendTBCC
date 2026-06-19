const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000; // Menggunakan port 5000 agar tidak bentrok dengan frontend

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Konfigurasi Koneksi Database MariaDB/MySQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

// 3. Definisi Model/Tabel Vendors (Sesuai dengan data Wedding Organizer Anda)
const Vendor = sequelize.define('Vendor', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nama_vendor: { type: DataTypes.STRING, allowNull: false },
  kategori: { type: DataTypes.STRING, allowNull: false },
  harga: { type: DataTypes.INTEGER, allowNull: false },
  deskripsi: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'vendors',
  timestamps: false
});

// Sync database agar tabel sinkron otomatis dengan backend
sequelize.sync()
  .then(() => console.log('Database & tables synced!'))
  .catch(err => console.error('Error syncing database:', err));

// =========================================================================
// ENDPOINT WAJIB (Sesuai Instruksi Tugas Besar)
// =========================================================================

// GET /health - Mengecek status backend dan database
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate(); // Cek koneksi ke DB
    res.json({
      status: "success",
      message: "Backend is running",
      database: "connected",
      student: {
        name: "Giva Gusliana",
        nim: "2311523022"
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Backend is running, but database is not connected",
      database: "disconnected",
      student: {
        name: "Giva Gusliana",
        nim: "2311523022"
      }
    });
  }
});

// GET /schema - Untuk dibaca otomatis oleh Frontend asisten
app.get('/schema', (req, res) => {
  res.json({
    student: { name: "Giva Gusliana", nim: "2311523022" },
    resource: {
      name: "vendors",
      label: "Data Vendor Wedding",
      description: "Aplikasi untuk mengelola daftar vendor wedding organizer"
    },
    fields: [
      { name: "nama_vendor", label: "Nama Vendor", type: "text", required: true, showInTable: true },
      { name: "kategori", label: "Kategori", type: "text", required: true, showInTable: true },
      { name: "harga", label: "Harga (Rp)", type: "number", required: true, showInTable: true },
      { name: "deskripsi", label: "Deskripsi", type: "text", required: false, showInTable: true }
    ],
    endpoints: {
      list: "/vendors",
      detail: "/vendors/{id}",
      create: "/vendors",
      update: "/vendors/{id}",
      delete: "/vendors/{id}"
    }
  });
});

// GET /vendors - Mengambil semua data vendor
app.get('/vendors', async (req, res) => {
  try {
    const data = await Vendor.findAll();
    // Mengembalikan langsung array data agar langsung terbaca di tabel aplikasi penguji
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /vendors/:id - Mengambil detail satu vendor berdasarkan ID
app.get('/vendors/:id', async (req, res) => {
  try {
    const data = await Vendor.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /vendors - Menambahkan vendor baru ke database
app.post('/vendors', async (req, res) => {
  try {
    const newData = await Vendor.create(req.body);
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /vendors/:id - Mengubah data vendor berdasarkan ID
app.put('/vendors/:id', async (req, res) => {
  try {
    const data = await Vendor.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    await data.update(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /vendors/:id - Menghapus vendor dari database
app.delete('/vendors/:id', async (req, res) => {
  try {
    const data = await Vendor.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    await data.destroy();
    res.json({ success: true, message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API Wedding Organizer running successfully",
    student: {
      name: "Giva Gusliana",
      nim: "2311523022"
    }
  });
});

// Menjalankan Server
app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});