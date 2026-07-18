

const siteHeader = document.getElementById('siteHeader');
const menuToggle = siteHeader ? siteHeader.querySelector('.menu-toggle') : null;
const siteNavPanel = siteHeader ? siteHeader.querySelector('.site-nav-panel') : null;

if (siteHeader && menuToggle && siteNavPanel) {
  const setMenuOpen = (open) => {
    siteHeader.classList.toggle('is-menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  };

  siteHeader.addEventListener('click', (event) => {
    if (!event.target.closest('.menu-toggle')) return;
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(!siteHeader.classList.contains('is-menu-open'));
  });

  siteNavPanel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!siteHeader.classList.contains('is-menu-open')) return;
    if (siteHeader.contains(event.target)) return;
    setMenuOpen(false);
  });
}

const filterRoot = document.querySelector('.program-date-filter');
const typeFilterRoot = document.querySelector('.program-type-filter');
const locationBlocks = document.querySelectorAll('.location-block');
const dateOrder = ['7/30', '7/31', '8/1', '8/2', '8/3', '8/4'];

const normalizeDateText = (text) => text
  .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
  .replace(/／/g, '/')
  .replace(/[〜～]/g, '~')
  .replace(/\s+/g, ' ');

const collectDates = (text) => {
  const normalized = normalizeDateText(text);
  const dates = new Set();
  const rangePattern = /(7|8)\/(\d{1,2})\([^)]*\)\s*~\s*(?:(7|8)\/)?(\d{1,2})/g;
  let match;

  while ((match = rangePattern.exec(normalized))) {
    const start = `${match[1]}/${Number(match[2])}`;
    const endMonth = match[3] || match[1];
    const end = `${endMonth}/${Number(match[4])}`;
    const startIndex = dateOrder.indexOf(start);
    const endIndex = dateOrder.indexOf(end);

    if (startIndex >= 0 && endIndex >= startIndex) {
      dateOrder.slice(startIndex, endIndex + 1).forEach((date) => dates.add(date));
    }
  }

  const singlePattern = /(7|8)\/(\d{1,2})/g;
  while ((match = singlePattern.exec(normalized))) {
    const date = `${match[1]}/${Number(match[2])}`;
    if (dateOrder.includes(date)) dates.add(date);
  }

  return dates;
};

if (filterRoot && locationBlocks.length) {
  let selectedDate = 'all';
  let selectedType = 'all';

  const setActiveButton = (root, dataName, value) => {
    if (!root) return;

    root.querySelectorAll('button').forEach((button) => {
      const isActive = button.dataset[dataName] === value;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  locationBlocks.forEach((block) => {
    block.querySelectorAll('.location-event').forEach((event) => {
      const dateText = [...event.querySelectorAll('.location-date')]
        .map((date) => date.textContent)
        .join(' ');
      const typeLabel = event.querySelector('.program-type.type-festival, .program-type.type-open-campus');

      event.dataset.dates = [...collectDates(dateText)].join(' ');
      event.dataset.programType = typeLabel && typeLabel.classList.contains('type-festival')
        ? 'festival'
        : 'open-campus';
    });
  });

  const applyFilter = () => {
    setActiveButton(filterRoot, 'programDate', selectedDate);
    setActiveButton(typeFilterRoot, 'programType', selectedType);

    locationBlocks.forEach((block) => {
      let hasVisibleEvent = false;

      block.querySelectorAll('.location-event').forEach((event) => {
        const matchesDate = selectedDate === 'all' || event.dataset.dates.split(' ').includes(selectedDate);
        const matchesType = selectedType === 'all' || event.dataset.programType === selectedType;
        const shouldShow = matchesDate && matchesType;

        event.hidden = !shouldShow;
        if (shouldShow) hasVisibleEvent = true;
      });

      block.hidden = !hasVisibleEvent;
    });
  };

  filterRoot.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-program-date]');
    if (!button) return;
    selectedDate = button.dataset.programDate;
    applyFilter();
  });

  if (typeFilterRoot) {
    typeFilterRoot.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-program-type]');
      if (!button) return;
      selectedType = button.dataset.programType;
      applyFilter();
    });
  }
}


const programBackLink = document.querySelector('.program-main-link');

if (programBackLink) {
  programBackLink.addEventListener('click', (event) => {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const fromMainPage = referrer
      && referrer.origin === window.location.origin
      && /(?:\/index\.html|\/)$/.test(referrer.pathname);

    if (fromMainPage && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
      return;
    }

    const storedScrollY = sessionStorage.getItem('natsuyoiMainScrollY');
    if (storedScrollY) {
      event.preventDefault();
      window.location.href = 'index.html';
    }
  });
}
