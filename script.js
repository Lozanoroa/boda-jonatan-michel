// === CONFIGURACIÓN CLOUDINARY ===
const CLOUDINARY_CLOUD_NAME = 'dnhrk78ul';
const CLOUDINARY_UPLOAD_PRESET = 'boda2025';
const CLOUDINARY_FOLDER = 'boda-jonatan-michel';
const CLOUDINARY_LIST_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/list/${CLOUDINARY_FOLDER}.json`;

// === ELEMENTOS DEL DOM ===
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
    if (!res.ok) throw new Error('Error al cargar lista');

    const data = await res.json();
    const resources = data.resources || [];

    if (resources.length === 0) {
      galleryGrid.innerHTML = '<p style="text-align:center;font-style:italic;">Sin recuerdos aún</p>';
      return;
    }

    galleryGrid.innerHTML = '';
    resources.forEach((r) => {
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
          <img src="${url}" loading="lazy" class="preview-img" style="width:100%;border-radius:12px;">
          <button class="delete-btn" data-id="${publicId}">X</button>
        `;
      } else {
        item.innerHTML = `
          <video controls preload="metadata" class="preview-video" style="width:100%;height:180px;object-fit:cover;border-radius:12px;">
            <source src="${url}#t=0.1" type="video/mp4">
          </video>
          <button class="delete-btn" data-id="${publicId}">X</button>
        `;
      }
      galleryGrid.appendChild(item);

      // === ABRIR VISTA PREVIA AL HACER CLIC ===
      const mediaEl = item.querySelector(type === 'image' ? '.preview-img' : '.preview-video');
      mediaEl.addEventListener('click', () => {
        currentMediaUrl = url;
        previewModal.style.display = 'block';
        previewMedia.innerHTML = type === 'image'
          ? `<img src="${url}" style="max-width:100%;max-height:70vh;border-radius:12px;">`
          : `<video controls style="max-width:100%;max-height:70vh;border-radius:12px;"><source src="${url}" type="video/mp4"></video>`;
      });
    });

    // === ELIMINAR (SOLO CON CONTRASEÑA) ===
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
          alert('No tienes permiso para eliminar.');
          return;
        }
        const publicId = btn.getAttribute('data-id');
        const resourceType = publicId.includes('/video/') ? 'video' : 'image';

        if (confirm('¿Eliminar este recuerdo?')) {
          try {
            const destroyRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                public_id: publicId,
                upload_preset: CLOUDINARY_UPLOAD_PRESET
              })
            });
            const destroyData = await destroyRes.json();
            if (destroyData.result === 'ok') {
              loadGallery();
            } else {
              alert('Error al eliminar. Intenta de nuevo.');
            }
          } catch (err) {
            console.error('Error eliminando:', err);
            alert('Error al eliminar.');
          }
        }
      });
    });
  } catch (err) {
    console.error('Error cargando galería:', err);
    galleryGrid.innerHTML = '<p style="text-align:center;color:red;">Error al cargar. Revisa tu conexión.</p>';
  }
}

// === ABRIR MODAL DE SUBIDA ===
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

// === REQUERIR CONTRASEÑA ===
function requireAuth() {
  if (!isAuthenticated) {
    passwordModal.style.display = 'block';
    return false;
  }
  return true;
}

// === ABRIR VISTA RESTRINGIDA (GALERÍA + QR) ===
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
    adminPassword.value = '';
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

// === DESCARGAR MEDIA EN VISTA PREVIA ===
downloadMedia.addEventListener('click', () => {
  if (!currentMediaUrl) return;
  const link = document.createElement('a');
  link.href = currentMediaUrl;
  link.download = '';
  link.click();
});

// === SUBIR ARCHIVOS A CLOUDINARY ===
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
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      return false;
    }
  });

  const results = await Promise.all(uploadPromises);
  const success = results.filter(r => r).length;

  if (success > 0) {
    alert(`${success} recuerdo(s) subido(s) con éxito!`);
    mediaFile.value = '';
    messageInput.value = '';
    // Recargar galería si está abierta
    if (galleryGrid.style.display === 'block') loadGallery();
  } else {
    alert('Error al subir. Intenta con menos archivos.');
  }

  submitUpload.disabled = false;
  submitUpload.textContent = 'Subir Recuerdo';
});

// === GENERAR QR NEGRO ===
generateQr.addEventListener('click', () => {
  if (qrGenerated) return;
  qrContainer.style.display = 'block';
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';

  if (typeof QRCode === 'undefined') {
    alert('Error: Recarga la página.');
    return;
  }

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

// === DESCARGAR QR ===
downloadQr.addEventListener('click', () => {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) return alert('Primero genera el QR');
  const link = document.createElement('a');
  link.download = 'QR-Boda-Jonatan-Michel.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
