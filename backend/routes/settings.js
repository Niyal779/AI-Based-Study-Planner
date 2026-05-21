const express = require('express');
const { readDb, writeDb } = require('../database/db');

const router = express.Router();

router.get('/settings', async (req, res) => {
  const db = await readDb();
  res.json(db.settings || {});
});

router.post('/settings', async (req, res) => {
  const db = await readDb();
  db.settings = { ...(db.settings || {}), ...(req.body || {}) };
  await writeDb(db);
  res.json(db.settings);
});

router.get('/progress', async (req, res) => {
  const db = await readDb();
  const completedTasks = (db.tasks || []).filter((task) => task.completed).length;
  res.json({ ...(db.progress || {}), completedTasks });
});

router.post('/progress', async (req, res) => {
  const db = await readDb();
  db.progress = { ...(db.progress || {}), ...(req.body || {}) };
  await writeDb(db);
  res.json(db.progress);
});

module.exports = router;
