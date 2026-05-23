// Settings page: study preferences, GPA target and reminder controls.
(function(){
  const form = document.getElementById('settingsForm');
  const dailyHours = document.getElementById('settingsDailyHours');
  const gpaTarget = document.getElementById('gpaTarget');
  const reminders = document.getElementById('reminders');

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

  function localSettings(){
    return {
      dailyHours: Number(localStorage.getItem('asp_daily_hours') || 3),
      gpaTarget: Number(localStorage.getItem('asp_gpa_target') || 3.8),
      reminders: localStorage.getItem('asp_reminders') !== 'false'
    };
  }

  function saveLocalSettings(settings){
    localStorage.setItem('asp_daily_hours', String(settings.dailyHours));
    localStorage.setItem('asp_gpa_target', String(settings.gpaTarget));
    localStorage.setItem('asp_reminders', String(settings.reminders));
  }

  async function loadSettings(){
    if(await backendAvailable()){
      const response = await fetch('/api/settings');
      return response.json();
    }
    return localSettings();
  }

  async function saveSettings(settings){
    saveLocalSettings(settings);
    if(await backendAvailable()){
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings)
      });
    }
  }

  async function hydrate(){
    if(!form) return;
    const settings = await loadSettings();
    dailyHours.value = settings.dailyHours || 3;
    gpaTarget.value = settings.gpaTarget || 3.8;
    reminders.checked = settings.reminders !== false;
  }

  if(form){
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveSettings({
        dailyHours: Number(dailyHours.value),
        gpaTarget: Number(gpaTarget.value),
        reminders: reminders.checked
      });
      alert('Settings saved successfully.');
    });
  }

  hydrate();
})();
