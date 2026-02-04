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

// Global error handlers to help diagnose crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at Promise:', p, 'reason:', reason);
});

// Middleware
app.use(helmet());

// ✅ CORS permissivo (permite qualquer origem)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-City"],
  })
);
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Debug: log incoming requests (method, path, origin, X-City) to help diagnose connectivity issues
app.use((req, res, next) => {
  try {
    console.log(`⬅️ ${req.method} ${req.originalUrl} - Host: ${req.headers.host} - Origin: ${req.headers.origin} - X-City: ${req.header('x-city')}`);
  } catch (e) {
    // ignore logging errors
  }
  next();
});

// City middleware (define req.city e req.mockdb)
app.use(require('./middleware/city'));

// ✅ Serve uploads (para abrir imagens no navegador)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes - ANTES do frontend catch-all
app.use("/api/auth", require("./routes/auth"));
app.use("/api/deliveries", require("./routes/delivery"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/reconciliation", require("./routes/reconciliation"));

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
const PORT = process.env.PORT || 3000;

// NOTE: Single listen handled by startServer() below to ensure binding to 0.0.0.0 and avoid duplicate listens.

const { connectIfNeeded } = require('./db/mongo');

async function startServer() {
  try {
    if (process.env.MONGO_URI) {
      try {
        await connectIfNeeded();
        console.log('✓ Using MongoDB for persistence');
      } catch (err) {
        console.error('⚠️ Failed to connect to MongoDB:', err.message);
      }
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✓ Servidor rodando na porta ${PORT}`);
      console.log(`✓ API disponível em http://localhost:${PORT}/api`);
      console.log(process.env.MONGO_URI ? '✓ Usando MongoDB como banco' : '✓ Usando banco de dados em memória (mock)');
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
