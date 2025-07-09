$(document).ready(function () {
  const toggleButton = document.getElementById('toggleDarkMode');
  const darkThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('cDarkMode');
      $('.cColourMode').addClass('cDarkModeOn');
    } else {
      document.body.classList.remove('cDarkMode');
      $('.cColourMode').removeClass('cDarkModeOn');
    }
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(darkThemeMedia.matches ? 'dark' : 'light');
  }

  // Toggle via button with ID
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('cDarkMode');
      $('.cColourMode').toggleClass('cDarkModeOn', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // Toggle via .cColourMode click
  $('.cColourMode').on('click', function () {
    const isDark = $('body').toggleClass('cDarkMode').hasClass('cDarkMode');
    $(this).toggleClass('cDarkModeOn', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // System theme listener
  if (!savedTheme) {
    darkThemeMedia.addEventListener('change', (e) => {
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }
});
