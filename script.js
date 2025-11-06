// === CONFIGURACIÓN ===
const CLOUDINARY_NAME = 'dnhrk78ul';
const CLOUDINARY_PRESET = 'boda2025';
const JSON_URL = 'https://raw.githubusercontent.com/lozanoroa/boda-jonatan-michel/main/data/recuerdos.json';
const WEBHOOK_URL = 'https://eokyeowbog4qiei.m.pipedream.net'; // ← TU URL

// === ELEMENTOS ===
const uploadBtn = document.getElementById('uploadBtn');
const openGalleryBtn = document.getElementById('openGalleryBtn');
const galleryModal = document.getElementById('galleryModal');
const passwordModal = document.getElementById('passwordModal');
const media

File = document.getElementById('mediaFile');
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

let isAuth = false;
let currentUrl = '';
let qrGenerated = false;

// === CARGAR GALERÍA ===
async function loadGallery() {
  galleryGrid.innerHTML = '<p style="text-align:center;">Cargando...</p>';
  try {
    const res = await fetch(JSON_URL + '?t=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    galleryGrid.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
      return galleryGrid.innerHTML = '<p style="text-align:center;font-style:italic;">Sin recuerdos aún</p>';
    }

    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    data.forEach(d => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.marginBottom = '20px';
      const mediaHTML = d.type === 'image'
        ? `<img src="${d.url}" loading="lazy" style="width:100%;border-radius:12px;cursor:pointer;">`
        : `<video controls style="width:100%;height:180px;border-radius:12px;cursor:pointer;"><source src="${d.url}#t=0.1"></video>`;
      item.innerHTML = mediaHTML + `<p style="margin:8px 0;font-size:14px;">${d.message || ''}</p>`;
      
      item.querySelector(d.type === 'image' ? 'img' : 'video').onclick = () => {
        currentUrl = d.url;
        previewModal.style.display = 'block';
        previewMedia.innerHTML = d.type === 'image'
          ? `<img src="${d.url}" style="max-width:100%;max-height:70vh;border-radius:12px;">`
          : `<video controls style="max-width:100%;max-height:70vh;border-radius:12px;"><source src="${d.url}"></video>`;
      };
      galleryGrid.appendChild(item);
    });
  } catch {
    galleryGrid.innerHTML = '<p style="text-align:center;color:red;">Error. Recarga.</p>';
  }
}

// === SUBIR ===
submitUpload.onclick = async () => {
  const files = mediaFile.files;
  const msg = messageInput.value.trim();
  if (!files.length) return alert('Selecciona archivo');

  submitUpload.disabled = true;
  submitUpload.textContent = 'Subiendo...';

  const items = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
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
  }

  if (items.length > 0) {
    try {
      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      if (r.ok) {
        alert(`${items.length} subido(s) y sincronizado!`);
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
uploadBtn.onclick = () => { galleryModal.style.display = 'block'; modalTitle.textContent = 'Sube tus recuerdos'; selectFilesBtn.style.display = 'block'; messageInput.style.display = 'block'; submitUpload.style.display = 'block'; galleryGrid.style.display = 'none'; qrSection.style.display = 'none'; setTimeout(() => mediaFile.click(), 300); };
selectFilesBtn.onclick = () => mediaFile.click();
openGalleryBtn.onclick = () => { isAuth ? openGallery() : passwordModal.style.display = 'block'; };
enterAdmin.onclick = () => { if (adminPassword.value.trim() === 'Jonatanymichel') { isAuth = true; passwordModal.style.display = 'none'; openGallery(); } else alert('Contraseña incorrecta'); adminPassword.value = ''; };

function openGallery() {
  galleryModal.style.display = 'block'; modalTitle.textContent = 'Galería de Recuerdos'; selectFilesBtn.style.display = 'none'; messageInput.style.display = 'none'; submitUpload.style.display = 'none'; galleryGrid.style.display = 'block'; qrSection.style.display = 'block'; loadGallery();
}

document.querySelectorAll('.close, .close-preview').forEach(b => b.onclick = () => { galleryModal.style.display = passwordModal.style.display = previewModal.style.display = qrContainer.style.display = 'none'; });
window.onclick = e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

downloadMedia.onclick = () => { if (currentUrl) { const a = document.createElement('a'); a.href = currentUrl; a.download = ''; a.click(); } };

generateQr.onclick = () => {
  if (qrGenerated) return;
  qrContainer.style.display = 'block';
  new QRCode(document.getElementById('qrcode'), { text: 'https://lozanoroa.github.io/boda-jonatan-michel/', width: 240, height: 240, colorDark: '#000', colorLight: '#fff' });
  generateQr.style.display = 'none';
  qrGenerated = true;
};

downloadQr.onclick = () => {
  const canvas = document.querySelector('#qrcode canvas');
  if (canvas) { const a = document.createElement('a'); a.download = 'QR-Boda.png'; a.href = canvas.toDataURL(); a.click(); }
};
