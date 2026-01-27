const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");

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

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/deliveries", require("./routes/delivery"));
app.use("/api/admin", require("./routes/admin"));

// Em produção, servir o frontend
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(buildPath));
  
  // Serve index.html para rotas não encontradas (React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" });
});

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
