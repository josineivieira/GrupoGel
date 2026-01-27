const express = require("express");
const path = require("path");
const fs = require("fs");
const mockdb = require("../mockdb");
const auth = require("../middleware/auth");

const router = express.Router();

function onlyAdmin(req, res, next) {
  const role = req.user?.role || "operacao";
  if (role !== "admin" && role !== "gestor") {
    return res.status(403).json({ message: "Sem permissão" });
  }
  next();
}

/**
 * GET /api/admin/statistics
 * Retorna estatísticas gerais
 */
router.get("/statistics", auth, onlyAdmin, async (req, res) => {
  try {
    const deliveries = mockdb.find("deliveries", {});
    
    const totalDeliveries = deliveries.length;
    const submitted = deliveries.filter(d => d.status === "submitted").length;
    const draft = deliveries.filter(d => d.status === "draft").length;
    
    // Agrupa por transportadora (placa)
    const deliveriesByTransport = {};
    deliveries.forEach(d => {
      const transport = d.vehiclePlate || "Sem Placa";
      if (!deliveriesByTransport[transport]) {
        deliveriesByTransport[transport] = 0;
      }
      deliveriesByTransport[transport]++;
    });

    const dailyDeliveries = [];
    const daysMap = {};
    
    deliveries.forEach(d => {
      const date = new Date(d.createdAt).toISOString().split('T')[0];
      if (!daysMap[date]) {
        daysMap[date] = 0;
      }
      daysMap[date]++;
    });

    Object.entries(daysMap).forEach(([date, count]) => {
      dailyDeliveries.push({ _id: date, count });
    });

    const statistics = {
      totalDeliveries,
      submitted,
      draft,
      deliveriesByDriver: Object.entries(deliveriesByTransport).map(([transport, count]) => ({ _id: transport, count })),
      dailyDeliveries: dailyDeliveries.sort((a, b) => new Date(a._id) - new Date(b._id))
    };

    return res.json({ statistics });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
});

/**
 * GET /api/admin/deliveries
 * Lista todas entregas (admin/gestor)
 * filtros:
 *  - status=draft|submitted|all
 *  - q=texto
 */
router.get("/deliveries", auth, onlyAdmin, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;

    if (q && q.trim()) {
      const text = q.trim();
      filter.$or = [
        { deliveryNumber: { $regex: text, $options: "i" } },
        { vehiclePlate: { $regex: text, $options: "i" } },
        { userName: { $regex: text, $options: "i" } },
      ];
    }

    const deliveries = mockdb.find("deliveries", filter).sort((a, b) => b.createdAt - a.createdAt);
    return res.json({ deliveries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar entregas (admin)" });
  }
});

/**
 * GET /api/admin/deliveries/:id
 */
router.get("/deliveries/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const delivery = mockdb.findById("deliveries", req.params.id);
    if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });
    return res.json({ delivery });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar entrega (admin)" });
  }
});

/**
 * GET /api/admin/deliveries/:id/documents/:documentType/download
 * Download de documento específico
 */
router.get("/deliveries/:id/documents/:documentType/download", auth, onlyAdmin, async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    // Valida tipo de documento
    const validDocs = ["canhotNF", "canhotCTE", "diarioBordo", "devolucaoVazio", "retiradaCheio"];
    if (!validDocs.includes(documentType)) {
      return res.status(400).json({ message: "Tipo de documento inválido" });
    }

    // Busca entrega
    const delivery = mockdb.findById("deliveries", id);
    if (!delivery) {
      return res.status(404).json({ message: "Entrega não encontrada" });
    }

    // Verifica se documento existe
    const documentPath = delivery.documents[documentType];
    if (!documentPath) {
      return res.status(404).json({ message: "Documento não encontrado" });
    }

    // Monta caminho completo
    const fullPath = path.join(__dirname, "../uploads", documentPath);
    
    // Tenta fazer download do arquivo físico se existir
    if (fs.existsSync(fullPath)) {
      return res.download(fullPath);
    }

    // Se arquivo não existe, retorna JPEG válido (1x1 pixel, cinza)
    // Este é um JPEG real e válido que abre em qualquer visualizador
    const mockJpegBuffer = Buffer.from(
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
      "base64"
    );

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${delivery.deliveryNumber}_${documentType}.jpg"`);
    res.send(mockJpegBuffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao fazer download" });
  }
});

/**
 * DELETE /api/admin/deliveries/:id
 * Deleta uma entrega (apenas admin)
 */
router.delete("/deliveries/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Busca entrega
    const delivery = mockdb.findById("deliveries", id);
    if (!delivery) {
      return res.status(404).json({ message: "Entrega não encontrada" });
    }

    // Deleta entrega do banco
    const deleted = mockdb.deleteOne("deliveries", { _id: id });
    if (!deleted) {
      return res.status(500).json({ message: "Erro ao deletar entrega" });
    }

    return res.json({ success: true, message: "Entrega deletada com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao deletar entrega (admin)" });
  }
});

/**
 * GET /api/admin/users
 * Lista todos os usuários
 */
router.get("/users", auth, onlyAdmin, async (req, res) => {
  try {
    const users = mockdb.find("drivers", {});
    const usersWithoutPasswords = users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      name: u.name || u.fullName,
      role: u.role
    }));
    return res.json({ users: usersWithoutPasswords });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar usuários" });
  }
});

/**
 * POST /api/admin/users
 * Criar novo usuário
 */
router.post("/users", auth, onlyAdmin, async (req, res) => {
  try {
    const { username, email, name, password, role } = req.body;

    if (!username || !email || !name || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    // Verifica se usuário existe
    const existing = mockdb.find("drivers", { username });
    if (existing.length > 0) {
      return res.status(400).json({ message: "Usuário já existe" });
    }

    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const newUser = {
      _id: 'user_' + crypto.randomUUID(),
      username,
      email,
      name,
      fullName: name,
      password: hashedPassword,
      role: role || 'driver',
      phoneNumber: '',
      cnh: '',
      isActive: true,
      createdAt: new Date()
    };

    mockdb.collections.drivers.push(newUser);

    return res.json({ 
      success: true, 
      message: "Usuário criado com sucesso",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

/**
 * PUT /api/admin/users/:id
 * Atualizar usuário
 */
router.put("/users/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    const user = mockdb.findById("drivers", id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const updates = {};
    if (email) updates.email = email;
    if (name) {
      updates.name = name;
      updates.fullName = name;
    }
    if (role) updates.role = role;

    mockdb.updateOne("drivers", { _id: id }, updates);

    return res.json({ 
      success: true, 
      message: "Usuário atualizado com sucesso"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Deletar usuário
 */
router.delete("/users/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = mockdb.findById("drivers", id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    mockdb.deleteOne("drivers", { _id: id });

    return res.json({ 
      success: true, 
      message: "Usuário deletado com sucesso"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao deletar usuário" });
  }
});

module.exports = router;
