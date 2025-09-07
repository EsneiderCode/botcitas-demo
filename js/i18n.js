// i18n.js
// Gestiona la selección de idioma y formatea fechas según la zona horaria Europe/Berlin.
(function(){
  /**
   * Establece el idioma y guarda en localStorage
   * @param {string} lang
   */
  const setLang = (lang) => {
    localStorage.setItem('bot_lang', lang);
    document.documentElement.lang = lang;
  };
  /**
   * Obtiene el idioma actual desde localStorage o predetermina a español
   * @returns {string}
   */
  const getLang = () => localStorage.getItem('bot_lang') || 'es';
  // Ajusta el atributo lang al cargar la página
  document.documentElement.lang = getLang();

  // Event listener global para botones que cambian de idioma (data-setlang)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-setlang]');
    if (!el) return;
    setLang(el.dataset.setlang);
    // Recarga para aplicar el idioma en toda la app
    location.reload();
  });

  /**
   * Devuelve el idioma actual
   */
  function currentLang() {
    return getLang();
  }

  /**
   * Formatea un timestamp ISO en la zona horaria Europe/Berlin para el idioma actual
   * @param {string} iso
   * @returns {string}
   */
  function tDate(iso) {
    try {
      const d = new Date(iso);
      const options = {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin'
      };
      const formatter = new Intl.DateTimeFormat(currentLang() === 'de' ? 'de-DE' : 'es-ES', options);
      return formatter.format(d);
    } catch {
      return iso;
    }
  }

  // Exponer helpers globalmente
  window.i18n = {
    lang: currentLang,
    tDate: tDate
  };
})();