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
    const pending = deliveries.filter(d => d.status === "pending").length;
    
    // Agrupa por transportadora (placa) - removendo espaços em branco
    // Agrupa por contratado (userName)
    const deliveriesByContratado = {};
    deliveries.forEach(d => {
      const contratado = (d.userName || "Sem Contratado").trim();
      if (!deliveriesByContratado[contratado]) {
        deliveriesByContratado[contratado] = 0;
      }
      deliveriesByContratado[contratado]++;
    });

    const dailyDeliveries = [];
    const daysMap = {};
    
    deliveries.forEach(d => {
      // Agrupa pela data local (fuso de São Paulo) para evitar deslocamentos por UTC
      const dt = new Date(d.createdAt);
      const date = dt.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
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
      pending,
      deliveriesByDriver: Object.entries(deliveriesByContratado).map(([contratado, count]) => ({ _id: contratado, count })),
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
 * 
 * Consolida automaticamente arquivos das duas pastas de uploads
 */
router.get("/deliveries", auth, onlyAdmin, async (req, res) => {
  try {
    const { status, q, startDate, endDate } = req.query;
    console.log('📋 GET /admin/deliveries recebido com filtros:', { status, q, startDate, endDate });
    
    // Debug: mostra total de entregas disponíveis
    const allDeliveries = mockdb.find("deliveries", {});
    console.log('  ℹ️  Total de entregas na DB:', allDeliveries.length);
    
    const filter = {};

    if (status && status !== "all") {
      console.log('  ✓ Aplicando filtro de status:', status);
      filter.status = status;
    }

    if (q && q.trim()) {
      const text = q.trim();
      console.log('  ✓ Aplicando filtro de busca:', text);
      filter.$or = [
        { deliveryNumber: { $regex: text, $options: "i" } },
        { vehiclePlate: { $regex: text, $options: "i" } },
        { userName: { $regex: text, $options: "i" } },
        { driverName: { $regex: text, $options: "i" } }
      ];
    }

    // Busca inicialmente usando o mockdb (aplica filtros simples)
    let deliveries = mockdb.find("deliveries", filter).sort((a, b) => b.createdAt - a.createdAt);
    console.log('  → Após mockdb.find com filter:', JSON.stringify(filter), '- Retornou', deliveries.length, 'entregas');

    // Filtra por intervalo de datas se fornecido (formato YYYY-MM-DD)
    if (startDate || endDate) {
      console.log('  ✓ Aplicando filtro de datas:', { startDate, endDate });
      const start = startDate ? new Date(startDate + 'T00:00:00Z') : null;
      const end = endDate ? new Date(endDate + 'T23:59:59Z') : null;
      console.log('  → Datas parseadas:', { start: start?.toISOString(), end: end?.toISOString() });
      
      const deliveriesBefore = deliveries.length;
      deliveries = deliveries.filter(d => {
        const created = new Date(d.createdAt);
        console.log(`    Verificando ${d.deliveryNumber}: createdAt=${created.toISOString()}`);
        if (start && created < start) {
          console.log(`      ✗ Antes da data inicial`);
          return false;
        }
        if (end && created > end) {
          console.log(`      ✗ Depois da data final`);
          return false;
        }
        console.log(`      ✓ Dentro do intervalo`);
        return true;
      });
      console.log('  → Após filtro de datas:', deliveriesBefore, '→', deliveries.length, 'entregas');
    }
    
    console.log('✅ Retornando', deliveries.length, 'entregas');
    
    // Consolida arquivos de ambas as pastas para cada entrega
    const uploadsPath1 = path.join(__dirname, "../uploads");
    const uploadsPath2 = path.join(__dirname, "../src/uploads");
    
    const deliveriesWithFiles = deliveries.map(delivery => {
      const consolidatedFiles = {};
      
      // Busca arquivos nas duas pastas
      [uploadsPath1, uploadsPath2].forEach(uploadsPath => {
        const deliveryPath = path.join(uploadsPath, delivery.deliveryNumber);
        if (fs.existsSync(deliveryPath)) {
          try {
            const files = fs.readdirSync(deliveryPath);
            files.forEach(file => {
              if (!consolidatedFiles[file]) {
                consolidatedFiles[file] = true;
              }
            });
          } catch (err) {
            console.error(`Erro ao listar arquivos em ${deliveryPath}:`, err);
          }
        }
      });
      
      return {
        ...delivery,
        uploadedFiles: Object.keys(consolidatedFiles), // Lista de arquivos consolidados
        hasFiles: Object.keys(consolidatedFiles).length > 0
      };
    });
    
    return res.json({ deliveries: deliveriesWithFiles });
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
 * PUT /api/admin/deliveries/:id
 * Atualiza dados de uma entrega (apenas admin)
 */
router.put("/deliveries/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryNumber, userName, driverName, vehiclePlate, observations } = req.body;

    console.log('📝 Recebido PUT /deliveries/:id', { id, deliveryNumber, userName, driverName, vehiclePlate, observations });

    // Validar se motivo da edição foi fornecido
    if (!observations || observations.trim() === '') {
      console.log('❌ Motivo vazio');
      return res.status(400).json({ message: "Motivo da edição é obrigatório" });
    }

    // Busca entrega
    const delivery = mockdb.findById("deliveries", id);
    console.log('🔍 Entrega encontrada:', delivery?.deliveryNumber);
    if (!delivery) {
      return res.status(404).json({ message: "Entrega não encontrada" });
    }

    // Atualiza campos
    const updates = {};
    if (deliveryNumber !== undefined) updates.deliveryNumber = deliveryNumber.toUpperCase();
    if (userName !== undefined) updates.userName = userName;
    if (driverName !== undefined) updates.driverName = driverName;
    if (vehiclePlate !== undefined) updates.vehiclePlate = vehiclePlate.trim();
    if (observations !== undefined) updates.observations = observations;
    updates.editedAt = new Date().toISOString();
    updates.editReason = observations;

    console.log('🔄 Updates a fazer:', updates);

    const updated = mockdb.updateOne("deliveries", { _id: id }, updates);
    console.log('✅ Atualizado:', updated?.deliveryNumber);
    if (!updated) {
      return res.status(500).json({ message: "Erro ao atualizar entrega" });
    }

    return res.json({ success: true, delivery: updated, message: "Entrega atualizada com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar entrega" });
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

    // Normaliza username/email para minúsculas — login procura por username.toLowerCase()
    const normalizedUsername = String(username).toLowerCase();
    const normalizedEmail = String(email).toLowerCase();

    // Verifica se usuário existe (por username ou email)
    const existing = mockdb.find('drivers', { $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
    if (existing.length > 0) {
      return res.status(400).json({ message: "Usuário já existe" });
    }

    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const newUser = {
      _id: 'user_' + crypto.randomUUID(),
      username: normalizedUsername,
      email: normalizedEmail,
      name,
      fullName: name,
      password: hashedPassword,
      role: role || 'driver',
      phoneNumber: '',
      cnh: '',
      isActive: true,
      createdAt: new Date()
    };

    // Use API do mockdb para inserir (mantém consistência)
    const created = mockdb.create('drivers', newUser);
    console.log('➕ Novo usuário criado (sem senha no log):', { _id: created._id, username: created.username, email: created.email, role: created.role });

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

// DEBUG: export drivers to JSON file (admin only) - useful for backup
// Use: GET /api/admin/debug/export-drivers
router.get('/debug/export-drivers', auth, onlyAdmin, async (req, res) => {
  try {
    const drivers = mockdb.find('drivers', {});
    const exportDir = path.join(__dirname, '../data/exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    const filename = `drivers-export-${Date.now()}.json`;
    const fullPath = path.join(exportDir, filename);
    fs.writeFileSync(fullPath, JSON.stringify({ drivers }, null, 2));
    return res.json({ success: true, message: 'Export realizado', path: fullPath });
  } catch (err) {
    console.error('Erro export drivers:', err);
    return res.status(500).json({ success: false, message: 'Erro ao exportar drivers' });
  }
});
