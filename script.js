// === CONFIGURACIÓN 100% LISTA ===
const CLOUDINARY_CLOUD_NAME = 'dnhrk78ul';
const CLOUDINARY_UPLOAD_PRESET = 'boda2025';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqagrbyb';

// === Elementos ===
const uploadBtn = document.getElementById('uploadBtn');
const openGalleryBtn = document.getElementById('openGalleryBtn');
const galleryModal = document.getElementById('galleryModal');
const passwordModal = document.getElementById('passwordModal');
const uploadForm = document.getElementById('uploadForm');
const galleryGrid = document.getElementById('galleryGrid');
const qrSection = document.getElementById('qrSection');
const generateQr = document.getElementById('generateQr');
const qrContainer = document.getElementById('qrContainer');
const downloadQr = document.getElementById('downloadQr');
const adminPassword = document.getElementById('adminPassword');
const enterAdmin = document.getElementById('enterAdmin');

let isAuthenticated = false;
let qrGenerated = false;

// === ABRIR MODAL PÚBLICO: SOLO SUBIDA (botón "Subir recuerdo") ===
uploadBtn.addEventListener('click', () => {
  galleryModal.style.display = 'block';
  uploadForm.style.display = 'block';
  galleryGrid.style.display = 'none';   // ← NO SE VE
  qrSection.style.display = 'none';    // ← NO SE VE
  qrContainer.style.display = 'none';
});

// === REQUERIR CONTRASEÑA PARA VER GALERÍA Y QR ===
function requireAuth() {
  if (!isAuthenticated) {
    passwordModal.style.display = 'block';
    return false;
  }
  return true;
}

// === ABRIR VISTA COMPLETA SOLO CON CONTRASEÑA ===
function openAuthenticatedView() {
  galleryModal.style.display = 'block';
  uploadForm.style.display = 'block';
  galleryGrid.style.display = 'block';   // ← VISIBLE
  qrSection.style.display = 'block';     // ← VISIBLE
  qrContainer.style.display = 'none';
  loadGallery();
}

// === ABRIR DESDE FOTO DE PAREJA (requiere contraseña) ===
openGalleryBtn.addEventListener('click', () => {
  if (requireAuth()) {
    openAuthenticatedView();
  }
});

// === INGRESAR CON CONTRASEÑA ===
enterAdmin.addEventListener('click', () => {
  const pwd = adminPassword.value.trim();
  if (pwd === 'Jonatanymichel') {
    isAuthenticated = true;
    passwordModal.style.display = 'none';
    openAuthenticatedView();
    adminPassword.value = '';
  } else {
    alert('Contraseña incorrecta');
    adminPassword.value = '';
  }
});

// === CERRAR MODALES ===
document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', () => {
    galleryModal.style.display = 'none';
    passwordModal.style.display = 'none';
    qrContainer.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target === galleryModal) {
    galleryModal.style.display = 'none';
    qrContainer.style.display = 'none';
  }
  if (e.target === passwordModal) passwordModal.style.display = 'none';
});

// === SUBIR ARCHIVOS (PÚBLICO, desde botón "Subir recuerdo") ===
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const files = document.getElementById('mediaFile').files;
  const message = document.getElementById('messageInput').value.trim();

  if (files.length === 0) {
    alert('Selecciona al menos una foto o video');
    return;
  }

  const submitBtn = uploadForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Subiendo...';

  const uploadPromises = Array.from(files).map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      );

      const data = await res.json();
      if (!data.secure_url) throw new Error('Error en Cloudinary');

      const url = data.secure_url;
      const type = file.type.startsWith('image/') ? 'image' : 'video';

      // Backup en Formspree
      const backup = new FormData();
      backup.append('url', url);
      backup.append('type', type);
      backup.append('message', message);
      backup.append('timestamp', new Date().toLocaleString());

      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: backup,
        headers: { 'Accept': 'application/json' }
      }).catch(() => {});

      // Guardar en localStorage
      const recuerdos = JSON.parse(localStorage.getItem('recuerdos_boda') || '[]');
      recuerdos.push({ url, type, message, timestamp: new Date() });
      localStorage.setItem('recuerdos_boda', JSON.stringify(recuerdos));

      return { url, type, message };
    } catch (err) {
      console.error('Error subiendo:', err);
      return null;
    }
  });

  const results = (await Promise.all(uploadPromises)).filter(r => r);

  if (results.length > 0) {
    alert(`${results.length} recuerdo(s) subido(s) con éxito!`);
    uploadForm.reset();
    if (isAuthenticated) loadGallery(); // ← Solo recarga si ya está autenticado
  } else {
    alert('Error al subir. Intenta con menos archivos.');
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Subir Recuerdo';
});

// === CARGAR GALERÍA (solo con contraseña) ===
function loadGallery() {
  const recuerdos = JSON.parse(localStorage.getItem('recuerdos_boda') || '[]');
  galleryGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Cargando...</p>';

  setTimeout(() => {
    galleryGrid.innerHTML = '';
    if (recuerdos.length === 0) {
      galleryGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;font-style:italic;">Sin recuerdos aún</p>';
      return;
    }

    recuerdos.forEach(r => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      if (r.type === 'image') {
        item.innerHTML = `<img src="${r.url}" loading="lazy" alt="Recuerdo"><p>${r.message || ''}</p>`;
      } else {
        item.innerHTML = `
          <video controls preload="metadata" style="width:100%;height:170px;object-fit:cover;border-radius:12px;">
            <source src="${r.url}#t=0.1" type="video/mp4">
            Tu navegador no soporta video.
          </video>
          <p>${r.message || ''}</p>
        `;
      }
      galleryGrid.appendChild(item);
    });
  }, 300);
}

// === GENERAR QR EN NEGRO (solo con contraseña) ===
generateQr.addEventListener('click', () => {
  if (qrGenerated) return;
  
  qrContainer.style.display = 'block';
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  
  if (typeof QRCode === 'undefined') {
    alert('Error: Recarga la página para cargar la librería QR.');
    return;
  }
  
  new QRCode(qrDiv, {
    text: 'https://lozanoroa.github.io/boda-jonatan-michel/',
    width: 240,
    height: 240,
    colorDark: '#000000',   // ← NEGRO
    colorLight: '#ffffff',  // ← BLANCO
    correctLevel: QRCode.CorrectLevel.H
  });
  
  generateQr.style.display = 'none';
  qrGenerated = true;
});

// === DESCARGAR QR ===
downloadQr.addEventListener('click', () => {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) {
    alert('Primero genera el QR');
    return;
  }
  const link = document.createElement('a');
  link.download = 'QR-Boda-Jonatan-Michel.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
