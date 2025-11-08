// === CONFIGURACIÓN ===
const CLOUDINARY_NAME = 'dnhrk78ul';
const CLOUDINARY_PRESET = 'boda2025';
const JSON_URL = 'https://raw.githubusercontent.com/lozanoroa/boda-jonatan-michel/main/data/recuerdos.json';

// === NUEVA URL DE PIPEDREAM CON TOKEN (CREA ESTA EN PASO 1) ===
const PIPEDREAM_WEBHOOK = 'https://eo7qq78xmdl6iww.m.pipedream.net'; // ← CAMBIA ESTO

// === ELEMENTOS ===
const uploadBtn = document.getElementById('uploadBtn');
const openGalleryBtn = document.getElementById('openGalleryBtn');
const galleryModal = document.getElementById('galleryModal');
const uploadModal = document.getElementById('uploadModal');
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
const previewModal = document.getElementById('previewModal');
const previewMedia = document.getElementById('previewMedia');
const downloadMedia = document.getElementById('downloadMedia');

let isAuth = false;
let currentUrl = '';
let qrGenerated = false;
let currentItems = [];

// === CARGAR GALERÍA ===
async function loadGallery() {
  galleryGrid.innerHTML = '<p style="padding:20px;">Cargando...</p>';
  try {
    const res = await fetch(JSON_URL + '?t=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('No se pudo cargar');
    const data = await res.json();
    currentItems = Array.isArray(data) ? data : [];
    renderGallery();
  } catch (error) {
    console.error(error);
    galleryGrid.innerHTML = '<p style="color:red;">Error de conexión.</p>';
  }
}

function renderGallery() {
  galleryGrid.innerHTML = '';
  if (currentItems.length === 0) {
    galleryGrid.innerHTML = '<p style="font-style:italic;">Sin recuerdos aún</p>';
    return;
  }
  currentItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  currentItems.forEach((d, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      openPreview(d.url, d.type);
    };
    const mediaHTML = d.type === 'image'
      ? `<img src="${d.url}" loading="lazy">`
      : `<video controls><source src="${d.url}#t=0.1"></video>`;
    item.innerHTML = `
      ${mediaHTML}
      <div class="actions">
        <button onclick="downloadItem('${d.url}')">Download</button>
        <button onclick="deleteItem(${index})">Delete</button>
      </div>
      <p>${d.message || ''}</p>
    `;
    galleryGrid.appendChild(item);
  });
}

// === DESCARGAR / ELIMINAR ===
function downloadItem(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  a.click();
}

async function deleteItem(index) {
  if (!confirm('¿Eliminar este recuerdo?')) return;
  currentItems.splice(index, 1);
  await saveToGitHub(currentItems);
  renderGallery();
}

// === GUARDAR EN GITHUB (NUEVO) ===
async function saveToGitHub(data) {
  try {
    await fetch(PIPEDREAM_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2)
    });
  } catch (error) {
    console.error('Error al guardar:', error);
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

// === SUBIR (AHORA GUARDA TODO) ===
submitUpload.onclick = async () => {
  const files = mediaFile.files;
  const msg = messageInput.value.trim().slice(0, 50);
  if (!files.length) return alert('Selecciona al menos un archivo');

  submitUpload.disabled = true;
  submitUpload.textContent = 'Subiendo...';

  const uploadedItems = [];

  // 1. SUBIR A CLOUDINARY
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.secure_url) {
        uploadedItems.push({
          url: data.secure_url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          message: msg,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      alert(`Error: ${file.name}`);
    }
  }

  if (uploadedItems.length > 0) {
    // 2. OBTENER JSON ACTUAL
    let currentData = [];
    try {
      const res = await fetch(JSON_URL + '?t=' + Date.now(), { cache: 'no-cache' });
      if (res.ok) {
        const text = await res.text();
        currentData = JSON.parse(text);
        if (!Array.isArray(currentData)) currentData = [];
      }
    } catch {}

    // 3. COMBINAR Y GUARDAR
    const finalData = [...currentData, ...uploadedItems];
    await saveToGitHub(finalData);

    alert(`${uploadedItems.length} recuerdo(s) subido(s)!`);
    setTimeout(() => {
      loadGallery();
      uploadModal.style.display = 'none';
    }, 2000);
  }

  mediaFile.value = '';
  messageInput.value = '';
  submitUpload.disabled = false;
  submitUpload.textContent = 'Subir Recuerdo';
};

// === MODALES ===
uploadBtn.onclick = () => uploadModal.style.display = 'block';
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
  loadGallery();
}

// Cerrar modales
document.querySelectorAll('.close, .close-preview, .close-upload').forEach(btn => {
  btn.onclick = () => {
    galleryModal.style.display = 'none';
    passwordModal.style.display = 'none';
    uploadModal.style.display = 'none';
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

// QR
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
