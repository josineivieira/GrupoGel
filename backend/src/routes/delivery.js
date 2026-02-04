const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================
// Upload config (disk by default, memory for S3)
// =======================
const useS3 = !!process.env.S3_BUCKET;
let upload;
if (useS3) {
  console.log('✓ S3 configured: using memoryStorage for multer');
  upload = multer({ storage: multer.memoryStorage() });
} else {
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
  upload = multer({ storage });
}

const s3 = useS3 ? require('../storage/s3') : null;
const { normalizeDeliveryForResponse } = require('../utils/storageUtils');

// Helper to normalize db (works with sync mockdb or async mongo adapter)
async function getDb(req) {
  const db = req.mockdb;
  if (!db) return db;
  // If the db methods already return promises, wrap them to await; otherwise still behave synchronously
  const wrapper = {};
  const methods = ['find','findOne','findById','create','updateOne','deleteOne'];
  methods.forEach(m => {
    if (typeof db[m] === 'function') {
      wrapper[m] = async (...args) => {
        const res = db[m](...args);
        if (res && typeof res.then === 'function') return await res;
        return res;
      };
    }
  });
  return wrapper;
}

// =======================
// Criar entrega
// POST /api/deliveries
// =======================
router.post("/", auth, async (req, res) => {
  try {
    const db = await getDb(req);
    const city = req.city || 'manaus';
    const { deliveryNumber, vehiclePlate, observations, driverName } = req.body;

    console.log('📦 Recebido no backend:', { deliveryNumber, vehiclePlate, observations, driverName, city });

    if (!deliveryNumber) {
      return res.status(400).json({ message: "Número da entrega obrigatório" });
    }

    const driver = await db.findById("drivers", req.user.id);

    const delivery = await db.create("deliveries", {
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
  try {
    const db = await getDb(req);
    const { status, q } = req.query;
    const query = { userId: req.user.id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Support free-text search across deliveryNumber, driverName and vehiclePlate
    if (q && String(q).trim() !== '') {
      const term = String(q).trim();
      query.$or = [
        { deliveryNumber: { $regex: term } },
        { driverName: { $regex: term } },
        { vehiclePlate: { $regex: term } }
      ];
    }
    
    let deliveries = await db.find("deliveries", query);
    // Ensure array and sort by createdAt desc
    deliveries = (deliveries || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Normalize documents for response
    deliveries = deliveries.map(d => normalizeDeliveryForResponse(d));
    res.json({ deliveries });
  } catch (err) {
    console.error('Error fetching deliveries', err);
    res.status(500).json({ message: 'Erro ao buscar entregas' });
  }
});

// =======================
// Buscar entrega
// GET /api/deliveries/:id
// =======================
router.get("/:id", auth, async (req, res) => {
  try {
    const db = await getDb(req);
    const delivery = await db.findById("deliveries", req.params.id);
    if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });
    res.json({ delivery: normalizeDeliveryForResponse(delivery) });
  } catch (err) {
    console.error('Error fetching delivery', err);
    res.status(500).json({ message: 'Erro ao buscar entrega' });
  }
});

// =======================
// Upload documento (aceita múltiplos arquivos)
// POST /api/deliveries/:id/documents/:type
// =======================
router.post("/:id/documents/:type", auth, upload.array("file"), async (req, res) => {
  try {
    const { id, type } = req.params;

    const db = await getDb(req);
    const delivery = await db.findById("deliveries", id);
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

    // Normaliza docs existentes para array (runtime)
    const docs = delivery.documents || {};
    if (docs[type] && !Array.isArray(docs[type])) {
      docs[type] = [docs[type]];
    }

    // Processa arquivos enviados
    const savedPaths = [];
    if (req.files && req.files.length) {
      // If we are using S3, files are in memory (buffer)
      if (useS3 && s3) {
        for (let idx = 0; idx < req.files.length; idx++) {
          const file = req.files[idx];
          const originalExt = path.extname(file.originalname) || '.jpg';
          const finalFilename = `${baseName}_${Date.now()}_${idx}${originalExt}`;
          const key = `${city}/${containerFolder}/${finalFilename}`.replace(/\\/g, '/');
          try {
            const url = await s3.uploadBuffer(file.buffer, key, file.mimetype);
            savedPaths.push(url);
          } catch (err) {
            console.error('S3 upload failed for', file.originalname, err);
          }
        }

        docs[type] = (docs[type] || []).concat(savedPaths);
        // For Mongo compatibility, store as comma-separated string
        const normalizedDocs = {};
        for (const [k, v] of Object.entries(docs)) {
          normalizedDocs[k] = Array.isArray(v) ? v.join(',') : v;
        }
        await db.updateOne("deliveries", { _id: id }, { documents: normalizedDocs });
      } else {
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
        // For Mongo compatibility, store as comma-separated string
        const normalizedDocs = {};
        for (const [k, v] of Object.entries(docs)) {
          normalizedDocs[k] = Array.isArray(v) ? v.join(',') : v;
        }
        await db.updateOne("deliveries", { _id: id }, { documents: normalizedDocs });
      }
    }

    const updated = await db.findById("deliveries", id);
    res.json({ delivery: normalizeDeliveryForResponse(updated) });
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
    const db = await getDb(req);
    const delivery = await db.findById('deliveries', id);
    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    const docs = delivery.documents || {};
    const docEntry = docs[type];

    if (!docEntry) return res.status(404).json({ message: 'Documento não encontrado' });

    const idx = parseInt(index, 10);

    const city = req.city || 'manaus';

    // Se for string simples, só remove
    if (!Array.isArray(docEntry)) {
      const entry = docEntry;
      // If S3 URL, attempt to delete by key
      if (entry && entry.startsWith && entry.startsWith('http') && useS3) {
        try {
          // Expecting https://{bucket}.s3.{region}.amazonaws.com/{key}
          const url = new URL(entry);
          const key = url.pathname.replace(/^\//, '');
          await s3.deleteKey(key);
        } catch (err) {
          console.warn('Failed to delete from S3:', err.message);
        }
      } else {
        // remove file from disk
        const filePath = path.join(__dirname, '../uploads', city, entry);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      docs[type] = null;
      await db.updateOne('deliveries', { _id: id }, { documents: docs });
      const updated = await db.findById('deliveries', id);
      return res.json({ delivery: updated });
    }

    // Array: remove índice
    if (idx < 0 || idx >= docEntry.length) return res.status(400).json({ message: 'Índice inválido' });

    const removed = docEntry.splice(idx, 1)[0];

    if (removed && removed.startsWith && removed.startsWith('http') && useS3) {
      try {
        const url = new URL(removed);
        const key = url.pathname.replace(/^\//, '');
        await s3.deleteKey(key);
      } catch (err) {
        console.warn('Failed to delete from S3:', err.message);
      }
    } else {
      const filePath = path.join(__dirname, '../uploads', city, removed);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Normaliza: se ficar vazio, define null
    docs[type] = docEntry.length ? docEntry : null;
    await db.updateOne('deliveries', { _id: id }, { documents: docs });

    const updated = await db.findById('deliveries', id);
    res.json({ delivery: updated });
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
const { deleteDeliveryFiles, normalizeEntries } = require('../utils/storageUtils');

router.delete("/:id", auth, async (req, res) => {
  try {
    const db = req.mockdb;
    const delivery = await db.findById("deliveries", req.params.id);
    if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

    if (delivery.status !== "pending") {
      return res.status(400).json({ message: "Entrega enviada não pode ser deletada" });
    }

    // Remove associated files from disk/S3
    try {
      const removed = await deleteDeliveryFiles(delivery);
      console.log('🗑️ Removed files for delivery', req.params.id, removed);
    } catch (err) {
      console.warn('⚠️ Error while removing delivery files:', err.message || err);
    }

    await db.deleteOne("deliveries", { _id: req.params.id });
    return res.json({ message: "Entrega deletada" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao deletar entrega' });
  }
});

module.exports = router;
