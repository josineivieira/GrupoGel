// Mongoose-compatible wrapper for mock database
const mockdb = require('./mockdb');

class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
  }

  async findOne(query) {
    return mockdb.findOne(this.modelName, query);
  }

  async find(query) {
    return mockdb.find(this.modelName, query);
  }

  async findById(id) {
    return mockdb.findById(this.modelName, id);
  }

  async findByIdAndUpdate(id, updates) {
    return mockdb.updateOne(this.modelName, { _id: id }, updates);
  }

  async findByIdAndDelete(id) {
    mockdb.deleteOne(this.modelName, { _id: id });
    return { _id: id };
  }

  async create(data) {
    return mockdb.create(this.modelName, data);
  }

  async save() {
    // For instances
    if (this._id) {
      return mockdb.updateOne(this.modelName, { _id: this._id }, this);
    } else {
      const item = mockdb.create(this.modelName, this);
      Object.assign(this, item);
      return this;
    }
  }

  async deleteOne(query) {
    return mockdb.deleteOne(this.modelName, query);
  }

  async countDocuments(query) {
    return mockdb.find(this.modelName, query).length;
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
