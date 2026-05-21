const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const planRoutes = require('./routes/plan');
const taskRoutes = require('./routes/tasks');
const settingsRoutes = require('./routes/settings');

const app = express();
const staticRoot = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(staticRoot));

app.get('/api/ping', (req, res) => res.json({ ok: true, app: 'AI-Based Study Planner' }));
app.use('/api', authRoutes);
app.use('/api', subjectRoutes);
app.use('/api', planRoutes);
app.use('/api', taskRoutes);
app.use('/api', settingsRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI Study Planner server running on http://localhost:${PORT}`);
});
