import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|avi|mov/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, documents, and videos are allowed'));
    }
  }
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/userauth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: [
      // User roles
      'customer', 'client', 'member', 'subscriber', 'user',
      // Staff roles  
      'admin', 'manager', 'staff', 'supervisor', 'coordinator',
      // Admin roles
      'super-admin', 'system-admin', 'content-admin', 'user-admin'
    ]
  },
  userType: {
    type: String,
    required: true,
    enum: ['user', 'staff', 'admin'],
    default: function() {
      // Auto-determine user type based on role
      const adminRoles = ['super-admin', 'system-admin', 'content-admin', 'user-admin'];
      const staffRoles = ['admin', 'manager', 'staff', 'supervisor', 'coordinator'];
      
      if (adminRoles.includes(this.role)) return 'admin';
      if (staffRoles.includes(this.role)) return 'staff';
      return 'user';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['Infrastructure', 'Utilities', 'Healthcare', 'Education', 'Transportation', 'Environment', 'Other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    required: true,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed'],
    default: 'Submitted'
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .notEmpty()
    .withMessage('Role selection is required')
    .isIn([
      'customer', 'client', 'member', 'subscriber', 'user',
      'admin', 'manager', 'staff', 'supervisor', 'coordinator',
      'super-admin', 'system-admin', 'content-admin', 'user-admin'
    ])
    .withMessage('Invalid role selected')
];

const validateComplaint = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('category')
    .isIn(['Infrastructure', 'Utilities', 'Healthcare', 'Education', 'Transportation', 'Environment', 'Other'])
    .withMessage('Invalid category selected'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid priority level'),
  
  body('anonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous must be a boolean value')
];

// User Signup Route
app.post('/api/signup', validateSignup, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    // Save user to database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        userType: newUser.userType
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Send success response (exclude password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        userType: newUser.userType,
        createdAt: newUser.createdAt
      },
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// User Login Route
app.post('/api/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        userType: user.userType
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit Complaint Route
app.post('/api/complaints', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    // Manual validation for multipart/form-data
    const { title, category, description, priority = 'Medium', anonymous = false } = req.body;
    
    const errors = [];
    
    // Validate title
    if (!title || title.trim().length < 5 || title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Title must be between 5 and 200 characters' });
    }
    
    // Validate category
    const validCategories = ['Infrastructure', 'Utilities', 'Healthcare', 'Education', 'Transportation', 'Environment', 'Other'];
    if (!category || !validCategories.includes(category)) {
      errors.push({ field: 'category', message: 'Invalid category selected' });
    }
    
    // Validate description
    if (!description || description.trim().length < 20 || description.trim().length > 2000) {
      errors.push({ field: 'description', message: 'Description must be between 20 and 2000 characters' });
    }
    
    // Validate priority
    const validPriorities = ['Low', 'Medium', 'High'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push({ field: 'priority', message: 'Invalid priority level' });
    }
    
    // Validate anonymous
    if (anonymous && typeof anonymous !== 'boolean' && anonymous !== 'true' && anonymous !== 'false') {
      errors.push({ field: 'anonymous', message: 'Anonymous must be a boolean value' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Generate complaint ID
    const complaintCount = await Complaint.countDocuments();
    const complaintId = `C${String(complaintCount + 1).padStart(3, '0')}`;

    // Process file attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          uploadDate: new Date()
        });
      });
    }

    // Create new complaint
    const newComplaint = new Complaint({
      complaintId,
      userId: req.user.userId,
      title: title.trim(),
      category,
      description: description.trim(),
      priority: priority || 'Medium',
      anonymous: anonymous === 'true' || anonymous === true,
      attachments
    });

    await newComplaint.save();

    // Populate user info for response
    await newComplaint.populate('userId', 'username email');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: newComplaint._id,
        complaintId: newComplaint.complaintId,
        title: newComplaint.title,
        category: newComplaint.category,
        priority: newComplaint.priority,
        status: newComplaint.status,
        description: newComplaint.description,
        attachments: newComplaint.attachments,
        createdAt: newComplaint.createdAt
      }
    });

  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get User's Complaints
app.get('/api/complaints', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-userId');

    res.json({
      success: true,
      complaints,
      total: complaints.length
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Single Complaint
app.get('/api/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      complaint
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update User Profile
app.put('/api/profile', authenticateToken, [
  body('username').optional().trim().isLength({ min: 3, max: 30 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});






// Add these routes to your server.js file

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Middleware to check if user is staff or admin
const isStaffOrAdmin = (req, res, next) => {
  if (req.user.userType !== 'staff' && req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or Admin privileges required.'
    });
  }
  next();
};







