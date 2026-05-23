// Planner logic: manage subjects and generate study plans
(function(){
  const subjKey = 'asp_subjects';
  const planKey = 'asp_plan';
  function currentUser(){return JSON.parse(localStorage.getItem('asp_current') || 'null')}
  function currentUserEmail(){const user = currentUser(); return user ? user.email : 'guest@study.app'}
  function userSubjectKey(){return `${subjKey}_${currentUserEmail()}`}
  function userPlanKey(){return `${planKey}_${currentUserEmail()}`}
  function loadSubjectsLocal(){return JSON.parse(localStorage.getItem(userSubjectKey())||'[]')}
  function saveSubjectsLocal(s){localStorage.setItem(userSubjectKey(),JSON.stringify(s))}

  const form = document.getElementById('subjectForm');
  const list = document.getElementById('subjectsList');
  const genBtn = document.getElementById('generatePlan');
  const out = document.getElementById('generatedPlan');
  const dailyHoursInput = document.getElementById('dailyHours');

  // detect backend
  let backendAvailableCache = null;
  async function backendAvailable(){ if(backendAvailableCache!==null) return backendAvailableCache; try{ const res = await fetch('/api/ping',{cache:'no-store'}); backendAvailableCache = res.ok; return backendAvailableCache }catch(e){ backendAvailableCache=false; return false } }

  async function loadSubjects(){
    if(await backendAvailable()){
      const res = await fetch(`/api/subjects?userEmail=${encodeURIComponent(currentUserEmail())}`); return await res.json();
    } else return loadSubjectsLocal();
  }
  async function saveSubject(s){
    s.userEmail = currentUserEmail();
    if(await backendAvailable()){
      const res = await fetch('/api/subjects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(s)}); return await res.json();
    } else {
      const arr = loadSubjectsLocal(); arr.push(s); saveSubjectsLocal(arr); return s;
    }
  }
  async function deleteSubject(id){ if(await backendAvailable()){ await fetch(`/api/subjects/${id}?userEmail=${encodeURIComponent(currentUserEmail())}`,{method:'DELETE'}); } else { const arr=loadSubjectsLocal().filter(x=>x.id!==id); saveSubjectsLocal(arr); } }

  async function renderSubjects(){
    if(!list) return; list.innerHTML=''; const subs = await loadSubjects();
    if(!subs.length){
      list.innerHTML = '<li>No subjects yet. Add your first subject from the form.</li>';
      return;
    }
    subs.forEach((s,idx)=>{
      const li = document.createElement('li');
      li.textContent = `${s.name} - ${s.examDate} - ${['Easy','Medium','Hard'][s.difficulty-1]} ${s.isWeak?'(Weak)':''}`;
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn ghost'; del.addEventListener('click',async ()=>{ await deleteSubject(s.id); renderSubjects() });
      li.appendChild(del); list.appendChild(li);
    })
  }

  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const name=document.getElementById('subjectName').value;
      const examDate=document.getElementById('examDate').value;
      const difficulty=parseInt(document.getElementById('difficulty').value);
      const isWeak=document.getElementById('isWeak').checked;
      const subj = {id:Date.now(),name,examDate,difficulty,isWeak};
      await saveSubject(subj); renderSubjects(); form.reset();
    })
  }

  if(genBtn){
    genBtn.addEventListener('click',async ()=>{
      const subjects = await loadSubjects();
      if(!subjects.length){alert('Add your subjects first.');return}
      const dailyHours = Number(dailyHoursInput ? dailyHoursInput.value : localStorage.getItem('asp_daily_hours')) || 3;
      localStorage.setItem('asp_daily_hours', String(dailyHours));
      const plan = generateStudyPlan(subjects,{dailyHours});
      renderPlan(plan,out);
      // save to backend if available
      if(await backendAvailable()) await fetch(`/api/plan?userEmail=${encodeURIComponent(currentUserEmail())}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(plan)});
      else localStorage.setItem(userPlanKey(), JSON.stringify(plan));
    })
  }

  const exportBtn = document.getElementById('exportPDF');
  if(exportBtn) exportBtn.addEventListener('click',()=>window.print());

  // Render only the current user's saved subjects. No default subjects are inserted.
  renderSubjects();

  // show cached plan if exists
  (async function showCached(){ const cachedEl = document.getElementById('generatedPlan'); if(!cachedEl) return; if(await backendAvailable()){ const res = await fetch(`/api/plan?userEmail=${encodeURIComponent(currentUserEmail())}`); if(res.ok){ const plan = await res.json(); if(plan && Object.keys(plan).length) renderPlan(plan, cachedEl); } } else { const planData = localStorage.getItem(userPlanKey()); if(planData) renderPlan(JSON.parse(planData), cachedEl); }})();
})();

