// === TU CONFIGURACIÓN DE FIREBASE (REEMPLAZA) ===
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === Elementos ===
const openGalleryBtn = document.getElementById('openGalleryBtn');
const uploadBtn = document.getElementById('uploadBtn');
const galleryModal = document.getElementById('galleryModal');
const passwordModal = document.getElementById('passwordModal');
const closeBtns = document.querySelectorAll('.close');
const uploadForm = document.getElementById('uploadForm');
const galleryGrid = document.getElementById('galleryGrid');
const qrSection = document.getElementById('qrSection');
const generateQr = document.getElementById('generateQr');
const qrContainer = document.getElementById('qrContainer');
const downloadQr = document.getElementById('downloadQr');
const adminPassword = document.getElementById('adminPassword');
const enterAdmin = document.getElementById('enterAdmin');
const adminPanel = document.getElementById('adminPanel');
const downloadAllBtn = document.getElementById('downloadAllBtn');

let isAuthenticated = false;

// === SUBIDA PÚBLICA: Abrir modal con formulario (sin contraseña) ===
uploadBtn.addEventListener('click', () => {
  galleryModal.style.display = 'block';
  // Solo mostrar formulario de subida (público)
  uploadForm.style.display = 'block';
  galleryGrid.style.display = 'none';
  qrSection.style.display = 'none';
  adminPanel.style.display = 'none';
});

// === VER GALERÍA/QR: Requerir contraseña ===
function requireAuth() {
  if (!isAuthenticated) {
    passwordModal.style.display = 'block';
    return false;
  }
  return true;
}

openGalleryBtn.addEventListener('click', () => {
  if (requireAuth()) {
    galleryModal.style.display = 'block';
    uploadForm.style.display = 'block';
    galleryGrid.style.display = 'block';
    qrSection.style.display = 'block';
    adminPanel.style.display = 'block';
    loadGallery();
  }
});

// === Verificar contraseña ===
enterAdmin.addEventListener('click', () => {
  const pwd = adminPassword.value.trim();
  if (pwd === 'Jonatanymichel') {
    isAuthenticated = true;
    passwordModal.style.display = 'none';
    galleryModal.style.display = 'block';
    uploadForm.style.display = 'block';
    galleryGrid.style.display = 'block';
    qrSection.style.display = 'block';
    adminPanel.style.display = 'block';
    loadGallery();
    adminPassword.value = '';
  } else {
    alert('Contraseña incorrecta');
    adminPassword.value = '';
    adminPassword.focus();
  }
});

// === Cerrar modales ===
closeBtns.forEach(btn => btn.addEventListener('click', () => {
  galleryModal.style.display = 'none';
  passwordModal.style.display = 'none';
  qrContainer.style.display = 'none';
}));

window.addEventListener('click', (e) => {
  if (e.target === galleryModal) {
    galleryModal.style.display = 'none';
    qrContainer.style.display = 'none';
  }
  if (e.target === passwordModal) passwordModal.style.display = 'none';
});

// === Generar QR (solo con contraseña) ===
generateQr.addEventListener('click', async () => {
  qrContainer.style.display = 'block';
  const canvas = document.getElementById('qrcode');
  const url = 'https://lozanoroa.github.io/boda-jonatan-michel/';
  try {
    const { default: QRCode } = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js');
    QRCode.toCanvas(canvas, url, { width: 240, margin: 2, color: { dark: '#9f5b4c' } });
  } catch (err) {
    canvas.innerHTML = '<p style="color:red;">Error QR</p>';
  }
});

downloadQr.addEventListener('click', () => {
  const canvas = document.getElementById('qrcode');
  const link = document.createElement('a');
  link.download = 'QR-Boda-Jonatan-Michel.png';
  link.href = canvas.toDataURL();
  link.click();
});

// === SUBIR ARCHIVO (PÚBLICO) ===
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const files = document.getElementById('mediaFile').files;
  const message = document.getElementById('messageInput').value.trim();

  if (files.length === 0) {
    alert('Selecciona al menos un archivo');
    return;
  }

  const promises = Array.from(files).map(async (file) => {
    const fileRef = ref(storage, `recuerdos/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await addDoc(collection(db, 'recuerdos'), { url, message, type: file.type.startsWith('image') ? 'image' : 'video', timestamp: new Date() });
  });

  try {
    await Promise.all(promises);
    alert('¡Subido con éxito!');
    uploadForm.reset();
    // Si está autenticado, recarga galería
    if (isAuthenticated) loadGallery();
  } catch (err) {
    alert('Error al subir');
    console.error(err);
  }
});

// === CARGAR GALERÍA (solo con contraseña) ===
async function loadGallery() {
  galleryGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Cargando...</p>';
  try {
    const snapshot = await getDocs(collection(db, 'recuerdos'));
    galleryGrid.innerHTML = '';
    if (snapshot.empty) {
      galleryGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;font-style:italic;">Sin recuerdos aún</p>';
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const item = document.createElement('div');
      item.className = 'gallery-item';
      if (data.type === 'image') {
        item.innerHTML = `<img src="${data.url}" alt="Recuerdo" loading="lazy"><p>${data.message || ''}</p>`;
      } else {
        item.innerHTML = `<video controls preload="metadata"><source src="${data.url}#t=0.1" type="${data.type}">No soporta video</video><p>${data.message || ''}</p>`;
      }
      if (isAuthenticated) {
        const del = document.createElement('button');
        del.textContent = 'Eliminar';
        del.onclick = async () => {
          if (confirm('¿Eliminar?')) {
            await deleteDoc(doc(db, 'recuerdos', docSnap.id));
            const fileRef = ref(storage, data.url);
            await deleteObject(fileRef).catch(() => {});
            loadGallery();
          }
        };
        item.appendChild(del);
      }
      galleryGrid.appendChild(item);
    });
  } catch (err) {
    galleryGrid.innerHTML = '<p style="color:red;">Error al cargar</p>';
    console.error(err);
  }
}

// === DESCARGAR TODO (solo admin) ===
downloadAllBtn.addEventListener('click', async () => {
  if (!confirm('¿Abrir todos los archivos?')) return;
  const snapshot = await getDocs(collection(db, 'recuerdos'));
  snapshot.forEach(doc => window.open(doc.data().url, '_blank'));
});
