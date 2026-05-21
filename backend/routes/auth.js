const express = require('express');
const { readDb, writeDb } = require('../database/db');

const router = express.Router();

router.get('/users', async (req, res) => {
  const db = await readDb();
  res.json(db.users || []);
});

router.post('/users', async (req, res) => {
  const db = await readDb();
  const user = req.body;

  if (!user.name || !user.email || !user.password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  if ((db.users || []).find((item) => item.email === user.email)) {
    return res.status(400).json({ error: 'User exists' });
  }

  db.users.push(user);
  await writeDb(db);
  res.json(user);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await readDb();
  const user = (db.users || []).find((item) => item.email === email && item.password === password);

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(user);
});

module.exports = router;
