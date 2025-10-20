/**
 * server/index.js
 * Single-file Express server that:
 *  - listens on process.env.PORT (Render-friendly)
 *  - serves client/build as static (single service)
 *  - provides simple auth (JWT), spin game endpoints
 *  - supports either MongoDB (if MONGO_URI present) or a fallback in-memory store
 *
 * Usage: node server/index.js
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const USE_MONGO = Boolean(process.env.MONGO_URI && process.env.MONGO_URI.trim().length > 0);
const JWT_SECRET = process.env.JWT_SECRET || 'spinnergy_dev_secret';
const PORT = process.env.PORT || 5000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '200kb' }));

// ---------- Simple logger for clarity ----------
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ---------- Data layer: either Mongoose or in-memory fallback ----------
let UserModel = null;
if (USE_MONGO) {
  // Lazy require mongoose to avoid install errors during quick demos
  try {
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', true);
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log('MongoDB connected'))
      .catch(err => {
        console.error('MongoDB connection error (continuing with in-memory fallback):', err.message);
      });

    const SpinHistorySchema = new mongoose.Schema({
      points: Number,
      date: { type: Date, default: Date.now }
    });

    const UserSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      score: { type: Number, default: 0 },
      isAdmin: { type: Boolean, default: false },
      spinsLeft: { type: Number, default: 5 },
      history: [SpinHistorySchema]
    });

    UserModel = mongoose.model('User', UserSchema);
    console.log('Using MongoDB-backed user model');
  } catch (err) {
    console.error('Failed to init mongoose. Falling back to in-memory store. Error:', err.message);
    UserModel = null;
  }
}

// In-memory fallback store (for quick demo / judges)
const inMemory = {
  users: [
    // seeded user (password: pass123)
    { id: 'u1', name: 'Tester', email: 'tester@example.com', password: bcrypt.hashSync('pass123', 8), score: 100, isAdmin: true, spinsLeft: 5, history: [{ points: 100, date: new Date() }] }
  ],
  nextId: 2
};

// ---------- Helper functions that abstract DB vs Memory ----------
async function findUserByEmail(email) {
  if (UserModel) return UserModel.findOne({ email });
  return inMemory.users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

async function createUser({ name, email, passwordHash }) {
  if (UserModel) {
    const u = new UserModel({ name, email, password: passwordHash });
    await u.save();
    return u;
  } else {
    const user = { id: `u${inMemory.nextId++}`, name, email, password: passwordHash, score: 0, isAdmin: false, spinsLeft: 5, history: [] };
    inMemory.users.push(user);
    return user;
  }
}

async function findUserById(id) {
  if (UserModel) return UserModel.findById(id);
  return inMemory.users.find(u => u.id === id) || null;
}

async function saveUser(user) {
  if (UserModel) return user.save();
  // update in-memory entry
  const i = inMemory.users.findIndex(x => (x.id && user.id ? x.id === user.id : x.email === user.email));
  if (i >= 0) {
    inMemory.users[i] = { ...inMemory.users[i], ...user };
    return inMemory.users[i];
  } else {
    // maybe user passed as mongoose doc; for demo just push minimal
    inMemory.users.push(user);
    return user;
  }
}

async function topUsers(limit = 10) {
  if (UserModel) return UserModel.find().sort({ score: -1 }).limit(limit).select('name score');
  const sorted = [...inMemory.users].sort((a,b) => (b.score||0) - (a.score||0));
  return sorted.slice(0, limit).map(u => ({ name: u.name, score: u.score, _id: u.id || u.email }));
}

// ---------- JWT middleware ----------
function generateToken(user) {
  const payload = { id: user._id ? user._id : user.id };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });
}

async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token provided' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired', detail: err.message });
  }
}

// ---------- Auth routes ----------
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });

  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, passwordHash: hash });
    return res.status(201).json({ message: 'User created', user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    // return sanitized user object
    const safeUser = { name: user.name, email: user.email, score: user.score || 0, isAdmin: user.isAdmin || false };
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const u = req.user;
  // ensure consistent fields
  const profile = { name: u.name, email: u.email, score: u.score || 0, isAdmin: u.isAdmin || false, history: u.history || [] };
  res.json(profile);
});

// ---------- Game endpoints ----------
app.post('/api/game/spin', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user.spinsLeft || user.spinsLeft <= 0) return res.status(400).json({ message: 'No spins left' });

    // Segments and random selection
    const segments = [10, 20, 30, 40, 50, 100];
    const idx = Math.floor(Math.random() * segments.length);
    const points = segments[idx];

    // Update user
    user.score = (user.score || 0) + points;
    user.spinsLeft = (typeof user.spinsLeft === 'number') ? user.spinsLeft - 1 : 0;
    user.history = user.history || [];
    user.history.push({ points, date: new Date() });

    await saveUser(user);

    // Compute landing rotation for front-end animation
    const degreesPerSegment = 360 / segments.length;
    const landingRotation = 360 * 4 + idx * degreesPerSegment + degreesPerSegment / 2;

    // Optional AI message (if OPENAI_API_KEY is present). We won't call the real API here,
    // but if you want, you can add OpenAI calls separately. We'll return a simple canned message.
    const message = `Woo! You scored ${points} points — nice spin!`;

    return res.json({ value: points, newScore: user.score, landingRotation, message });
  } catch (err) {
    console.error('spin error:', err);
    return res.status(500).json({ message: 'Spin failed' });
  }
});

app.get('/api/game/leaderboard', async (req, res) => {
  try {
    const top = await topUsers(10);
    return res.json(top);
  } catch (err) {
    console.error('leaderboard error:', err);
    return res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/game/history', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    return res.json(user.history || []);
  } catch (err) {
    console.error('history error:', err);
    return res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// ---------- Simulate micro:bit / dynamo energy readings endpoint ----------
app.get('/api/simulate', (req, res) => {
  // small simulated energy reading (Joules)
  const energyValue = Number((Math.random() * 2 + 0.2).toFixed(2)); // 0.2 - 2.2 J
  res.json({ energy: energyValue, ts: Date.now() });
});

// ---------- Health check ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev' }));

// ---------- Serve frontend if present ----------
const clientBuildPath = path.join(__dirname, '..', 'client', 'build'); // server/../client/build

// Only set up static serving if build exists
const fs = require('fs');
if (fs.existsSync(clientBuildPath)) {
  console.log('Serving static client from', clientBuildPath);
  app.use(express.static(clientBuildPath));

  // send index.html for all non-/api routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  console.log('client/build not found — React static files will not be served by Express (create client/build or run client build).');
  // Optional helpful root page
  app.get('/', (req, res) => {
    res.send(`<h2>Spinnergy server</h2><p>API is running. Build your client and place it at server/../client/build or change paths.</p>`);
  });
}

// ---------- Start server ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Spinnergy server listening on port ${PORT} (USE_MONGO=${USE_MONGO})`);
});
