(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  function onScroll() {
    header.classList.toggle('is-solid', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!header.classList.contains('menu-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* reveal on scroll */
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* active nav link */
  var links = [].slice.call(document.querySelectorAll('.nav a[href^="#"]:not(.btn)'));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (en.target.id === 'top' && en.isIntersecting) links.forEach(function (l) { l.classList.remove('on'); });
        if (a && en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('on'); });
          a.classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    if (document.getElementById('top')) so.observe(document.getElementById('top'));
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) so.observe(s);
    });
  }

  /* lightbox */
  var thumbs = [].slice.call(document.querySelectorAll('.gallery button'));
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('.lb-cap');
  var lbCount = lb.querySelector('.lb-count');
  var cur = 0;
  var lastFocus = null;

  function show(i) {
    cur = (i + thumbs.length) % thumbs.length;
    var b = thumbs[cur];
    lbImg.src = b.getAttribute('data-full');
    lbImg.alt = b.getAttribute('data-alt') || '';
    lbCap.textContent = b.getAttribute('data-alt') || '';
    lbCount.textContent = (cur + 1) + ' / ' + thumbs.length;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbImg.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }
  thumbs.forEach(function (b, i) {
    b.addEventListener('click', function () { openLb(i); });
  });
  lb.querySelector('.lb-close').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.tagName === 'FIGURE') closeLb();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'Tab') {
      var f = [].slice.call(lb.querySelectorAll('button'));
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    tx = null;
  });

  /* contact form: validation and pre-filled mailto */
  var TO = 'dworekemilii@onet.eu';
  var form = document.getElementById('inquiry');
  if (!form) return;
  var msg = form.querySelector('.form-msg');
  form.querySelectorAll('.field').forEach(function(field, index) { var input=field.querySelector('input,select,textarea'), err=field.querySelector('.err'); if(input && err){ err.id='field-error-'+index; input.setAttribute('aria-describedby',err.id); } });

  function val(name) { return (form.elements[name].value || '').trim(); }
  function setErr(name, text) {
    var f = form.elements[name].closest('.field');
    f.classList.toggle('invalid', !!text);
    if (text) f.querySelector('.err').textContent = text;
    form.elements[name].setAttribute('aria-invalid', text ? 'true' : 'false');
  }
  function fmtDate(v) {
    if (!v) return '';
    var p = v.split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : v;
  }
  function validate() {
    var ok = true, first = null;
    var email = val('email');
    var checks = [
      ['name', val('name').length < 2 ? 'Podaj imię i nazwisko.' : ''],
      ['email', !email ? 'Podaj adres e-mail, na który mamy odpisać.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Ten adres e-mail wygląda na niepełny.')],
      ['kind', val('kind') ? '' : 'Wybierz, czego dotyczy zapytanie.'],
      ['phone', /^[+()\d\s-]{6,25}$/.test(val('phone')) ? '' : 'Podaj numer telefonu.'],
      ['from', val('from') ? '' : 'Wybierz datę przyjazdu lub przyjęcia.'],
      ['guests', Number.isInteger(Number(val('guests'))) && Number(val('guests')) > 0 ? '' : 'Podaj liczbę osób, co najmniej 1.']
    ];
    checks.forEach(function (c) {
      setErr(c[0], c[1]);
      if (c[1]) { ok = false; if (!first) first = c[0]; }
    });
    var from = val('from'), to = val('to');
    if (from && to && to < from) {
      setErr('to', 'Data wyjazdu nie może być wcześniejsza niż przyjazdu.');
      ok = false; if (!first) first = 'to';
    } else { setErr('to', ''); }
    return { ok: ok, first: first };
  }
  function buildMailto() {
    var lines = [
      'Dzień dobry,',
      '',
      'chciałbym zapytać o wolny termin.',
      '',
      'Rodzaj zapytania: ' + val('kind')
    ];
    if (val('from')) lines.push('Przyjazd: ' + fmtDate(val('from')));
    if (val('to')) lines.push('Wyjazd: ' + fmtDate(val('to')));
    if (val('guests')) lines.push('Liczba osób: ' + val('guests'));
    if (val('phone')) lines.push('Telefon: ' + val('phone'));
    if (val('message')) { lines.push(''); lines.push(val('message')); }
    lines.push('');
    lines.push('Pozdrawiam');
    lines.push(val('name'));
    lines.push(val('email'));
    var subject = 'Zapytanie o wolny termin: ' + val('kind');
    return 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\r\n'));
  }
  window.__dworek = { buildMailto: buildMailto, validate: validate };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = validate();
    msg.classList.remove('ok');
    if (!r.ok) {
      msg.textContent = 'Formularz nie jest jeszcze kompletny. Popraw zaznaczone pola.';
      msg.classList.add('show');
      form.elements[r.first].focus();
      return;
    }
    msg.textContent = 'Otwieramy Twój program pocztowy z gotową wiadomością. Wystarczy ją wysłać.';
    msg.classList.add('ok', 'show');
    window.location.href = buildMailto();
  });
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field');
    if (f && f.classList.contains('invalid')) validate();
  });
})();
