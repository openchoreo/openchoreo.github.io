$(document).ready(function () {

  // Copy icon SVG
  const copyIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>
  `;

  const checkIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  `;

  // Add copy buttons to code blocks (exclude inline code)
  function addCopyButtons() {
    $('.highlighter-rouge').each(function() {
      const $container = $(this);
      const $codeBlock = $container.find('.highlight');
      
      // Only add copy button to fenced code blocks (with .highlight), not inline code
      // Skip text blocks and other non-copyable content
      if ($codeBlock.length > 0 && $container.find('.copy-btn').length === 0 && !$container.hasClass('language-text')) {
        const $copyBtn = $(`<button class="copy-btn" title="Copy code">${copyIconSVG}</button>`);
        $container.append($copyBtn);
        
        $copyBtn.on('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const codeText = $codeBlock.find('code').text().trim();
          
          // Use modern clipboard API if available
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(codeText).then(() => {
              showCopySuccess($copyBtn);
            }).catch(() => {
              fallbackCopyToClipboard(codeText, $copyBtn);
            });
          } else {
            fallbackCopyToClipboard(codeText, $copyBtn);
          }
        });
      }
    });
  }

  function fallbackCopyToClipboard(text, $btn) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showCopySuccess($btn);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    
    textArea.remove();
  }

  function showCopySuccess($btn) {
    $btn.addClass('copied').html(checkIconSVG);
    setTimeout(() => {
      $btn.removeClass('copied').html(copyIconSVG);
    }, 1000);
  }

  // Initialize copy buttons
  addCopyButtons();
  
  // Re-add copy buttons if content is dynamically loaded
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        setTimeout(addCopyButtons, 100);
      }
    });
  });
  
  // Observe changes to the document body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
