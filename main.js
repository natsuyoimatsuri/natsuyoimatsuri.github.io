/* ===================================================================
   ヘッダー：ヒーロー（Top）では非表示、スクロールしたらフェードイン
=================================================================== */

const siteHeader = document.getElementById('siteHeader');
const topSection = document.getElementById('Top');

if (siteHeader && topSection) {
  const setHeaderVisible = (visible) => {
    const wasVisible = siteHeader.classList.contains('is-visible');

    if (visible && !wasVisible) {
      siteHeader.classList.add('is-visible');
      siteHeader.classList.remove('is-appearing');
      void siteHeader.offsetWidth;
      siteHeader.classList.add('is-appearing');
      return;
    }

    if (!visible && wasVisible) {
      siteHeader.classList.remove('is-visible', 'is-appearing');
    }
  };

  if ('IntersectionObserver' in window) {
    const headerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Topセクションがほぼ画面外に出たらヘッダーを表示する
          setHeaderVisible(!entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: '-90% 0px 0px 0px',
      }
    );

    headerObserver.observe(topSection);
  } else {
    // 未対応ブラウザ向けフォールバック：常時表示
    setHeaderVisible(true);
  }
}


/* ===================================================================
   ヘッダー文字色の反転：背後が白系セクション(Timetable/Access/Credit)のとき
   ヘッダーの文字を赤に切り替える。それ以外（赤系セクション）は白のまま。
   ヘッダー直下の実際のピクセルに何が描画されているかを直接調べる方式。
=================================================================== */

if (siteHeader) {
  const lightSectionIds = ['Timetable', 'Access', 'Credit'];

  const getSectionIdAtHeaderLine = () => {
    const headerRect = siteHeader.getBoundingClientRect();
    const probeX = window.innerWidth / 2;
    const probeY = headerRect.top + headerRect.height * 0.7;

    // ヘッダー自身やその子要素が拾われないよう、判定中だけクリックを無効化
    const prevPointerEvents = siteHeader.style.pointerEvents;
    siteHeader.style.pointerEvents = 'none';
    const el = document.elementFromPoint(probeX, probeY);
    siteHeader.style.pointerEvents = prevPointerEvents;

    if (!el) return null;

    const section = el.closest('section, footer');
    return section ? section.id || section.tagName.toLowerCase() : null;
  };

  let ticking = false;

  const updateHeaderContrast = () => {
    ticking = false;
    const id = getSectionIdAtHeaderLine();
    const isOnLight = lightSectionIds.includes(id);
    siteHeader.classList.toggle('is-on-light', isOnLight);
  };

  const requestHeaderContrastUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHeaderContrast);
  };

  window.addEventListener('scroll', requestHeaderContrastUpdate, { passive: true });
  window.addEventListener('resize', requestHeaderContrastUpdate);

  // 初期表示時点の判定
  requestHeaderContrastUpdate();
}


/* ===================================================================
   ロゴ回転：常時ゆっくり回転 + Overview突入時に一拍だけ加速する
=================================================================== */

const logoSpin = document.getElementById('logoSpin');

if (logoSpin) {
  let burstFired = false;

  const getCurrentAngleDeg = () => {
    const style = getComputedStyle(logoSpin);
    const matrix = style.transform;

    if (!matrix || matrix === 'none') return 0;

    // matrix(a, b, c, d, tx, ty) から回転角(ラジアン)を算出
    const values = matrix.match(/matrix\(([^)]+)\)/);
    if (!values) return 0;

    const [a, b] = values[1].split(',').map(Number);
    const angleRad = Math.atan2(b, a);
    return (angleRad * 180) / Math.PI;
  };

  const triggerBurst = () => {
    if (burstFired) return;
    burstFired = true;

    // 現在の見た目の角度を確定させ、CSS変数に固定してからバーストへ切り替える
    const currentAngle = getCurrentAngleDeg();
    logoSpin.style.setProperty('--spin-angle', `${currentAngle}deg`);

    // 強制リフローでスタイル確定後にバーストクラスを付与
    void logoSpin.offsetWidth;
    logoSpin.classList.add('is-pulsing');

    logoSpin.addEventListener(
      'animationend',
      () => {
        // バースト終了角度を引き継いで、定速回転を再開する
        const endAngle = currentAngle + 130;
        logoSpin.style.setProperty('--spin-angle', `${endAngle}deg`);
        logoSpin.classList.remove('is-pulsing');
      },
      { once: true }
    );
  };

  const overviewSection = document.getElementById('Overview');

  if (overviewSection && 'IntersectionObserver' in window) {
    const burstObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerBurst();
            burstObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    burstObserver.observe(overviewSection);
  }
}


/* ===================================================================
   スクロールで説明文を段階的にフェードイン
=================================================================== */

const fadeTargets = document.querySelectorAll('.fade-in');

if (fadeTargets.length) {
  // data-fade-delay があればそれを優先、なければセクション内の出現順で自動算出
  const groups = new Map();

  fadeTargets.forEach((el) => {
    if (el.hasAttribute('data-fade-delay')) {
      const step = Number(el.getAttribute('data-fade-delay'));
      el.style.transitionDelay = `${step * 0.15}s`;
      return;
    }

    const parent = el.closest('section') || el.parentElement;
    if (!groups.has(parent)) {
      groups.set(parent, []);
    }
    groups.get(parent).push(el);
  });

  groups.forEach((els) => {
    els.forEach((el, index) => {
      el.style.transitionDelay = `${index * 0.12}s`;
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    fadeTargets.forEach((el) => observer.observe(el));
  } else {
    // IntersectionObserver未対応ブラウザ向けフォールバック
    fadeTargets.forEach((el) => el.classList.add('is-visible'));
  }
}
