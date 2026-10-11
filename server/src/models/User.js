const mongoose = require('mongoose');

/**
 * User Schema
 * Represents both business founders and prospective investors.
 * 
 * NOTE FOR FUTURE AUTHENTICATION LAYER (Stage 3):
 * Passwords must be hashed (e.g., using bcrypt) prior to saving in the database.
 * Never store plaintext passwords. The password field is configured with select: false
 * to prevent accidental exposure in query results.
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
      select: false
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

// Prevent duplicate model compilation in test environments
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
