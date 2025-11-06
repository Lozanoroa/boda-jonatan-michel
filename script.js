// === CONFIGURACIÓN CLOUDINARY ===
const CLOUDINARY_CLOUD_NAME = 'dnhrk78ul';
const CLOUDINARY_UPLOAD_PRESET = 'boda2025';
const CLOUDINARY_FOLDER = 'boda-jonatan-michel';
const CLOUDINARY_LIST_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/list/${CLOUDINARY_FOLDER}.json`;

// === Elementos ===
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

// === CARGAR RECUERDOS DESDE CLOUDINARY (SIEMPRE DISPONIBLE) ===
async function loadGallery() {
  galleryGrid.innerHTML = '<p style="text-align:center;">Cargando recuerdos...</p>';

  try {
    const res = await fetch(CLOUDINARY_LIST_URL);
    const data = await res.json();
    const resources = data.resources || [];

    if (resources.length === 0) {
      galleryGrid.innerHTML = '<p style="text-align:center;font-style:italic;">Sin recuerdos aún</p>';
      return;
    }

    galleryGrid.innerHTML = '';
    resources.forEach((r, index) => {
      const url = r.secure_url;
      const type = r.resource_type === 'image' ? 'image' : 'video';
      const publicId = r.public_id;

      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.position = 'relative';
      item.style.marginBottom = '20px';
      item.style.cursor = 'pointer';

      if (type === 'image') {
        item.innerHTML = `
          <img src="${url}" loading="lazy" style="width:100%;border-radius:12px;" class="preview-img">
          <button class="delete-btn" data-id="${publicId}">X</button>
        `;
      } else {
        item.innerHTML = `
          <video controls preload="metadata" style="width:100%;height:180px;object-fit:cover;border-radius:12px;" class="preview-video">
            <source src="${url}#t=0.1" type="video/mp4">
          </video>
          <button class="delete-btn" data-id="${publicId}">X</button>
        `;
      }
      galleryGrid.appendChild(item);

      // === VISTA PREVIA ===
      const mediaEl = item.querySelector(type === 'image' ? '.preview-img' : '.preview-video');
      mediaEl.addEventListener('click', () => {
        currentMediaUrl = url;
        previewModal.style.display = 'block';
        previewMedia.innerHTML = type === 'image'
          ? `<img src="${url}" style="max-width:100%;max-height:70vh;border-radius:12px;">`
          : `<video controls style="max-width:100%;max-height:70vh;border-radius:12px;"><source src="${url}" type="video/mp4"></video>`;
      });
    });

    // === ELIMINAR (solo con contraseña) ===
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
          alert('No tienes permiso para eliminar.');
          return;
        }
        const publicId = btn.getAttribute('data-id');
        if (confirm('¿Eliminar este recuerdo?')) {
          await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type}/destroy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_id: publicId,
              upload_preset: CLOUDINARY_UPLOAD_PRESET,
              api_key: 'YOUR_API_KEY' // Opcional si usas firma
            })
          });
          loadGallery();
        }
      });
    });
  } catch (err) {
    galleryGrid.innerHTML = '<p style="text-align:center;color:red;">Error al cargar. Intenta más tarde.</p>';
  }
}

// === ABRIR SUBIDA ===
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

// === CONTRASEÑA ===
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

// === CERRAR MODALES ===
document.querySelectorAll('.close, .close-preview').forEach(btn => {
  btn.addEventListener('click', () => {
    galleryModal.style.display = 'none';
    passwordModal.style.display = 'none';
    previewModal.style.display = 'none';
    qrContainer.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// === DESCARGAR MEDIA ===
downloadMedia.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = currentMediaUrl;
  link.download = '';
  link.click();
});

// === SUBIR ARCHIVOS ===
submitUpload.addEventListener('click', async () => {
  const files = mediaFile.files;
  if (files.length === 0) return alert('Selecciona al menos una foto o video');

  submitUpload.disabled = true;
  submitUpload.textContent = 'Subiendo...';

  const uploadPromises = Array.from(files).map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', CLOUDINARY_FOLDER);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.secure_url ? true : false;
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
});

// === GENERAR QR ===
generateQr.addEventListener('click', () => {
  if (qrGenerated) return;
  qrContainer.style.display = 'block';
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: 'https://lozanoroa.github.io/boda-jonatan-michel/',
    width: 240,
    height: 240,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
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
