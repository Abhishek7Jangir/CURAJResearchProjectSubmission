const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true,
    enum: ['pi', 'professor', 'hod', 'dean', 'r&d_helper', 'rnd_helper', 'r&d_main', 'rnd_main', 
           'academic_integrity_officer', 'aio', 'finance_officer_helper', 'finance_officer_main', 'registrar', 'vc_office', 'vice_chancellor', 'rnd', 'fund']
  },
  department: {
    type: String,
    default: 'N/A'
  },
  profilePic: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

