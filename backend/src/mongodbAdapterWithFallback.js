/**
 * MongoDB Adapter com Fallback automático para MockDB
 * Se MongoDB não estiver configurado ou falhar, cai automaticamente para MockDB
 */

const mockdbFactory = require('./mockdb');

function createAdapterForCity(city) {
  const normalizedCity = String(city || 'manaus').toLowerCase();
  
  // Se MONGODB_URI não está configurado, usa MockDB direto (sem tentar MongoDB)
  if (!process.env.MONGODB_URI) {
    console.log(`[DB-FALLBACK] MONGODB_URI não configurado, usando MockDB para cidade: ${normalizedCity}`);
    const mockdb = mockdbFactory.forCity ? mockdbFactory.forCity(normalizedCity) : mockdbFactory;
    return mockdb;
  }

  // MongoDB está configurado, decide se deve usar ou não com base em env
  // Por padrão, se MONGODB_URI presente, habilitamos o uso do MongoDB.
  // Você pode forçar desabilitar definindo USE_MONGODB=false no ambiente.
  const USE_MONGODB = process.env.USE_MONGODB ? String(process.env.USE_MONGODB).toLowerCase() === 'true' : true;
  if (!USE_MONGODB) {
    console.log(`[DB-FALLBACK] MongoDB desabilitado via USE_MONGODB env, usando MockDB puro para cidade: ${normalizedCity}`);
    const mockdb = mockdbFactory.forCity ? mockdbFactory.forCity(normalizedCity) : mockdbFactory;
    return mockdb;
  }

  console.log(`[DB-FALLBACK] MONGODB_URI configurado, tentando MongoDB para cidade: ${normalizedCity}`);
  
  const mongodbAdapter = require('./mongodbAdapter');
  const mongoAdapter = mongodbAdapter.forCity(normalizedCity);
  const mockdbFallback = mockdbFactory.forCity ? mockdbFactory.forCity(normalizedCity) : mockdbFactory;
  function stripCity(q) {
    if (!q || typeof q !== 'object') return q;
    const copy = Array.isArray(q) ? q.map(item => stripCity(item)) : { ...q };
    if (copy && copy.city) delete copy.city;
    return copy;
  }
  
  return {
    async find(model, query = {}) {
      try {
        return await mongoAdapter.find(model, query);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB find falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.find(model, stripCity(query));
      }
    },
    async findOne(model, query = {}) {
      try {
        return await mongoAdapter.findOne(model, query);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB findOne falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.findOne(model, stripCity(query));
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
        // ensure we don't pass an unexpected city property to per-city mockdb
        const payload = { ...data };
        if (payload.city) delete payload.city;
        return mockdbFallback.create(model, payload);
      }
    },
    async updateOne(model, query, updates) {
      try {
        return await mongoAdapter.updateOne(model, query, updates);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB updateOne falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.updateOne(model, stripCity(query), updates);
      }
    },
    async deleteOne(model, query) {
      try {
        return await mongoAdapter.deleteOne(model, query);
      } catch (err) {
        console.warn(`[DB-FALLBACK] MongoDB deleteOne falhou, usando MockDB: ${err.message}`);
        return mockdbFallback.deleteOne(model, stripCity(query));
      }
    }
  };
}

module.exports = {
  forCity: (city) => {
    return createAdapterForCity(city);
  }
};
