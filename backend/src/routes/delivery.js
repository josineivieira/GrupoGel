const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const mockdb = require("../mockdb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================
// Upload config
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Será dinâmico: baseado no deliveryNumber
    // Por enquanto cria pasta com ID do usuário, será ajustado no handler
    const dir = path.join(__dirname, "../uploads");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Nome será ajustado no handler
    cb(null, file.originalname);
  }
});

const upload = multer({ auth, storage });

// =======================
// Criar entrega
// POST /api/deliveries
// =======================
router.post("/", auth, async (req, res) => {
  try {
    const { deliveryNumber, vehiclePlate, observations } = req.body;

    if (!deliveryNumber) {
      return res.status(400).json({ message: "Número da entrega obrigatório" });
    }

    const driver = mockdb.findById("drivers", req.user.id);

    const delivery = mockdb.create("deliveries", {
      deliveryNumber,
      vehiclePlate,
      observations,
      userId: req.user.id,
      userName: driver?.fullName || "Unknown",
      status: "draft",
      documents: {}
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
  const deliveries = mockdb.find("deliveries", { userId: req.user.id }).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ deliveries });
});

// =======================
// Buscar entrega
// GET /api/deliveries/:id
// =======================
router.get("/:id", auth, async (req, res) => {
  const delivery = mockdb.findById("deliveries", req.params.id);
  if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });
  res.json({ delivery });
});

// =======================
// Upload documento
// POST /api/deliveries/:id/documents/:type
// =======================
router.post("/:id/documents/:type", auth, upload.single("file"), async (req, res) => {
  try {
    const { id, type } = req.params;

    const delivery = mockdb.findById("deliveries", id);
    if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

    // Mapeia nomes amigáveis para abreviaturas
    const typeNames = {
      canhotNF: "NF",
      canhotCTE: "CTE",
      diarioBordo: "DIARIO",
      devolucaoVazio: "DEVOLUCAO",
      retiradaCheio: "RETIRADA"
    };

    const filename = typeNames[type] || type;
    const containerFolder = delivery.deliveryNumber; // Numero do container é o número da entrega
    const containerDir = path.join(__dirname, "../uploads", containerFolder);

    // Cria pasta se não existir
    fs.mkdirSync(containerDir, { recursive: true });

    // Gera nome do arquivo com extensão original
    const originalExt = path.extname(req.file.originalname) || ".jpg";
    const finalFilename = `${filename}${originalExt}`;
    const finalPath = path.join(containerDir, finalFilename);

    // Move arquivo do temp para local definitivo
    const tempPath = req.file.path;
    fs.renameSync(tempPath, finalPath);

    // Armazena caminho relativo (para servir depois)
    const relativePath = path.join(containerFolder, finalFilename).replace(/\\/g, "/");

    // Atualiza documento na entrega
    const docs = delivery.documents || {};
    docs[type] = relativePath;
    mockdb.updateOne("deliveries", { _id: id }, { documents: docs });

    res.json({ delivery: mockdb.findById("deliveries", id) });
  } catch (err) {
    console.error("Erro ao upload:", err);
    res.status(500).json({ message: "Erro ao fazer upload", error: err.message });
  }
});

// =======================
// Enviar entrega
// POST /api/deliveries/:id/submit
// =======================
router.post("/:id/submit", auth, async (req, res) => {
  const delivery = mockdb.findById("deliveries", req.params.id);
  if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

  mockdb.updateOne("deliveries", { _id: req.params.id }, { status: "submitted", submittedAt: new Date() });

  res.json({ message: "Entrega enviada com sucesso" });
});

// =======================
// Deletar rascunho
// DELETE /api/deliveries/:id
// =======================
router.delete("/:id", auth, async (req, res) => {
  const delivery = mockdb.findById("deliveries", req.params.id);
  if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });

  if (delivery.status !== "draft") {
    return res.status(400).json({ message: "Entrega enviada não pode ser deletada" });
  }

  mockdb.deleteOne("deliveries", { _id: req.params.id });
  res.json({ message: "Entrega deletada" });
});

module.exports = router;
