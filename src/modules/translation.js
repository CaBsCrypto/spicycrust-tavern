export let translations = {};

export async function initTranslations() {
  const toggleBtn = document.getElementById('lang-toggle-btn');
  if (!toggleBtn) return;

  // Idioma inicial
  let currentLang = localStorage.getItem('lang') || 'es';

  async function loadTranslations(lang) {
    if (!translations[lang]) {
      try {
        const response = await fetch(`/locales/${lang}.json`);
        translations[lang] = await response.json();
      } catch (err) {
        console.error(`Error loading translations for ${lang}`, err);
        translations[lang] = {};
      }
    }
    return translations[lang];
  }

  async function applyTranslations(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    const dict = await loadTranslations(lang);

    // Actualizar botón de idioma
    if (dict.langBtn) {
      toggleBtn.textContent = dict.langBtn;
    }

    // Traducir todos los elementos con data-t
    document.querySelectorAll('[data-t]').forEach(el => {
      const key = el.getAttribute('data-t');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Actualizar form placeholders
    const nameInput = document.getElementById('record-name');
    if (nameInput) {
      nameInput.placeholder = lang === 'es' ? 'TAG' : 'TAG';
    }
    const scoreInput = document.getElementById('record-score');
    if (scoreInput) {
      scoreInput.placeholder = lang === 'es' ? 'VALOR' : 'SCORE';
    }

    // Asegurar que si la wallet está conectada, el texto del botón se mantenga como la wallet
    if (window.AuthSystemUpdateUI) {
      window.AuthSystemUpdateUI();
    }

    // Notificar a componentes dinámicos (Live Arcade Stats y cajas 3D)
    window.dispatchEvent(new CustomEvent('spicycrust:lang-changed', { detail: { lang } }));
  }

  // Escuchar click de alternar
  toggleBtn.addEventListener('click', async () => {
    const nextLang = currentLang === 'es' ? 'en' : 'es';
    await applyTranslations(nextLang);
  });

  // Aplicar idioma cargado
  await applyTranslations(currentLang);
}
