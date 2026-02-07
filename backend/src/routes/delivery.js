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
      userName: driver?.fullName || driver?.name || driver?.username || "Unknown",
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
    console.log(`[UPLOAD] Iniciando upload para entrega ${id}, tipo ${type}`);
    console.log(`[UPLOAD] req.files:`, req.files);
    const db = await getDb(req);
    const delivery = await db.findById("deliveries", id);
    if (!delivery) {
      console.error(`[UPLOAD] Entrega não encontrada: ${id}`);
      return res.status(404).json({ message: "Entrega não encontrada" });
    }

    const typeNames = {
      canhotNF: "NF",
      canhotCTE: "CTE",
      diarioBordo: "DIARIO",
      devolucaoVazio: "DEVOLUCAO",
      retiradaCheio: "RETIRADA",
      ricAbastecimento: "RIC_AB",
      ricBaixa: "RIC_BAIXA",
      ricColeta: "RIC_COLETA",
      discoTacografo: "DISCO"
    };
    const baseName = typeNames[type] || type;
    const containerFolder = delivery.deliveryNumber;
    const city = req.city || 'manaus';
    const containerDir = path.join(__dirname, "../uploads", city, containerFolder);
    try {
      fs.mkdirSync(containerDir, { recursive: true });
    } catch (err) {
      console.error(`[UPLOAD] Falha ao criar pasta: ${containerDir}`, err);
      return res.status(500).json({ message: "Erro ao criar pasta de upload", error: err.message });
    }

    const docs = delivery.documents || {};
    if (docs[type] && !Array.isArray(docs[type])) {
      docs[type] = [docs[type]];
    }

    const savedDriveFiles = [];
    let uploadFileToDrive = null;
    try {
      uploadFileToDrive = require("../storage/gdrive").uploadFileToDrive;
    } catch (err) {
      console.warn('[UPLOAD] Google Drive module unavailable:', err && err.message ? err.message : err);
    }

    if (req.files && req.files.length) {
      for (let idx = 0; idx < req.files.length; idx++) {
        const file = req.files[idx];
        const originalExt = path.extname(file.originalname) || ".jpg";
        const finalFilename = `${baseName}_${Date.now()}_${idx}${originalExt}`;
        console.log(`[UPLOAD] Processando arquivo: ${file.originalname}, destino: ${finalFilename}`);
        
        let uploadSuccess = false;
        
        // Tenta upload ao Google Drive PRIMEIRO
        if (typeof uploadFileToDrive === 'function') {
          try {
            console.log(`[UPLOAD] Tentando upload para Google Drive: ${finalFilename}`);
            const fileBuffer = file.buffer || fs.readFileSync(file.path);
            console.log(`[UPLOAD] Buffer preparado, tamanho: ${fileBuffer.length} bytes`);
            const driveFile = await uploadFileToDrive(fileBuffer, finalFilename, file.mimetype);
            console.log(`[UPLOAD] Resposta do Google Drive:`, driveFile);
            savedDriveFiles.push({ id: driveFile.id, name: finalFilename, link: driveFile.webViewLink || driveFile.webContentLink });
            console.log(`[UPLOAD] ✓ Upload Google Drive OK: ${finalFilename} (ID: ${driveFile.id})`);
            uploadSuccess = true;
          } catch (err) {
            console.error(`[UPLOAD] ✗ Google Drive upload falhou para ${file.originalname}:`, err && err.message ? err.message : err);
            console.error(`[UPLOAD] Stack trace:`, err && err.stack ? err.stack : 'N/A');
          }
        } else {
          console.warn(`[UPLOAD] Google Drive função não disponível, usando fallback local`);
        }
        
        // Se Google Drive falhou ou não está disponível, tenta salvar localmente (fallback)
        if (!uploadSuccess) {
          try {
            console.log(`[UPLOAD] Iniciando fallback para armazenamento local`);
            const dest = path.join(containerDir, finalFilename);
            console.log(`[UPLOAD] Destino local: ${dest}`);
            
            let fileBuffer;
            if (file.path && fs.existsSync(file.path)) {
              console.log(`[UPLOAD] Arquivo temporário existe em: ${file.path}`, 'tamanho:', fs.statSync(file.path).size);
              fs.renameSync(file.path, dest);
              console.log(`[UPLOAD] Arquivo movido para destino`);
            } else if (file.buffer) {
              console.log(`[UPLOAD] Usando buffer direto, tamanho:`, file.buffer.length);
              fs.writeFileSync(dest, file.buffer);
              console.log(`[UPLOAD] Arquivo escrito no disco`);
            } else {
              console.warn(`[UPLOAD] ✗ Nenhum dado de arquivo disponível para ${file.originalname}`);
              continue;
            }
            
            savedDriveFiles.push({ name: finalFilename, path: path.join(city, containerFolder, finalFilename) });
            console.log(`[UPLOAD] ✓ Arquivo salvo localmente com sucesso: ${finalFilename}`);
            uploadSuccess = true;
          } catch (err) {
            console.error(`[UPLOAD] ✗ Falha ao salvar localmente ${file.originalname}:`, err && err.message ? err.message : err);
            console.error(`[UPLOAD] Stack trace:`, err && err.stack ? err.stack : 'N/A');
          }
        }
        
        if (!uploadSuccess) {
          console.error(`[UPLOAD] ✗ FALHA TOTAL: arquivo ${file.originalname} não foi salvo em lugar nenhum`);
        }
      }

      if (req.files.length > 0 && savedDriveFiles.length === 0) {
        console.error('[UPLOAD] Nenhum arquivo foi salvo durante upload. Aborting.');
        return res.status(500).json({ message: 'Erro ao fazer upload: nenhum arquivo salvo (verifique configuração de Google Drive ou permissão de pasta)' });
      }

      // Merge existing docs and newly saved files, parsing stored JSON strings if necessary
      let existing = docs[type];
      if (existing && typeof existing === 'string') {
        try {
          existing = JSON.parse(existing);
        } catch (e) {
          // if parsing fails, keep as single entry
          existing = [existing];
        }
      }
      existing = existing || [];
      if (!Array.isArray(existing)) existing = [existing];

      // savedDriveFiles contains objects like { name, path } or { id, name, link }
      const combined = existing.concat(savedDriveFiles || []);

      // Deduplicate by path or name (prefer path if available)
      const seen = new Set();
      const deduped = [];
      for (const item of combined) {
        const key = (item && (item.path || item.link || item.name || item.id)) || JSON.stringify(item);
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
      }

      // normalize: store arrays as JSON string, single item as string/object as before
      const normalizedDocs = {};
      for (const [k, v] of Object.entries(docs)) {
        if (k === type) continue; // we'll set it below
        normalizedDocs[k] = Array.isArray(v) ? JSON.stringify(v) : v;
      }

      normalizedDocs[type] = deduped.length === 0 ? null : JSON.stringify(deduped);

      try {
        await db.updateOne("deliveries", { _id: id }, { documents: normalizedDocs });
      } catch (err) {
        console.error(`[UPLOAD] Falha ao atualizar documentos no banco:`, err);
        return res.status(500).json({ message: "Erro ao salvar documentos no banco", error: err.message });
      }
    } else {
      console.warn('[UPLOAD] Nenhum arquivo recebido no upload.');
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }
    const updated = await db.findById("deliveries", id);
    res.json({ delivery: normalizeDeliveryForResponse(updated) });
  } catch (err) {
    console.error("[UPLOAD] Erro geral ao upload:", err);
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
  try {
    const db = await getDb(req);
    console.log('📩 Submit request', { id: req.params.id, body: req.body, headers: { 'x-city': req.header('x-city'), host: req.headers.host } });

    const delivery = await db.findById('deliveries', req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    // Check ownership: prefer driverId if present, else userId
    const ownerId = (delivery.driverId && String(delivery.driverId)) || (delivery.userId && String(delivery.userId));
    if (ownerId && ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Check if already submitted
    if (delivery.status === 'submitted') {
      return res.status(400).json({ success: false, message: 'Entrega já foi enviada' });
    }

    // Helper to determine if a document field has any files
    const docHasFiles = (val) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'string') {
        // may be JSON string of array
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed.length > 0;
          return Boolean(parsed);
        } catch (e) {
          return Boolean(val && val.trim());
        }
      }
      if (typeof val === 'object') {
        return Object.keys(val).length > 0;
      }
      return Boolean(val);
    };

    // Determine required docs for city
    const city = delivery.city || req.city || 'manaus';
    const requiredDocs = city === 'itajai'
      ? ['ricAbastecimento', 'diarioBordo', 'ricBaixa', 'ricColeta', 'discoTacografo']
      : ['canhotNF', 'canhotCTE', 'diarioBordo', 'devolucaoVazio', 'retiradaCheio'];

    const missingDocs = requiredDocs.filter(doc => !docHasFiles(delivery.documents && delivery.documents[doc]));

    const { force, observation } = req.body || {};
    console.log('  -> missingDocs:', missingDocs, 'force:', force, 'observation:', observation);

    if (missingDocs.length > 0) {
      if (!force) {
        return res.status(400).json({ message: 'Documentos obrigatórios faltando: ' + missingDocs.join(', ') });
      }
      if (!observation || !String(observation || '').trim()) {
        return res.status(400).json({ message: 'Observação obrigatória para finalizar com documentos faltando' });
      }

      // Record that submit was forced
      const updates = { status: 'submitted', submittedAt: new Date(), submissionObservation: String(observation).trim(), submissionForce: true, missingDocumentsAtSubmit: missingDocs };
      await db.updateOne('deliveries', { _id: req.params.id }, updates);

      const deliveryAfterUpdate = await db.findById('deliveries', req.params.id);
      return res.json({ message: 'Entrega enviada com sucesso (forçada)', delivery: deliveryAfterUpdate });
    }

    // No missing docs, mark as submitted
    await db.updateOne('deliveries', { _id: req.params.id }, { status: 'submitted', submittedAt: new Date() });
    const deliveryAfterUpdate = await db.findById('deliveries', req.params.id);
    return res.json({ success: true, message: 'Entrega enviada com sucesso', delivery: deliveryAfterUpdate });
  } catch (err) {
    console.error('Erro no submit:', err);
    return res.status(500).json({ message: 'Erro ao enviar entrega', error: err.message });
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
