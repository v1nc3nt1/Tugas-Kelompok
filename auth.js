// SkyFly - sesi login sederhana (demo, tanpa backend).
// Dipakai bersama oleh halaman login, profil, dan beranda.
const Auth = (() => {
  const KEY = "skyfly_user";
  const LOGIN_PAGE = "LoginPageSkyfly.html";

  const read = store => { try { return JSON.parse(store.getItem(KEY) || "null"); } catch { return null; } };

  return {
    get: () => read(sessionStorage) || read(localStorage),
    login(username, remember) {
      const data = JSON.stringify({ username });
      sessionStorage.setItem(KEY, data);
      if (remember) localStorage.setItem(KEY, data);
      else localStorage.removeItem(KEY);
    },
    logout() {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
    },
    // Panggil di halaman yang wajib login
    require() {
      if (!this.get()) location.replace(LOGIN_PAGE);
    },
  };
})();
