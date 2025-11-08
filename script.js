// === CONFIGURACIÓN ===
const CLOUDINARY_NAME = 'dnhrk78ul';
const CLOUDINARY_PRESET = 'boda2025';
const JSON_URL = 'https://raw.githubusercontent.com/lozanoroa/boda-jonatan-michel/main/data/recuerdos.json';
const WEBHOOK_URL = 'https://eokyeowbog4qiei.m.pipedream.net';

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
const uploadSection = document.getElementById('uploadSection');

let isAuth = false;
let currentUrl = '';
let qrGenerated = false;

// === CARGAR GALERÍA ===
async function loadGallery() {
  galleryGrid.innerHTML = '<p style="text-align:center;padding:20px;">Cargando recuerdos...</p>';
  try {
    const res = await fetch(JSON_URL + '?t=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    galleryGrid.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
      return galleryGrid.innerHTML = '<p style="text-align:center;font-style:italic;">Aún no hay recuerdos. ¡Sé el primero en compartir!</p>';
    }

    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    data.forEach(d => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.onclick = () => openPreview(d.url, d.type);
      const mediaHTML = d.type === 'image'
        ? `<img src="${d.url}" loading="lazy">`
        : `<video controls><source src="${d.url}#t=0.1"></video>`;
      item.innerHTML = mediaHTML + `<p>${d.message || ''}</p>`;
      galleryGrid.appendChild(item);
    });
  } catch {
    galleryGrid.innerHTML = '<p style="text-align:center;color:red;">Error de conexión. Intenta de nuevo.</p>';
  }
}

// === PREVIEW ===
function openPreview(url, type) {
  currentUrl = url;
  previewModal.style.display = 'block';
  previewMedia.innerHTML = type === 'image'
    ? `<img src="${url}" style="max-width:100%;max-height:70vh;border-radius:15px;">`
    : `<video controls style="max-width:100%;max-height:70vh;border-radius:15px;"><source src="${url}"></video>`;
}

// === SUBIR ===
submitUpload.onclick = async () => {
  const files = mediaFile.files;
  const msg = messageInput.value.trim();
  if (!files.length) return alert('Selecciona al menos un archivo');

  submitUpload.disabled = true;
  submitUpload.textContent = 'Subiendo...';

  const items = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) {
        items.push({
          url: data.secure_url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          message: msg,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) { console.error(e); }
  }

  if (items.length > 0) {
    try {
      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      if (r.ok) {
        alert(`${items.length} recuerdo(s) subido(s) y sincronizado(s)!`);
        setTimeout(loadGallery, 5000);
      } else throw new Error();
    } catch {
      alert('Subido a Cloudinary, pero no sincronizado. Intenta de nuevo.');
    }
  } else {
    alert('Error al subir a Cloudinary');
  }

  mediaFile.value = ''; messageInput.value = ''; submitUpload.disabled = false; submitUpload.textContent = 'Subir Recuerdo';
};

// === MODALES ===
uploadBtn.onclick = () => {
  galleryModal.style.display = 'block';
  modalTitle.textContent = 'Sube tus recuerdos';
  uploadSection.style.display = 'block';
  galleryGrid.style.display = 'none';
  qrSection.style.display = 'none';
  setTimeout(() => mediaFile.click(), 300);
};

selectFilesBtn.onclick = () => mediaFile.click();

openGalleryBtn.onclick = () => {
  if (isAuth) openGallery();
  else passwordModal.style.display = 'block';
};

enterAdmin.onclick = () => {
  if (adminPassword.value.trim() === 'Jonatanymichel') {
    isAuth = true;
    passwordModal.style.display = 'none';
    openGallery();
  } else {
    alert('Contraseña incorrecta');
  }
  adminPassword.value = '';
};

function openGallery() {
  galleryModal.style.display = 'block';
  modalTitle.textContent = 'Galería de Recuerdos';
  uploadSection.style.display = 'none';
  galleryGrid.style.display = 'grid';
  qrSection.style.display = 'block';
  loadGallery();
}

// Cerrar modales
document.querySelectorAll('.close, .close-preview').forEach(btn => {
  btn.onclick = () => {
    galleryModal.style.display = 'none';
    passwordModal.style.display = 'none';
    previewModal.style.display = 'none';
    qrContainer.style.display = 'none';
  };
});

window.onclick = e => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

// Descargar
downloadMedia.onclick = () => {
  if (currentUrl) {
    const a = document.createElement('a');
    a.href = currentUrl;
    a.download = '';
    a.click();
  }
};

// QR NEGRO
generateQr.onclick = () => {
  if (qrGenerated) return;
  qrContainer.style.display = 'block';
  new QRCode(document.getElementById('qrcode'), {
    text: 'https://lozanoroa.github.io/boda-jonatan-michel/',
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff'
  });
  generateQr.style.display = 'none';
  qrGenerated = true;
};

downloadQr.onclick = () => {
  const canvas = document.querySelector('#qrcode canvas');
  if (canvas) {
    const a = document.createElement('a');
    a.download = 'QR-Boda-Jonatan-Michel.png';
    a.href = canvas.toDataURL();
    a.click();
  }
};
