const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * User Schema
 * Represents both business founders and prospective investors.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Excluded from default queries to prevent accidental credential leakage
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['business', 'investor'],
        message: '{VALUE} is not a valid role. Allowed roles: business, investor'
      }
    },
    savedBusinesses: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Business'
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save hook: Hash password with bcrypt before saving if it has been modified.
 * Protects against accidental double-hashing when updating other user fields.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compares a candidate plaintext password with the hashed password in database.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns a sanitized representation of the user, free of credential fields.
 * @returns {Object}
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Prevent duplicate model compilation in test environments
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
