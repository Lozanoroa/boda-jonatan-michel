// === CONFIGURACIÓN ===
const CLOUDINARY_CLOUD_NAME = 'dnhrk78ul';
const CLOUDINARY_UPLOAD_PRESET = 'boda2025';
const FORMSPREE_GET = 'https://formspree.io/f/mqagrbyb';  // Recibe datos
const FORMSPREE_POST = 'https://formspree.io/f/mqagrbyb'; // Envía datos

// === ELEMENTOS ===
const uploadBtn = document.getElementById('uploadBtn');
const openGalleryBtn = document.getElementById('openGalleryBtn');
const galleryModal = document.getElementById('galleryModal');
const passwordModal = document.getElementById('passwordModal');
const mediaFile = document.getElementById('mediaFile');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const messageInput = document.getElementById('messageInput');
const submitUpload = document.getElementById('submitUpload');
const galleryGrid = document.getElementById('galleryGrid');
const qrSection = document.getElementById('qrSection');
const generateQr = document.getElementById('generateQr');
const qrContainer = document.getElementById('qrContainer');
const downloadQr = document.getElementById('downloadQr');
const adminPassword = document.getElementById('adminPassword');
const enterAdmin = document.getElementById('enterAdmin');
const modalTitle = document.getElementById('modalTitle');
const previewModal = document.getElementById('previewModal');
const previewMedia = document.getElementById('previewMedia');
const downloadMedia = document.getElementById('downloadMedia');
const closePreview = document.querySelector('.close-preview');

let isAuthenticated = false;
let qrGenerated = false;
let currentMediaUrl = '';
let lastSync = 0;

// === SINCRONIZAR DESDE FORMSREE (CADA 8 SEGUNDOS) ===
async function syncFromServer() {
  try {
    const res = await fetch(FORMSPREE_GET + '?_limit=1000');
    const text = await res.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return;

    const serverData = JSON.parse(match[0]);
    const localData = JSON.parse(localStorage.getItem('recuerdos_boda') || '[]');
    const merged = [...localData];

    serverData.forEach(item => {
      if (!merged.find(m => m.url === item.url && m.timestamp === item.timestamp)) {
        merged.push(item);
      }
    });

    localStorage.setItem('recuerdos_boda', JSON.stringify(merged));
    if (galleryGrid.style.display === 'block') loadGallery();
    lastSync = Date.now();
  } catch (err) {
    console.log('Sync falló (normal si no hay datos aún):', err);
  }
}

// Carga inicial + cada 8 segundos
syncFromServer();
setInterval(() => {
  if (Date.now() - lastSync > 8000) syncFromServer();
}, 8000);

// === SUBIR ARCHIVO ===
submitUpload.addEventListener('click', async () => {
  const files = mediaFile.files;
  const message = messageInput.value.trim();
  if (files.length === 0) return alert('Selecciona al menos una foto o video');

  submitUpload.disabled = true;
  submitUpload.textContent = 'Subiendo...';

  const uploadPromises = Array.from(files).map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.secure_url) return false;

      const url = data.secure_url;
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const timestamp = new Date().toISOString();

      const newItem = { url, type, message, timestamp };
      const recuerdos = JSON.parse(localStorage.getItem('recuerdos_boda') || '[]');
      recuerdos.push(newItem);
      localStorage.setItem('recuerdos_boda', JSON.stringify(recuerdos));

      // Enviar a Formspree para sincronizar
      const backup = new FormData();
      backup.append('data', JSON.stringify(recuerdos));
      await fetch(FORMSPREE_POST, { method: 'POST', body: backup }).catch(() => {});

      return true;
    } catch {
      return false;
    }
  });

  const results = await Promise.all(uploadPromises);
  const success = results.filter(r => r).length;

  alert(success > 0 ? `${success} recuerdo(s) subido(s)!` : 'Error al subir.');
  mediaFile.value = '';
  messageInput.value = '';
  submitUpload.disabled = false;
  submitUpload.textContent = 'Subir Recuerdo';
  if (galleryGrid.style.display === 'block') loadGallery();
});

// === CARGAR GALERÍA ===
function loadGallery() {
  const recuerdos = JSON.parse(localStorage.getItem('recuerdos_boda') || '[]');
  galleryGrid.innerHTML = '<p style="text-align:center;">Cargando...</p>';

  setTimeout(() => {
    galleryGrid.innerHTML = '';
    if (recuerdos.length === 0) {
      galleryGrid.innerHTML = '<p style="text-align:center;font-style:italic;">Sin recuerdos aún</p>';
      return;
    }

    // Ordenar por fecha
    recuerdos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    recuerdos.forEach((r, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.position = 'relative';
      item.style.marginBottom = '20px';
      item.style.cursor = 'pointer';

      if (r.type === 'image') {
        item.innerHTML = `
          <img src="${r.url}" loading="lazy" class="preview-img" style="width:100%;border-radius:12px;">
          <p style="margin:8px 0;font-size:14px;">${r.message || ''}</p>
          <button class="delete-btn" data-index="${index}">X</button>
        `;
      } else {
        item.innerHTML = `
          <video controls preload="metadata" class="preview-video" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
            <source src="${r.url}#t=0.1" type="video/mp4">
          </video>
          <p style="margin:8px 0;font-size:14px;">${r.message || ''}</p>
          <button class="delete-btn" data-index="${index}">X</button>
        `;
      }
      galleryGrid.appendChild(item);

      const mediaEl = item.querySelector(r.type === 'image' ? '.preview-img' : '.preview-video');
      mediaEl.addEventListener('click', () => {
        currentMediaUrl = r.url;
        previewModal.style.display = 'block';
        previewMedia.innerHTML = r.type === 'image'
          ? `<img src="${r.url}" style="max-width:100%;max-height:70vh;border-radius:12px;">`
          : `<video controls style="max-width:100%;max-height:70vh;border-radius:12px;"><source src="${r.url}" type="video/mp4"></video>`;
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return alert('No tienes permiso.');
        const index = btn.getAttribute('data-index');
        if (confirm('¿Eliminar este recuerdo?')) {
          recuerdos.splice(index, 1);
          localStorage.setItem('recuerdos_boda', JSON.stringify(recuerdos));
          loadGallery();
          // Opcional: reenviar a Formspree
        }
      });
    });
  }, 300);
}

// === MODALES ===
uploadBtn.addEventListener('click', () => {
  galleryModal.style.display = 'block';
  modalTitle.textContent = 'Sube tus recuerdos';
  selectFilesBtn.style.display = 'block';
  messageInput.style.display = 'block';
  submitUpload.style.display = 'block';
  galleryGrid.style.display = 'none';
  qrSection.style.display = 'none';
  qrContainer.style.display = 'none';
  messageInput.value = '';
  setTimeout(() => mediaFile.click(), 300);
});

selectFilesBtn.addEventListener('click', () => mediaFile.click());

function requireAuth() {
  if (!isAuthenticated) {
    passwordModal.style.display = 'block';
    return false;
  }
  return true;
}

function openRestrictedView() {
  galleryModal.style.display = 'block';
  modalTitle.textContent = 'Galería de Recuerdos';
  selectFilesBtn.style.display = 'none';
  messageInput.style.display = 'none';
  submitUpload.style.display = 'none';
  galleryGrid.style.display = 'block';
  qrSection.style.display = 'block';
  qrContainer.style.display = 'none';
  loadGallery();
}

openGalleryBtn.addEventListener('click', () => {
  if (requireAuth()) openRestrictedView();
});

enterAdmin.addEventListener('click', () => {
  const pwd = adminPassword.value.trim();
  if (pwd === 'Jonatanymichel') {
    isAuthenticated = true;
    passwordModal.style.display = 'none';
    openRestrictedView();
    adminPassword.value = '';
  } else {
    alert('Contraseña incorrecta');
  }
});

document.querySelectorAll('.close, .close-preview').forEach(btn => {
  btn.addEventListener('click', () => {
    galleryModal.style.display = 'none';
    passwordModal.style.display = 'none';
    previewModal.style.display = 'none';
    qrContainer.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

downloadMedia.addEventListener('click', () => {
  if (!currentMediaUrl) return;
  const link = document.createElement('a');
  link.href = currentMediaUrl;
  link.download = '';
  link.click();
});

generateQr.addEventListener('click', () => {
  if (qrGenerated) return;
  qrContainer.style.display = 'block';
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: 'https://lozanoroa.github.io/boda-jonatan-michel/',
    width: 240, height: 240, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
  });
  generateQr.style.display = 'none';
  qrGenerated = true;
});

downloadQr.addEventListener('click', () => {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) return alert('Primero genera el QR');
  const link = document.createElement('a');
  link.download = 'QR-Boda-Jonatan-Michel.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
