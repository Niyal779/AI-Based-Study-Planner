// Simple client-side auth with localStorage and optional Firebase support
// This provides demo login/register to make the app usable without backend.
(function(){
  const demoUserKey = 'asp_users';
  function getUsers(){return JSON.parse(localStorage.getItem(demoUserKey)||'[]')}
  function saveUsers(u){localStorage.setItem(demoUserKey,JSON.stringify(u))}

  // detect backend availability
  let backendAvailableCache = null;
  async function backendAvailable(){
    if(backendAvailableCache!==null) return backendAvailableCache;
    try{ const res = await fetch('/api/ping',{cache:'no-store'}); backendAvailableCache = res.ok; return backendAvailableCache }catch(e){ backendAvailableCache=false; return false }
  }

  async function backendRegister(user){
    const res = await fetch('/api/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(user)});
    if(!res.ok) throw await res.json(); return res.json();
  }
  async function backendLogin(creds){
    const res = await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(creds)});
    if(!res.ok) throw await res.json(); return res.json();
  }

  // Register
  const reg = document.getElementById('registerForm');
  if(reg){
    reg.addEventListener('submit',async e=>{
      e.preventDefault();
      const name=document.getElementById('fullname').value;
      const email=document.getElementById('email').value;
      const pw=document.getElementById('password').value;
      const users=getUsers();
      if(users.find(x=>x.email===email)){alert('User exists');return}
      const user = {name,email,password:pw};
      if(await backendAvailable()){
        try{ await backendRegister(user); alert('Account created - you can login now'); location.href='login.html' }catch(err){ alert(err.error || 'Register failed') }
      } else {
        users.push(user); saveUsers(users);
        alert('Account created - you can login now'); location.href='login.html';
      }
    })
  }

  // Login
  const login = document.getElementById('loginForm');
  if(login){
    login.addEventListener('submit',async e=>{
      e.preventDefault();
      const email=document.getElementById('email').value;
      const pw=document.getElementById('password').value;
      if(await backendAvailable()){
        try{
          const user = await backendLogin({email,password:pw});
          localStorage.setItem('asp_current', JSON.stringify(user)); location.href='dashboard.html';
        }catch(err){ alert('Invalid credentials - try demo: demo@study.app / password') }
      } else {
        const user = getUsers().find(u=>u.email===email && u.password===pw);
        if(user){ localStorage.setItem('asp_current', JSON.stringify(user)); location.href='dashboard.html'; }
        else alert('Invalid credentials - try demo: demo@study.app / password');
      }
    })
  }

  // Simple logout
  const logout = document.getElementById('logout');
  if(logout) logout.addEventListener('click', ()=>{localStorage.removeItem('asp_current');location.href='index.html'})

  // Set demo account if none
  if(!getUsers().length){ saveUsers([{name:'Demo Student',email:'demo@study.app',password:'password'}]); }

  // Guard pages that require auth (dashboard, planner, analytics, settings)
  const guard = ['dashboard.html','planner.html','analytics.html','settings.html'];
  const path = window.location.pathname.split('/').pop();
  if(guard.includes(path)){
    const cur = localStorage.getItem('asp_current');
    if(!cur){
      // allow demo quick access
      const tryDemo = confirm('No session found. Continue as Demo?');
      if(tryDemo){ const users=getUsers(); const demo = users[0]; localStorage.setItem('asp_current', JSON.stringify(demo)); }
      else { location.href='login.html' }
    }
  }

  // User display
  const currentUser = JSON.parse(localStorage.getItem('asp_current') || 'null');
  const accountEmail = document.getElementById('accountEmail');
  if(accountEmail && currentUser) accountEmail.textContent = `${currentUser.name || 'Student'} - ${currentUser.email}`;
  const welcome = document.querySelector('.main-header h2');
  if(welcome && currentUser && welcome.textContent.trim() === 'Welcome') welcome.textContent = `Welcome, ${currentUser.name || 'Student'}`;

  // Theme toggle handling
  if(localStorage.getItem('asp_theme') === 'dark') document.body.classList.add('dark');
  function saveTheme(){ localStorage.setItem('asp_theme', document.body.classList.contains('dark') ? 'dark' : 'light') }
  const themeToggle = document.getElementById('toggleTheme');
  if(themeToggle) themeToggle.addEventListener('click', ()=>{document.body.classList.toggle('dark'); saveTheme()})
  const darkCheckbox = document.getElementById('darkMode');
  if(darkCheckbox){ darkCheckbox.checked = !!document.body.classList.contains('dark'); darkCheckbox.addEventListener('change',()=>{document.body.classList.toggle('dark'); saveTheme()}) }
})();
