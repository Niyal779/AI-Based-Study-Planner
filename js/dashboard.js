// Dashboard widgets: exams, tasks, Pomodoro, progress, reminders and analytics.
(function(){
  const upcoming = document.getElementById('upcomingExams');
  const todayTasks = document.getElementById('todayTasks');
  const quoteEl = document.getElementById('quote');
  const pomTime = document.getElementById('pomTime');
  const pomStart = document.getElementById('pomStart');
  const pomStop = document.getElementById('pomStop');
  const taskForm = document.getElementById('taskForm');
  const taskTitle = document.getElementById('taskTitle');
  const examCountdown = document.getElementById('examCountdown');
  const progressScore = document.getElementById('progressScore');

  const taskKey = 'asp_tasks';
  const subjectKey = 'asp_subjects';

  function currentUser(){
    return JSON.parse(localStorage.getItem('asp_current') || 'null');
  }

  function currentUserEmail(){
    const user = currentUser();
    return user ? user.email : 'guest@study.app';
  }

  function userSubjectKey(){
    return `${subjectKey}_${currentUserEmail()}`;
  }

  function userPlanKey(){
    return `asp_plan_${currentUserEmail()}`;
  }

  let backendAvailableCache = null;
  async function backendAvailable(){
    if(backendAvailableCache !== null) return backendAvailableCache;
    try{
      const response = await fetch('/api/ping', { cache: 'no-store' });
      backendAvailableCache = response.ok;
    }catch(error){
      backendAvailableCache = false;
    }
    return backendAvailableCache;
  }

  function getLocalTasks(){
    return JSON.parse(localStorage.getItem(taskKey) || '[]');
  }

  function saveLocalTasks(tasks){
    localStorage.setItem(taskKey, JSON.stringify(tasks));
  }

  async function loadTasks(){
    if(await backendAvailable()){
      const response = await fetch('/api/tasks');
      return response.json();
    }
    return getLocalTasks();
  }

  async function saveTask(task){
    if(await backendAvailable()){
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(task)
      });
      return response.json();
    }
    const tasks = getLocalTasks();
    tasks.push(task);
    saveLocalTasks(tasks);
    return task;
  }

  async function updateTask(id, patch){
    if(await backendAvailable()){
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch)
      });
      return;
    }
    saveLocalTasks(getLocalTasks().map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  async function deleteTask(id){
    if(await backendAvailable()){
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      return;
    }
    saveLocalTasks(getLocalTasks().filter((task) => task.id !== id));
  }

  async function loadSubjects(){
    if(await backendAvailable()){
      const response = await fetch(`/api/subjects?userEmail=${encodeURIComponent(currentUserEmail())}`);
      return response.json();
    }
    return JSON.parse(localStorage.getItem(userSubjectKey()) || '[]');
  }

  async function renderExams(){
    const subjects = await loadSubjects();
    if(!upcoming) return;

    upcoming.innerHTML = '';
    subjects
      .slice()
      .sort((a,b) => new Date(a.examDate) - new Date(b.examDate))
      .slice(0,5)
      .forEach((subject) => {
        const li = document.createElement('li');
        li.textContent = `${subject.name} - ${subject.examDate}`;
        upcoming.appendChild(li);
      });

    if(!subjects.length) upcoming.innerHTML = '<li>No exams added yet.</li>';

    if(examCountdown){
      const futureSubjects = subjects
        .filter((subject) => new Date(subject.examDate) >= new Date())
        .sort((a,b) => new Date(a.examDate) - new Date(b.examDate));
      if(futureSubjects.length){
        const diff = new Date(futureSubjects[0].examDate) - new Date();
        examCountdown.textContent = `${Math.max(0, Math.ceil(diff / 86400000))} days`;
      }else{
        examCountdown.textContent = '--';
      }
    }
  }

  async function renderTasks(){
    if(!todayTasks) return;
    const today = new Date().toISOString().slice(0,10);
    const tasks = await loadTasks();
    let plan = {};
    if(await backendAvailable()){
      const planResponse = await fetch(`/api/plan?userEmail=${encodeURIComponent(currentUserEmail())}`);
      plan = await planResponse.json();
    }else{
      plan = JSON.parse(localStorage.getItem(userPlanKey()) || '{}');
    }
    const planTasks = (plan[today] || []).map((task, index) => ({
      id: `plan-${index}`,
      title: `${task.subject} - ${task.hours} hrs`,
      completed: false,
      readonly: true
    }));
    const dailyTasks = tasks.filter((task) => task.date === today);
    const items = [...dailyTasks, ...planTasks];

    todayTasks.innerHTML = '';
    if(!items.length){
      todayTasks.innerHTML = '<li>No tasks for today. Generate a plan or add one.</li>';
      updateProgress(tasks);
      return;
    }

    items.forEach((task) => {
      const li = document.createElement('li');
      li.className = task.completed ? 'task-item done' : 'task-item';
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.completed;
      checkbox.disabled = !!task.readonly;
      const title = document.createElement('span');
      title.textContent = task.title;
      label.appendChild(checkbox);
      label.appendChild(title);
      li.appendChild(label);

      if(!task.readonly){
        checkbox.addEventListener('change', async (event) => {
          await updateTask(task.id, { completed: event.target.checked });
          renderTasks();
        });

        const remove = document.createElement('button');
        remove.className = 'btn ghost';
        remove.type = 'button';
        remove.textContent = 'Delete';
        remove.addEventListener('click', async () => {
          await deleteTask(task.id);
          renderTasks();
        });
        li.appendChild(remove);
      }

      todayTasks.appendChild(li);
    });

    updateProgress(tasks);
  }

  function updateProgress(tasks){
    if(!progressScore) return;
    const total = tasks.length || 1;
    const done = tasks.filter((task) => task.completed).length;
    progressScore.textContent = `${Math.round((done / total) * 100)}%`;
  }

  if(taskForm){
    taskForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveTask({
        id: Date.now(),
        title: taskTitle.value.trim(),
        date: new Date().toISOString().slice(0,10),
        completed: false
      });
      taskForm.reset();
      renderTasks();
    });
  }

  const quotes = [
    'Small daily improvements lead to long-term results.',
    'Focus on progress, not perfection.',
    'One focused session can change the whole day.'
  ];
  if(quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  let timer = null;
  let remaining = 25 * 60;
  function format(seconds){
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  function tick(){
    remaining--;
    if(pomTime) pomTime.textContent = format(remaining);
    if(remaining <= 0){
      clearInterval(timer);
      timer = null;
      remaining = 25 * 60;
      alert('Pomodoro finished! Take a short break.');
    }
  }
  if(pomStart) pomStart.addEventListener('click', () => { if(!timer) timer = setInterval(tick, 1000); });
  if(pomStop) pomStop.addEventListener('click', () => {
    clearInterval(timer);
    timer = null;
    remaining = 25 * 60;
    if(pomTime) pomTime.textContent = format(remaining);
  });

  if(document.getElementById('weeklyChart')){
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const data = [2,3,4,2.5,3.5,1,0.5];
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Hours Studied', data, backgroundColor: '#2563eb', borderRadius: 8 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  renderExams();
  renderTasks();
})();
