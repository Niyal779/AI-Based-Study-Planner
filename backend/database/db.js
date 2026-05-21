const path = require('path');
const fs = require('fs').promises;

const DB_PATH = path.join(__dirname, 'db.json');

const defaultDb = {
  users: [],
  subjects: [],
  plan: {},
  plans: {},
  tasks: [],
  settings: {
    dailyHours: 3,
    gpaTarget: 3.8,
    reminders: true,
    theme: 'light'
  },
  progress: {
    completedTasks: 0,
    totalFocusMinutes: 0
  }
};

async function readDb() {
  try {
    const text = await fs.readFile(DB_PATH, 'utf8');
    return { ...defaultDb, ...JSON.parse(text) };
  } catch (error) {
    return { ...defaultDb };
  }
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify({ ...defaultDb, ...data }, null, 2));
}

module.exports = { readDb, writeDb };
