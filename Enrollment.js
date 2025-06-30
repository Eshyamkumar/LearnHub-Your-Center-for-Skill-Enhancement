const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    completedModules: [{
      moduleId: {
        type: mongoose.Schema.Types.ObjectId
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      quizScore: {
        type: Number,
        default: 0
      }
    }],
    overallProgress: {
      type: Number,
      default: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: {
      type: Date
    },
    certificateUrl: {
      type: String,
      default: ''
    }
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      default: 'stripe'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String
    }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Calculate overall progress
enrollmentSchema.methods.calculateProgress = function() {
  const totalModules = this.course.modules.length;
  const completedModules = this.progress.completedModules.length;
  
  if (totalModules === 0) {
    this.progress.overallProgress = 0;
  } else {
    this.progress.overallProgress = Math.round((completedModules / totalModules) * 100);
  }
  
  // Mark as completed if all modules are done
  if (this.progress.overallProgress === 100) {
    this.status = 'completed';
    this.certificate.issued = true;
    this.certificate.issuedAt = new Date();
  }
};

// Virtual for completion status
enrollmentSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for certificate eligibility
enrollmentSchema.virtual('isCertificateEligible').get(function() {
  return this.progress.overallProgress === 100 && this.course.certificate;
});

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema); 