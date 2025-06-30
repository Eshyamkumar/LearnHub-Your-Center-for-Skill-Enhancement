const express = require('express');
const { body, validationResult } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/enrollments
// @desc    Get user's enrollments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title thumbnail category level instructor totalDuration totalLessons')
      .populate('course.instructor', 'name profile.avatar')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'title thumbnail category level instructor modules totalDuration totalLessons')
      .populate('course.instructor', 'name profile.avatar')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if user is authorized to view this enrollment
    if (enrollment.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments
// @desc    Create new enrollment
// @access  Private
router.post('/', auth, [
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, amount } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not published' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: req.user._id,
      course: courseId,
      payment: {
        amount,
        currency: 'USD',
        paymentStatus: 'completed'
      }
    });

    await enrollment.save();

    // Update user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        enrolledCourses: {
          course: courseId,
          enrolledAt: new Date()
        }
      }
    });

    // Update course's enrolled students
    await Course.findByIdAndUpdate(courseId, {
      $push: {
        enrolledStudents: {
          student: req.user._id,
          enrolledAt: new Date()
        }
      }
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title thumbnail category level')
      .populate('student', 'name email');

    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment: populatedEnrollment
    });
  } catch (error) {
    console.error('Create enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private
router.put('/:id/progress', auth, [
  body('moduleId').notEmpty().withMessage('Module ID is required'),
  body('completed').isBoolean().withMessage('Completed must be a boolean'),
  body('quizScore').optional().isNumeric().withMessage('Quiz score must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { moduleId, completed, quizScore } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if user is authorized
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (completed) {
      // Add module to completed modules if not already there
      const moduleExists = enrollment.progress.completedModules.some(
        module => module.moduleId.toString() === moduleId
      );

      if (!moduleExists) {
        enrollment.progress.completedModules.push({
          moduleId,
          completedAt: new Date(),
          quizScore: quizScore || 0
        });
      }
    } else {
      // Remove module from completed modules
      enrollment.progress.completedModules = enrollment.progress.completedModules.filter(
        module => module.moduleId.toString() !== moduleId
      );
    }

    // Update last accessed
    enrollment.progress.lastAccessed = new Date();

    // Calculate overall progress
    const course = await Course.findById(enrollment.course);
    if (course) {
      const totalModules = course.modules.length;
      const completedModules = enrollment.progress.completedModules.length;
      
      if (totalModules > 0) {
        enrollment.progress.overallProgress = Math.round((completedModules / totalModules) * 100);
      }

      // Mark as completed if all modules are done
      if (enrollment.progress.overallProgress === 100) {
        enrollment.status = 'completed';
        enrollment.certificate.issued = true;
        enrollment.certificate.issuedAt = new Date();
      }
    }

    await enrollment.save();

    res.json({
      message: 'Progress updated successfully',
      enrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/course/:courseId
// @desc    Get enrollment for specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId
    }).populate('course', 'title thumbnail category level modules');

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Get course enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Drop enrollment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if user is authorized
    if (enrollment.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update enrollment status
    enrollment.status = 'dropped';
    await enrollment.save();

    res.json({ message: 'Enrollment dropped successfully' });
  } catch (error) {
    console.error('Drop enrollment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/stats
// @desc    Get enrollment statistics (Admin/Instructor)
// @access  Private
router.get('/stats', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    let filter = {};
    
    // If instructor, only show their courses
    if (req.user.role === 'instructor') {
      const instructorCourses = await Course.find({ instructor: req.user._id }).select('_id');
      filter.course = { $in: instructorCourses.map(c => c._id) };
    }

    const totalEnrollments = await Enrollment.countDocuments(filter);
    const activeEnrollments = await Enrollment.countDocuments({ ...filter, status: 'active' });
    const completedEnrollments = await Enrollment.countDocuments({ ...filter, status: 'completed' });

    const recentEnrollments = await Enrollment.find(filter)
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 })
      .limit(10);

    res.json({
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      recentEnrollments
    });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 