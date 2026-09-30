/* Card Night site: the demo video. Store links are written into the page at build time (store-links.json), so no script
   is needed for them. The video autoplays muted and loops. If the browser blocks autoplay, or the visitor prefers reduced
   motion, it waits on its poster with a big play button. A pause button is always there. No tracking. DigiRune Studios. */
(function () {
  var v = document.getElementById('demo');
  if (!v) return;
  var btn = v.parentNode.querySelector('.demo-toggle');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  v.removeAttribute('controls'); // the page's own play and pause button takes over once the script runs
  v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.playsInline = true;
  btn.hidden = false;
  var sync = function () {
    var paused = v.paused;
    btn.setAttribute('aria-label', paused ? 'Play the demo' : 'Pause the demo');
    btn.classList.toggle('big', paused);
  };
  var play = function () { var p = v.play(); if (p && p.catch) p.catch(sync); };
  btn.addEventListener('click', function () { if (v.paused) play(); else v.pause(); });
  v.addEventListener('click', function () { if (v.paused) play(); else v.pause(); });
  v.addEventListener('play', sync); v.addEventListener('pause', sync);
  if (reduce) { v.removeAttribute('autoplay'); v.pause(); sync(); return; }
  play();
  sync();
  setTimeout(sync, 1200); // some browsers refuse autoplay silently: fall back to tap to play
})();
