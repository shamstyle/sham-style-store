
/* Sham Style - Direct Product Links */
(() => {
  'use strict';

  const PARAM = 'product';

  function makeLink(id) {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set(PARAM, id);
    return url.href;
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();

    if (!ok) throw new Error('Copy failed');
    return Promise.resolve();
  }

  function addButtons() {
    document.querySelectorAll('#adminProducts .admin-product')
      .forEach(card => {
        const actions = card.querySelector('.admin-actions');
        const edit = card.querySelector('.edit-product');

        if (!actions || !edit || actions.querySelector('.copy-product-link')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-product-link';
        button.textContent = 'نسخ رابط المنتج';
        button.style.cssText =
          'background:#f7dce7;color:#7b3654;border:1px solid #edbfd1;' +
          'border-radius:8px;padding:8px;cursor:pointer;font:inherit;';

        button.onclick = async () => {
          try {
            await copy(makeLink(edit.dataset.id));
            const toast = document.getElementById('toast');
            if (toast) {
              toast.textContent = 'تم نسخ رابط المنتج 🩷';
              toast.style.display = 'block';
            } else {
              alert('تم نسخ رابط المنتج');
            }
          } catch (e) {
            alert('تعذر نسخ الرابط');
          }
        };

        actions.appendChild(button);
      });
  }

  function openProductFromLink() {
    const id = new URLSearchParams(location.search).get(PARAM);
    if (!id) return;

    let tries = 0;

    const timer = setInterval(() => {
      tries++;

      const button = document.querySelector(
        '#products [data-product-id="' + CSS.escape(id) + '"]'
      );

      if (button) {
        clearInterval(timer);
        button.click();
      }

      if (tries >= 100) clearInterval(timer);
    }, 250);
  }

  function start() {
    const observer = new MutationObserver(addButtons);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    addButtons();
    openProductFromLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
