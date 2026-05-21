const express = require('express');
const { readDb, writeDb } = require('../database/db');

const router = express.Router();

router.get('/plan', async (req, res) => {
  const db = await readDb();
  const userEmail = req.query.userEmail;
  if (userEmail) return res.json((db.plans || {})[userEmail] || {});
  res.json(db.plan || {});
});

router.post('/plan', async (req, res) => {
  const db = await readDb();
  const userEmail = req.query.userEmail;
  if (userEmail) {
    db.plans = db.plans || {};
    db.plans[userEmail] = req.body || {};
    await writeDb(db);
    return res.json(db.plans[userEmail]);
  }
  db.plan = req.body || {};
  await writeDb(db);
  res.json(db.plan);
});

module.exports = router;
