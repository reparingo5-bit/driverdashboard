require('dotenv').config();
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { pool, initializeDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const driversRoutes = require('./routes/drivers');
const stickerRoutes = require('./routes/sticker');
const empfehlungenRoutes = require('./routes/empfehlungen');
const { isAuthenticated } = require('./middleware/auth');

// Validate required environment variables
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('ERROR: SESSION_SECRET must be set and at least 32 characters');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL must be set');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for nginx reverse proxy
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
    },
  },
}));

// Compression
app.use(compression());

// Logging
if (isProduction) {
  // Create logs directory
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'dms.sid', // Custom session name
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: 'strict'
  }
}));

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es in 15 Minuten erneut.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isProduction = isProduction;
  next();
});

// Routes
app.use('/auth', loginLimiter, authRoutes);
app.use('/dashboard', isAuthenticated, dashboardRoutes);
app.use('/drivers', isAuthenticated, driversRoutes);
app.use('/sticker', isAuthenticated, stickerRoutes);
app.use('/empfehlungen', isAuthenticated, empfehlungenRoutes);

// Root redirect
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// Health check endpoint (for monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Seite nicht gefunden',
    message: 'Die angeforderte Seite wurde nicht gefunden.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).render('error', {
    title: 'Serverfehler',
    message: isProduction ? 'Ein Fehler ist aufgetreten.' : err.message
  });
});

// Start server (database init is manual via seed script)
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
