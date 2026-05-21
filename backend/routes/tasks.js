const express = require('express');
const { readDb, writeDb } = require('../database/db');

const router = express.Router();

router.get('/tasks', async (req, res) => {
  const db = await readDb();
  res.json(db.tasks || []);
});

router.post('/tasks', async (req, res) => {
  const db = await readDb();
  const task = {
    id: req.body.id || Date.now(),
    title: req.body.title,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    completed: !!req.body.completed
  };

  if (!task.title) return res.status(400).json({ error: 'Task title is required' });

  db.tasks = db.tasks || [];
  db.tasks.push(task);
  await writeDb(db);
  res.json(task);
});

router.patch('/tasks/:id', async (req, res) => {
  const db = await readDb();
  const id = Number(req.params.id);
  db.tasks = (db.tasks || []).map((task) => (task.id === id ? { ...task, ...req.body } : task));
  db.progress = db.progress || {};
  db.progress.completedTasks = (db.tasks || []).filter((task) => task.completed).length;
  await writeDb(db);
  res.json({ ok: true });
});

router.delete('/tasks/:id', async (req, res) => {
  const db = await readDb();
  const id = Number(req.params.id);
  db.tasks = (db.tasks || []).filter((task) => task.id !== id);
  await writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
