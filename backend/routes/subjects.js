const express = require('express');
const { readDb, writeDb } = require('../database/db');

const router = express.Router();

router.get('/subjects', async (req, res) => {
  const db = await readDb();
  const userEmail = req.query.userEmail;
  const subjects = db.subjects || [];
  if (!userEmail) return res.json(subjects);
  res.json(subjects.filter((subject) => subject.userEmail === userEmail));
});

router.post('/subjects', async (req, res) => {
  const db = await readDb();
  const subject = {
    id: req.body.id || Date.now(),
    name: req.body.name,
    examDate: req.body.examDate,
    difficulty: Number(req.body.difficulty || 1),
    isWeak: !!req.body.isWeak,
    userEmail: req.body.userEmail
  };

  if (!subject.name || !subject.examDate || !subject.userEmail) {
    return res.status(400).json({ error: 'Subject, exam date and user email are required' });
  }

  db.subjects = db.subjects || [];
  db.subjects.push(subject);
  await writeDb(db);
  res.json(subject);
});

router.delete('/subjects/:id', async (req, res) => {
  const db = await readDb();
  const id = Number(req.params.id);
  const userEmail = req.query.userEmail;
  db.subjects = (db.subjects || []).filter((subject) => {
    if (subject.id !== id) return true;
    return userEmail && subject.userEmail !== userEmail;
  });
  await writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
