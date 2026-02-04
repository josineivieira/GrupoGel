const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Mapear tipos de documento para nomes legíveis
const documentNames = {
  canhotNF: 'CANHOTO_NF',
  canhotCTE: 'CANHOTO_CTE',
  diarioBordo: 'DIARIO_DE_BORDO',
  devolucaoVazio: 'DEVOLUCAO_VAZIO',
  retiradaCheio: 'RETIRADA_CHEIO'
};

// Create uploads base directory (supports persistent directory via BACKEND_UPLOADS_DIR)
const uploadsBase = process.env.BACKEND_UPLOADS_DIR ? path.resolve(process.env.BACKEND_UPLOADS_DIR) : path.join(__dirname, '../../uploads');

// Ensure BACKEND_UPLOADS_DIR exists when provided
if (process.env.BACKEND_UPLOADS_DIR) {
  ;(async () => {
    try {
      await fs.mkdir(uploadsBase, { recursive: true });
      console.log('✓ Using BACKEND_UPLOADS_DIR for uploads:', uploadsBase);
    } catch (err) {
      console.error('⚠️ Error ensuring BACKEND_UPLOADS_DIR exists:', err);
    }
  })();
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const city = req.city || 'manaus';
      const containerNumber = req.containerNumber || 'sem_numero';
      const containerDir = path.join(uploadsBase, city, containerNumber);
      
      // Criar diretório se não existir
      await fs.mkdir(containerDir, { recursive: true });
      
      cb(null, containerDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Obter o nome do documento baseado no documentType
    const documentType = req.documentType || 'ARQUIVO';
    const docName = documentNames[documentType] || documentType.toUpperCase();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Nome do arquivo: CANHOTO_NF.jpeg
    cb(null, docName + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
