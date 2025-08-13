<script>
// Registrar Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Botón para instalar (opcional si agregas un botón con id="btnInstall")
let deferredPrompt = null;
const btnInstall = document.getElementById('btnInstall');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (btnInstall) btnInstall.style.display = 'inline-block';
});

if (btnInstall) {
  btnInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btnInstall.style.display = 'none';
  });
}

// Aviso de actualización
navigator.serviceWorker?.getRegistration().then((reg) => {
  if (!reg) return;
  function askToUpdate() {
    if (confirm('Hay una actualización de RecargApp V1.1. ¿Aplicar ahora?')) {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    }
  }
  if (reg.waiting) askToUpdate();
  reg.addEventListener('updatefound', () => {
    const newSW = reg.installing;
    if (!newSW) return;
    newSW.addEventListener('statechange', () => {
      if (newSW.state === 'installed' && navigator.serviceWorker.controller) askToUpdate();
    });
  });
});
</script>
