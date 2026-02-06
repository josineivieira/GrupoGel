/**
 * Adapter that implements the same API surface as the MockDatabase used in the project
 * but backed by MongoDB models (Mongoose).
 */
const { connectIfNeeded, mongoose } = require('./db/mongo');
const Driver = require('./models/Driver');
const Delivery = require('./models/Delivery');
const crypto = require('crypto');

function castId(id) {
  // Attempt to use provided string id; do not coerce to ObjectId to preserve legacy string ids
  return id;
}

function wrapCityQuery(model, query, city) {
  // Only apply city scoping to collections that are city-specific (deliveries).
  // Drivers and other global collections should not be filtered by city.
  if (!city) return query;
  if (model === 'deliveries') return { ...query, city };
  return query;
}

function modelFor(name) {
  if (name === 'drivers') return Driver;
  if (name === 'deliveries') return Delivery;
  throw new Error('Unknown model: ' + name);
}

async function ensureConnected() {
  try {
    await connectIfNeeded();
  } catch (err) {
    console.error('MongoDB connect error:', err);
    throw err;
  }
}

function createAdapterForCity(city) {
  const normalizedCity = String(city || 'manaus').toLowerCase();

  return {
    async find(model, query = {}) {
      await ensureConnected();
      const M = modelFor(model);
      const q = wrapCityQuery(model, convertQuery(query), normalizedCity);
      const docs = await M.find(q).lean().exec();
      return docs;
    },
    async findOne(model, query = {}) {
      await ensureConnected();
      const M = modelFor(model);
      const q = wrapCityQuery(model, convertQuery(query), normalizedCity);
      return await M.findOne(q).lean().exec();
    },
    async findById(model, id) {
      await ensureConnected();
      const M = modelFor(model);
      // Try direct match against _id or against a string _id
      let doc = await M.findOne({ _id: id }).lean().exec();
      if (!doc) doc = await M.findOne({ _id: String(id) }).lean().exec();
      return doc;
    },
    async create(model, data) {
      await ensureConnected();
      const M = modelFor(model);
      const payload = { ...data };
      // allow using provided _id when migrating
      if (payload._id) payload._id = payload._id;
      // createdAt/updatedAt will be set by mongoose timestamps
      const created = await M.create(payload);
      return created.toObject();
    },
    async updateOne(model, query, updates) {
      await ensureConnected();
      const M = modelFor(model);
      const q = convertQuery(query);
      const updated = await M.findOneAndUpdate(q, updates, { new: true }).lean().exec();
      return updated;
    },
    async deleteOne(model, query) {
      await ensureConnected();
      const M = modelFor(model);
      const q = convertQuery(query);
      const res = await M.deleteOne(q).exec();
      return res.deletedCount > 0;
    }
  };
}

function convertQuery(query) {
  // Convert simple queries used by mockdb into mongoose-friendly queries
  // Support $or with $regex objects
  if (!query || typeof query !== 'object') return query;
  const out = {};
  for (const [k, v] of Object.entries(query)) {
    if (k === '$or' && Array.isArray(v)) {
      out['$or'] = v.map(clause => {
        const inner = {}; 
        for (const [field, cond] of Object.entries(clause)) {
          if (cond && cond.$regex) inner[field] = new RegExp(cond.$regex, 'i');
          else inner[field] = cond;
        }
        return inner;
      });
    } else if (v && v.$regex) {
      out[k] = new RegExp(v.$regex, 'i');
    } else {
      out[k] = v;
    }
  }
  return out;
}

module.exports = {
  forCity: (city) => {
    return createAdapterForCity(city);
  }
};
