// === CONFIGURACIÓN ===
const CLOUDINARY_NAME = 'dnhrk78ul';
const CLOUDINARY_PRESET = 'boda2025';
const JSON_URL = 'https://raw.githubusercontent.com/lozanoroa/boda-jonatan-michel/main/data/recuerdos.json';
const DISPATCH_URL = 'https://api.github.com/repos/lozanoroa/boda-jonatan-michel/dispatches';

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

let isAuth = false;
let currentUrl = '';

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
  } catch (err) {
    console.error(err);
    galleryGrid.innerHTML = '<p style="text-align:center;color:red;">Error. Recarga la página.</p>';
  }
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
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, {
        method: 'POST',
        body: fd
      });
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
      await fetch(DISPATCH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'Bearer ${{ secrets.GH_TOKEN }}',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          event_type: 'update_gallery',
          client_payload: { data: items }
        })
      });
      alert(`${items.length} recuerdo(s) subido(s)!`);
      setTimeout(loadGallery, 5000);
    } catch (e) {
      alert('Error al sincronizar. Intenta de nuevo.');
      console.error(e);
    }
  } else {
    alert('Error al subir a Cloudinary');
  }

  mediaFile.value = '';
  messageInput.value = '';
  submitUpload.disabled = false;
  submitUpload.textContent = 'Subir Recuerdo';
};

// === MODALES ===
uploadBtn.onclick = () => {
  galleryModal.style.display = 'block';
  modalTitle.textContent = 'Sube tus recuerdos';
  selectFilesBtn.style.display = 'block';
  messageInput.style.display = 'block';
  submitUpload.style.display = 'block';
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
  selectFilesBtn.style.display = 'none';
  messageInput.style.display = 'none';
  submitUpload.style.display = 'none';
  galleryGrid.style.display = 'block';
  qrSection.style.display = 'block';
  loadGallery();
}

document.querySelectorAll('.close, .close-preview').forEach(b => {
  b.onclick = () => {
    galleryModal.style.display = 'none';
    passwordModal.style.display = 'none';
    previewModal.style.display = 'none';
    qrContainer.style.display = 'none';
  };
});

window.onclick = e => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

downloadMedia.onclick = () => {
  if (currentUrl) {
    const a = document.createElement('a');
    a.href = currentUrl;
    a.download = '';
    a.click();
  }
};

let qrGenerated = false;
generateQr.onclick = () => {
  if (qrGenerated) return;
  qrContainer.style.display = 'block';
  new QRCode(document.getElementById('qrcode'), {
    text: 'https://lozanoroa.github.io/boda-jonatan-michel/',
    width: 240,
    height: 240,
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
    a.download = 'QR-Boda.png';
    a.href = canvas.toDataURL();
    a.click();
  }
};
