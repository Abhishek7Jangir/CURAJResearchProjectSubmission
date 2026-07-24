const mongoose = require('mongoose');

const authOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    purpose: {
      type: String,
      required: true,
      enum: ['signup', 'forgot_password'],
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuthOtp', authOtpSchema);
