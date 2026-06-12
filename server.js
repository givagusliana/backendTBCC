const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Konfigurasi Koneksi Database MariaDB di GCP Cloud
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

// 3. Definisi Model/Tabel Songs (Tema Unik)
const Song = sequelize.define('Song', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  artist: { type: DataTypes.STRING, allowNull: false },
  album: { type: DataTypes.STRING, allowNull: true },
  genre: { type: DataTypes.STRING, allowNull: true },
  duration_seconds: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'songs',
  timestamps: false
});

// Sinkronisasi Database
sequelize.sync()
  .then(() => console.log('Database & tables synced successfully!'))
  .catch(err => console.error('Error syncing database:', err));


// =========================================================================
// ENDPOINT REST API (Wajib Sesuai Dokumen Instruksi Asisten)
// =========================================================================

// GET /health - Mengecek status backend dan database cloud GCP (Sesuai Poin 7)
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
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

// GET /schema - Untuk dibaca otomatis oleh Frontend Penguji (Sesuai Poin 8)
app.get('/schema', (req, res) => {
  res.json({
    student: { name: "Giva Gusliana", nim: "2311523022" },
    resource: {
      name: "songs",
      label: "Data Lagu",
      description: "Aplikasi untuk mengelola daftar lagu favorit"
    },
    fields: [
      { name: "title", label: "Judul Lagu", type: "text", required: true, showInTable: true, searchable: true },
      { name: "artist", label: "Penyanyi / Musisi", type: "text", required: true, showInTable: true, searchable: true },
      { name: "album", label: "Album", type: "text", required: false, showInTable: true, searchable: true },
      { name: "genre", label: "Genre", type: "text", required: false, showInTable: true, searchable: true },
      { name: "duration_seconds", label: "Durasi (Detik)", type: "number", required: true, showInTable: true }
    ],
    endpoints: {
      list: "/songs",
      detail: "/songs/{id}",
      create: "/songs",
      update: "/songs/{id}",
      delete: "/songs/{id}"
    }
  });
});

// GET /songs - Mengambil semua data lagu (Sesuai Poin 9)
app.get('/songs', async (req, res) => {
  const startTime = Date.now();
  try {
    const searchKeyword = req.query.search || req.query.q || req.query.query || '';
    let options = {};
    
    if (searchKeyword) {
      options.where = {
        [Op.or]: [
          { title: { [Op.like]: `%${searchKeyword}%` } },
          { artist: { [Op.like]: `%${searchKeyword}%` } },
          { album: { [Op.like]: `%${searchKeyword}%` } },
          { genre: { [Op.like]: `%${searchKeyword}%` } }
        ]
      };
    }

    const data = await Song.findAll(options);
    const totalCount = await Song.count(options);
    const responseTime = Date.now() - startTime;

    // Response dibungkus rapi sesuai kebutuhan dashboard tester + format asisten
    res.json({
      status: "success",
      message: "Data retrieved successfully",
      data: data,
      total: totalCount,
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /songs/:id - Detail satu lagu
app.get('/songs/:id', async (req, res) => {
  try {
    const data = await Song.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    res.json({
      status: "success",
      message: "Data retrieved successfully",
      data: data
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /songs - Tambah lagu baru (Sesuai Poin 9)
app.post('/songs', async (req, res) => {
  try {
    const newData = await Song.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Data created successfully",
      data: newData
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /songs/:id - Ubah data lagu (Sesuai Poin 9)
app.put('/songs/:id', async (req, res) => {
  try {
    const data = await Song.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    await data.update(req.body);
    res.json({
      status: "success",
      message: "Data updated successfully",
      data: data
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /songs/:id - Hapus lagu (Sesuai Poin 9)
app.delete('/songs/:id', async (req, res) => {
  try {
    const data = await Song.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data tidak ditemukan" });
    
    await data.destroy();
    res.json({
      status: "success",
      message: "Data deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Root Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API songs running successfully",
    student: { name: "Giva Gusliana", nim: "2311523022" }
  });
});

app.listen(PORT, () => {
  console.log(`Server backend berjalan stabil di port ${PORT}`);
});