$(document).ready(function () {
const toggleButton = document.getElementById('toggleDarkMode');
  const darkThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('cDarkMode');
    } else {
      document.body.classList.remove('cDarkMode');
    }
  }

  // 1. Load saved preference or use system default
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(darkThemeMedia.matches ? 'dark' : 'light');
  }

  // 2. Toggle manually and save preference
  toggleButton.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('cDarkMode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // 3. Listen for system changes only if user hasn't saved a preference
  if (!savedTheme) {
    darkThemeMedia.addEventListener('change', (e) => {
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }
});

$(document).ready(function () {
  $('.cColourMode').on('click', function () {
    $('body').toggleClass('cDarkMode');
    $('.cColourMode').toggleClass('cDarkModeOn');
  });
});