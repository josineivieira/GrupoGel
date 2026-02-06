/**
 * MongoDB Adapter com Fallback automático para MockDB
 * Se MongoDB falhar, cai automaticamente para MockDB
 */

const mongodbAdapter = require('./mongodbAdapter');
const mockdbFactory = require('./mockdb');

function createAdapterForCity(city) {
  const normalizedCity = String(city || 'manaus').toLowerCase();
  let mongoAdapter = null;
  let usedMongo = false;
  
  // Tenta criar adapter MongoDB
  try {
    mongoAdapter = mongodbAdapter.forCity(normalizedCity);
    usedMongo = true;
  } catch (err) {
    console.log(`[DB-FALLBACK] Não foi possível criar MongoDB adapter: ${err.message}`);
    usedMongo = false;
  }

  // Se teve erro ou MongoDB não está configurado, usa MockDB
  if (!usedMongo) {
    const mockdb = mockdbFactory.forCity ? mockdbFactory.forCity(normalizedCity) : mockdbFactory;
    console.log(`[DB-FALLBACK] Usando MockDB como fallback para cidade: ${normalizedCity}`);
    return mockdb;
  }

  // Caso contrário, retorna um wrapper que tenta MongoDB primeiro, depois MockDB
  const mockdbFallback = mockdbFactory.forCity ? mockdbFactory.forCity(normalizedCity) : mockdbFactory;
  
  return {
    async find(model, query = {}) {
      try {
        return await mongoAdapter.find(model, query);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB find falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.find(model, query);
      }
    },
    async findOne(model, query = {}) {
      try {
        return await mongoAdapter.findOne(model, query);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB findOne falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.findOne(model, query);
      }
    },
    async findById(model, id) {
      try {
        return await mongoAdapter.findById(model, id);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB findById falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.findById(model, id);
      }
    },
    async create(model, data) {
      try {
        return await mongoAdapter.create(model, data);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB create falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.create(model, data);
      }
    },
    async updateOne(model, query, updates) {
      try {
        return await mongoAdapter.updateOne(model, query, updates);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB updateOne falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.updateOne(model, query, updates);
      }
    },
    async deleteOne(model, query) {
      try {
        return await mongoAdapter.deleteOne(model, query);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB deleteOne falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.deleteOne(model, query);
      }
    }
  };
}

module.exports = {
  forCity: (city) => {
    return createAdapterForCity(city);
  }
};
