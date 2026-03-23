    const editor = document.getElementById('editor');
    const status = document.getElementById('status');

    function format(command) {
      document.execCommand(command, false, null);
    }

    function saveDoc() {
      localStorage.setItem('doc', editor.innerHTML);
      showStatus('Saved');
    }

    function showStatus(text) {
      status.textContent = text;
      status.classList.add('show');
      setTimeout(() => status.classList.remove('show'), 1500);
    }

    // Auto-save
    let timeout;
    editor.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.setItem('doc', editor.innerHTML);
        showStatus('Auto-saved');
      }, 1000);
    });

    // Load saved doc
    window.onload = () => {
      const saved = localStorage.getItem('doc');
      if (saved) editor.innerHTML = saved;
    };

    