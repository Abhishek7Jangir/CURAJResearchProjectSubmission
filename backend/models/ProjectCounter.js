const mongoose = require('mongoose');

const projectCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ProjectCounter', projectCounterSchema);

