// AI logic: generate study plan based on exam proximity, difficulty, available hours, and weakness
// This is a heuristic scheduler for demo purposes.
function generateStudyPlan(subjects, options){
  // subjects: [{id,name,examDate,difficulty,isWeak}]
  // options: {startDate, endDate, dailyHours}
  const start = options.startDate ? new Date(options.startDate) : new Date();
  const dailyHours = options.dailyHours || 3;
  // compute days until each exam and base weight
  const now = new Date();
  subjects = subjects.map(s=>{
    const exam = new Date(s.examDate);
    const days = Math.max(1, Math.ceil((exam - now)/(1000*60*60*24)));
    // weight: closer exams higher, difficulty and weakness increase weight
    const weight = (1/Math.log(days+1)) * (1 + (s.difficulty||1)/3) * (s.isWeak?1.3:1);
    return Object.assign({},s,{days,weight});
  });

  // normalize weights to allocate hours
  const totalWeight = subjects.reduce((a,b)=>a+b.weight,0) || 1;
  // Generate plan for next 14 days or until nearest exam
  const horizon = Math.max(7, Math.min(60, ...subjects.map(s=>s.days)));
  const plan = {};
  for(let d=0; d<horizon; d++){
    const day = new Date(now.getFullYear(),now.getMonth(),now.getDate()+d);
    const dayKey = day.toISOString().slice(0,10);
    plan[dayKey] = [];
    // allocate subjects for the day trying to balance load
    subjects.forEach(s=>{
      // base time proportionate to weight and available hours
      const hours = Math.max(0.25, (s.weight/totalWeight) * dailyHours);
      // reduce allocation as exam approaches if already covered; allow more time for close exams
      const extraForClose = s.days < 7 ? 0.5 : 0;
      plan[dayKey].push({subject:s.name,hours:Math.round((hours+extraForClose)*2)/2});
    });
    // keep daily total roughly dailyHours by trimming
    const total = plan[dayKey].reduce((a,b)=>a+b.hours,0);
    if(total>dailyHours){
      const factor = dailyHours/total;
      plan[dayKey] = plan[dayKey].map(it=>({subject:it.subject,hours:Math.round(it.hours*factor*2)/2}));
    }
  }
  return plan;
}

// Helper to create human-readable plan HTML
function renderPlan(plan, container){
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'plan-list';
  Object.keys(plan).slice(0,30).forEach(day=>{
    const block = document.createElement('div'); block.className='plan-day';
    const h = document.createElement('h4'); h.textContent = new Date(day).toDateString(); block.appendChild(h);
    const ul = document.createElement('ul');
    plan[day].forEach(it=>{ const li=document.createElement('li'); li.textContent=`${it.subject} - ${it.hours} hrs`; ul.appendChild(li)});
    block.appendChild(ul); wrap.appendChild(block);
  });
  container.appendChild(wrap);
}
