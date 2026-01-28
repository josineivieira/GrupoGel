const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Initialize mock database
const mockdb = require('./mockdb');

const app = express();

// Middleware
app.use(helmet());

// ✅ CORS simples (JWT via Authorization header)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3003"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ Serve uploads (para abrir imagens no navegador)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes - ANTES do frontend catch-all
app.use("/api/auth", require("./routes/auth"));
app.use("/api/deliveries", require("./routes/delivery"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Servir frontend estático (React build)
// Tenta múltiplos caminhos (desenvolvimento vs produção)
let buildPath = null;
const possiblePaths = [
  path.join(__dirname, '../../frontend/build'),     // desenvolvimento local
  path.join(__dirname, '../frontend/build'),        // alternativo
  '/app/frontend/build',                            // Railway deployment
  '/frontend/build',                                // Railway alternativo
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    buildPath = p;
    break;
  }
}

console.log('🔍 Procurando build...');
console.log('  Caminhos testados:', possiblePaths);
console.log('  ✓ Encontrado em:', buildPath || 'NENHUM!');

if (buildPath) {
  console.log('✓ Frontend build encontrado! Servindo de:', buildPath);
  app.use(express.static(buildPath));
  
  // Serve index.html para rotas não encontradas (React Router SPA)
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Frontend não encontrado',
        path: indexPath 
      });
    }
  });
} else {
  console.log('⚠️  Build não encontrado em nenhum local!');
  console.log('🚨 O frontend precisa ser compilado!');
  
  // API ainda funciona mesmo sem frontend
  app.get('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      message: 'API disponível em /api | Frontend build não encontrado' 
    });
  });
}

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ success: false, message: "Erro no servidor", error: err.message });
});

// Start server (skip MongoDB connection)
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✓ Servidor rodando na porta ${PORT}`);
      console.log(`✓ API disponível em http://localhost:${PORT}/api`);
      console.log(`✓ Usando banco de dados em memória (mock)`);
      console.log(`\n✓ Credenciais de teste:`);
      console.log(`  • admin / admin123`);
      console.log(`  • motorista1 / driver123`);
      console.log(`  • motorista2 / driver123\n`);
    });
  } catch (error) {
    console.error("✗ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
