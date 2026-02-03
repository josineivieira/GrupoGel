const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================
// Upload config
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dinâmico por cidade
    const dir = path.join(__dirname, "../uploads", req.city || 'manaus');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Nome será ajustado no handler
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// =======================
// Criar entrega
// POST /api/deliveries
// =======================
router.post("/", auth, async (req, res) => {
  try {
    const db = req.mockdb;
    const city = req.city || 'manaus';
    const { deliveryNumber, vehiclePlate, observations, driverName } = req.body;

    console.log('📦 Recebido no backend:', { deliveryNumber, vehiclePlate, observations, driverName, city });

    if (!deliveryNumber) {
      return res.status(400).json({ message: "Número da entrega obrigatório" });
    }

    const driver = db.findById("drivers", req.user.id);

    const delivery = db.create("deliveries", {
      deliveryNumber,
      vehiclePlate,
      observations,
      driverName: driverName || "",
      userId: req.user.id,
      userName: driver?.fullName || "Unknown",
      status: "pending",
      documents: {},
      city
    });

    res.status(201).json({ delivery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar entrega" });
  }
});

// =======================
// Minhas entregas
// GET /api/deliveries
// =======================
router.get("/", auth, async (req, res) => {
  const db = req.mockdb;
  const { status } = req.query;
  const query = { userId: req.user.id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const deliveries = db.find("deliveries", query).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ deliveries });
});

// =======================
// Buscar entrega
// GET /api/deliveries/:id
// =======================
router.get("/:id", auth, async (req, res) => {
  const db = req.mockdb;
  const delivery = db.findById("deliveries", req.params.id);
  if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });
  res.json({ delivery });
});

// =======================
// Upload documento (aceita múltiplos arquivos)
// POST /api/deliveries/:id/documents/:type
// =======================
router.post("/:id/documents/:type", auth, upload.array("file"), async (req, res) => {
  try {
    const { id, type } = req.params;

    const db = req.mockdb;
    const delivery = db.findById("deliveries", id);
    if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

    // Mapeia nomes amigáveis para abreviaturas
    const typeNames = {
      // Manaus
      canhotNF: "NF",
      canhotCTE: "CTE",
      diarioBordo: "DIARIO",
      devolucaoVazio: "DEVOLUCAO",
      retiradaCheio: "RETIRADA",
      // Itajaí
      ricAbastecimento: "RIC_AB",
      ricBaixa: "RIC_BAIXA",
      ricColeta: "RIC_COLETA",
      discoTacografo: "DISCO"
    };

    const baseName = typeNames[type] || type;
    const containerFolder = delivery.deliveryNumber; // Numero do container é o número da entrega
    const city = req.city || 'manaus';
    const containerDir = path.join(__dirname, "../uploads", city, containerFolder);

    // Cria pasta se não existir
    fs.mkdirSync(containerDir, { recursive: true });

    // Normaliza docs existentes para array
    const docs = delivery.documents || {};
    if (docs[type] && !Array.isArray(docs[type])) {
      docs[type] = [docs[type]];
    }

    // Processa arquivos enviados
    const savedPaths = [];
    if (req.files && req.files.length) {
      req.files.forEach((file, idx) => {
        const originalExt = path.extname(file.originalname) || ".jpg";
        const finalFilename = `${baseName}_${Date.now()}_${idx}${originalExt}`;
        const finalPath = path.join(containerDir, finalFilename);
        const tempPath = file.path;
        fs.renameSync(tempPath, finalPath);
        const relativePath = path.join(containerFolder, finalFilename).replace(/\\/g, "/");
        savedPaths.push(relativePath);
      });

      docs[type] = (docs[type] || []).concat(savedPaths);
      const db = req.mockdb;
      db.updateOne("deliveries", { _id: id }, { documents: docs });
    }

    const db2 = req.mockdb;
    res.json({ delivery: db2.findById("deliveries", id) });
  } catch (err) {
    console.error("Erro ao upload:", err);
    res.status(500).json({ message: "Erro ao fazer upload", error: err.message });
  }
});

// =======================
// Deletar um documento específico por índice
// DELETE /api/deliveries/:id/documents/:type/:index
// =======================
router.delete('/:id/documents/:type/:index', auth, async (req, res) => {
  try {
    const { id, type, index } = req.params;
    const db = req.mockdb;
    const delivery = db.findById('deliveries', id);
    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    const docs = delivery.documents || {};
    const docEntry = docs[type];

    if (!docEntry) return res.status(404).json({ message: 'Documento não encontrado' });

    const idx = parseInt(index, 10);

    const city = req.city || 'manaus';

    // Se for string simples, só remove
    if (!Array.isArray(docEntry)) {
      // remove file from disk
      const filePath = path.join(__dirname, '../uploads', city, docEntry);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      docs[type] = null;
      db.updateOne('deliveries', { _id: id }, { documents: docs });
      return res.json({ delivery: db.findById('deliveries', id) });
    }

    // Array: remove índice
    if (idx < 0 || idx >= docEntry.length) return res.status(400).json({ message: 'Índice inválido' });

    const removed = docEntry.splice(idx, 1)[0];
    const filePath = path.join(__dirname, '../uploads', city, removed);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Normaliza: se ficar vazio, define null
    docs[type] = docEntry.length ? docEntry : null;
    db.updateOne('deliveries', { _id: id }, { documents: docs });

    res.json({ delivery: db.findById('deliveries', id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao deletar documento' });
  }
});

// =======================
// Enviar entrega
// POST /api/deliveries/:id/submit
// =======================
router.post("/:id/submit", auth, async (req, res) => {
  const db = req.mockdb;
  console.log('📩 Submit request to mock route', { id: req.params.id, body: req.body, headers: { 'x-city': req.header('x-city'), host: req.headers.host } });

  const delivery = db.findById("deliveries", req.params.id);
  if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

  // Validar documentos obrigatórios por cidade
  const city = delivery.city || req.city || 'manaus';
  const requiredDocs = city === 'itajai'
    ? ['ricAbastecimento', 'diarioBordo', 'ricBaixa', 'ricColeta', 'discoTacografo']
    : ['canhotNF', 'canhotCTE', 'diarioBordo', 'devolucaoVazio', 'retiradaCheio'];

  const missingDocs = requiredDocs.filter(doc => !delivery.documents || !delivery.documents[doc]);

  const { force, observation } = req.body || {};
  console.log('  -> missingDocs:', missingDocs, 'force:', force, 'observation:', observation);

  if (missingDocs.length > 0) {
    if (!force) {
      return res.status(400).json({ message: 'Documentos obrigatórios faltando: ' + missingDocs.join(', ') });
    }
    if (!observation || !String(observation || '').trim()) {
      return res.status(400).json({ message: 'Observação obrigatória para finalizar com documentos faltando' });
    }

    // Store metadata about forced submit
    const updates = { status: 'submitted', submittedAt: new Date(), submissionObservation: String(observation).trim(), submissionForce: true, missingDocumentsAtSubmit: missingDocs };
    db.updateOne("deliveries", { _id: req.params.id }, updates);


    console.log('  -> Submission forced saved for', req.params.id);
    return res.json({ message: "Entrega enviada com sucesso (forçada)", delivery: db.findById('deliveries', req.params.id) });
  } else {
    // No missing docs, mark as submitted
    db.updateOne('deliveries', { _id: req.params.id }, { status: 'submitted', submittedAt: new Date() });
    return res.json({ success: true, message: 'Entrega enviada com sucesso', delivery: db.findById('deliveries', req.params.id) });
  }
});

// =======================
// Deletar rascunho
// DELETE /api/deliveries/:id
// =======================
router.delete("/:id", auth, async (req, res) => {
  const db = req.mockdb;
  const delivery = db.findById("deliveries", req.params.id);
  if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

  if (delivery.status !== "pending") {
    return res.status(400).json({ message: "Entrega enviada não pode ser deletada" });
  }

  db.deleteOne("deliveries", { _id: req.params.id });
  res.json({ message: "Entrega deletada" });
});

module.exports = router;
