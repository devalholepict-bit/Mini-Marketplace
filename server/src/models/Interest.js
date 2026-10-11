const mongoose = require('mongoose');

/**
 * Interest Schema
 * Represents an expression of investment interest submitted by an investor to a business.
 * 
 * NOTE ON COMPOUND UNIQUE INDEX:
 * The compound index on { investor: 1, business: 1 } enforces that an investor cannot
 * submit multiple expressions of interest to the same business profile.
 * 
 * NOTE ON MONGOOSE UNIQUE INDEXES:
 * In MongoDB/Mongoose, `unique: true` is an index constraint built in the database engine,
 * not a schema-level validator executed in Node.js memory. When an actual MongoDB Atlas
 * instance is connected, inserting a duplicate { investor, business } pair will throw an
 * E11000 duplicate key error, which will be handled in Stage 6 to return HTTP 409 Conflict.
 */
const interestSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investor reference is required']
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business reference is required']
    },
    message: {
      type: String,
      required: [true, 'Interest message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'declined'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: prevents duplicate interest submissions from the same investor to the same business
interestSchema.index({ investor: 1, business: 1 }, { unique: true });

// Index for investor querying their sent expressions of interest
interestSchema.index({ investor: 1 });

// Compound index for businesses filtering received interests by status
interestSchema.index({ business: 1, status: 1 });

// Prevent duplicate model compilation in test environments
module.exports = mongoose.models.Interest || mongoose.model('Interest', interestSchema);
