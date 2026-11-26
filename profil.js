// Profil SkyFly - dibungkus IIFE supaya tidak mengganggu variabel global di kode Anda
(function () {
  const STORAGE_KEY = "skyfly_profile";
  const form = document.getElementById("pfForm");
  if (!form) return; // aman jika script dimuat di halaman lain

  const toast = document.getElementById("pfToast");
  const barFill = document.getElementById("pfBarFill");
  const pct = document.getElementById("pfPct");
  const avatarImg = document.getElementById("pfAvatarImg");
  const avatarInitial = document.getElementById("pfAvatarInitial");

  const TRACKED = ["fullName", "gender", "birth", "nationality", "email", "phone", "city", "idNumber", "passport"];

  const rules = {
    fullName: v => (v.trim().length < 3 ? "Nama minimal 3 karakter." : ""),
    gender: v => (!v ? "Pilih jenis kelamin." : ""),
    birth: v => {
      if (!v) return "Tanggal lahir wajib diisi.";
      return new Date(v) > new Date() ? "Tanggal lahir tidak valid." : "";
    },
    nationality: v => (!v.trim() ? "Kewarganegaraan wajib diisi." : ""),
    email: v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Format email belum benar."),
    phone: v => (/^(\+62|62|0)8\d{8,11}$/.test(v.replace(/[\s-]/g, "")) ? "" : "Gunakan nomor Indonesia, contoh 08123456789."),
    idNumber: v => (v && !/^\d{16}$/.test(v) ? "Nomor KTP harus 16 digit angka." : ""),
    passport: v => (!v ? "Nomor paspor wajib diisi." : !/^[A-Za-z]\d{7}$/.test(v) ? "Format paspor: 1 huruf + 7 angka." : ""),
  };

  function showToast(msg, type = "ok") {
    toast.textContent = msg;
    toast.className = `pf-show pf-${type}`;
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => (toast.className = ""), 2800);
  }

  function validateField(input) {
    const rule = rules[input.name];
    if (!rule) return true;
    const msg = rule(input.value);
    const wrap = input.closest(".pf-field");
    wrap.classList.toggle("pf-invalid", !!msg);
    wrap.querySelector(".pf-error").textContent = msg;
    return !msg;
  }

  function updateSummary() {
    const name = form.fullName.value.trim();
    document.getElementById("pfDisplayName").textContent = name || "Nama Lengkap";
    document.getElementById("pfDisplayEmail").textContent = form.email.value.trim() || "email@contoh.com";
    if (avatarImg.hidden) avatarInitial.textContent = (name[0] || "R").toUpperCase();

    const filled = TRACKED.filter(n => form[n].value.trim()).length;
    const p = Math.round((filled / TRACKED.length) * 100);
    barFill.style.width = p + "%";
    pct.textContent = p + "%";
  }

  const removeBtn = document.getElementById("pfRemovePhoto");

  function setAvatar(src) {
    avatarImg.src = src;
    avatarImg.hidden = false;
    avatarInitial.hidden = true;
    removeBtn.hidden = false;
  }

  function clearAvatar() {
    avatarImg.removeAttribute("src");
    avatarImg.hidden = true;
    avatarInitial.hidden = false;
    removeBtn.hidden = true;
    updateSummary();
  }

  // Tombol "Ganti foto" membuka pemilih file; "Hapus foto" mengembalikan ke inisial
  document.getElementById("pfChangePhoto").addEventListener("click", () => document.getElementById("pfPhoto").click());
  removeBtn.addEventListener("click", () => {
    clearAvatar();
    showToast("Foto profil dihapus. Klik Simpan profil untuk menyimpan.");
  });

  // Upload foto: dipotong persegi & dikecilkan 256px
  document.getElementById("pfPhoto").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("File harus berupa gambar.", "bad");
    if (file.size > 3 * 1024 * 1024) return showToast("Ukuran foto maksimal 3 MB.", "bad");

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256, s = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        canvas.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        setAvatar(canvas.toDataURL("image/jpeg", 0.85));
        showToast("Foto diganti. Klik Simpan profil untuk menyimpan.");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // supaya file yang sama bisa dipilih lagi
  });

  form.addEventListener("focusout", e => { if (e.target.name) validateField(e.target); });
  form.addEventListener("input", e => {
    if (e.target.name === "idNumber") e.target.value = e.target.value.replace(/\D/g, "");
    if (e.target.name === "passport") e.target.value = e.target.value.toUpperCase();
    if (e.target.closest(".pf-invalid")) validateField(e.target);
    updateSummary();
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll("input[name], select[name]")];
    const invalid = inputs.filter(i => !validateField(i));
    if (invalid.length) {
      invalid[0].focus();
      return showToast("Periksa kembali isian yang bertanda merah.", "bad");
    }

    const data = {};
    inputs.forEach(i => (data[i.name] = i.type === "checkbox" ? i.checked : i.value.trim()));
    data.photo = avatarImg.hidden ? "" : avatarImg.src;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showToast("Profil berhasil disimpan.");
      // Datang dari halaman login? Lanjut otomatis ke beranda
      if (new URLSearchParams(location.search).has("welcome")) {
        setTimeout(() => (location.href = "index.html"), 1200);
      }
      // Jika sudah ada backend, kirim di sini:
      // fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } catch {
      showToast("Gagal menyimpan. Coba lagi.", "bad");
    }
  });

  document.getElementById("pfReset").addEventListener("click", () => {
    form.reset();
    clearAvatar();
    form.querySelectorAll(".pf-invalid").forEach(f => f.classList.remove("pf-invalid"));
    form.querySelectorAll(".pf-error").forEach(s => (s.textContent = ""));
    localStorage.removeItem(STORAGE_KEY);
    updateSummary();
    showToast("Formulir dikosongkan.");
  });

  // Isi ulang dari data tersimpan
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (data) {
      Object.entries(data).forEach(([k, v]) => {
        const el = form.elements[k];
        if (!el) return;
        el.type === "checkbox" ? (el.checked = v) : (el.value = v);
      });
      if (data.photo) setAvatar(data.photo);
    }
  } catch { /* abaikan data rusak */ }
  // Hormati pengaturan "kurangi animasi": video latar dihentikan
  const bgVideo = document.querySelector(".pf-head-video");
  if (bgVideo && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bgVideo.removeAttribute("autoplay");
    bgVideo.pause();
  }

  // Isi email dari akun yang login (jika belum ada data tersimpan)
  const session = window.Auth && Auth.get();
  if (session && !form.email.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.username)) {
    form.email.value = session.username;
  }

  const logoutBtn = document.getElementById("pfLogout");
  if (logoutBtn) logoutBtn.addEventListener("click", e => {
    e.preventDefault();
    Auth.logout();
    location.href = "index.html";
  });

  updateSummary();
})();
