// Mongoose-compatible wrapper for mock database
const mockdb = require('./mockdb');

class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
  }

  async findOne(query) {
    return await mockdb.findOne(this.modelName, query);
  }

  async find(query) {
    return await mockdb.find(this.modelName, query);
  }

  async findById(id) {
    return await mockdb.findById(this.modelName, id);
  }

  async findByIdAndUpdate(id, updates) {
    return await mockdb.updateOne(this.modelName, { _id: id }, updates);
  }

  async findByIdAndDelete(id) {
    await mockdb.deleteOne(this.modelName, { _id: id });
    return { _id: id };
  }

  async create(data) {
    return await mockdb.create(this.modelName, data);
  }

  async save() {
    // For instances
    if (this._id) {
      return await mockdb.updateOne(this.modelName, { _id: this._id }, this);
    } else {
      const item = await mockdb.create(this.modelName, this);
      Object.assign(this, item);
      return this;
    }
  }

  async deleteOne(query) {
    return await mockdb.deleteOne(this.modelName, query);
  }

  async countDocuments(query) {
    const docs = await mockdb.find(this.modelName, query);
    return docs ? docs.length : 0;
  }

  toJSON() {
    return { ...this };
  }

  comparePassword(password) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === this.password;
  }

  async comparePasswordAsync(password) {
    return this.comparePassword(password);
  }
}

module.exports = MockModel;
