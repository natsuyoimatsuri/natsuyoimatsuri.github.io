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
   ハンバーガーメニュー
=================================================================== */

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


/* ===================================================================
   モバイルナビ：タップ後の下線をスクロール開始時に解除
=================================================================== */

if (siteHeader) {
  const navLinks = siteHeader.querySelectorAll('nav a');
  const canHover = window.matchMedia('(hover: hover)').matches;

  if (navLinks.length && !canHover) {
    const clearTappedNav = () => {
      navLinks.forEach((link) => link.classList.remove('is-tapped'));

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.forEach((item) => item.classList.remove('is-tapped'));
        link.classList.add('is-tapped');
      });
    });

    window.addEventListener('scroll', clearTappedNav, { passive: true });
  }
}


/* ===================================================================
   ヘッダー文字色の反転：背後が白系セクション(Timetable/Access/Credit)のとき
   ヘッダーの文字を赤に切り替える。それ以外（赤系セクション）は白のまま。
   ヘッダー直下の実際のピクセルに何が描画されているかを直接調べる方式。
=================================================================== */

if (siteHeader) {
  const lightSectionIds = ['Timetable', 'VenueMap', 'Access', 'Credit'];

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
   プログラム詳細から戻る時のスクロール位置を補助
=================================================================== */

const programDetailLink = document.querySelector('.program-detail-link');

if (programDetailLink) {
  programDetailLink.addEventListener('click', () => {
    sessionStorage.setItem('natsuyoiMainScrollY', String(window.scrollY));
  });
}

window.addEventListener('pageshow', () => {
  const storedScrollY = sessionStorage.getItem('natsuyoiMainScrollY');
  if (!storedScrollY) return;

  sessionStorage.removeItem('natsuyoiMainScrollY');
  requestAnimationFrame(() => {
    window.scrollTo({ top: Number(storedScrollY), left: 0, behavior: 'auto' });
  });
});


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


/* ===================================================================
   タイムテーブル：クリック項目の詳細ポップアップ
=================================================================== */

const timetableHotspots = document.querySelector('.timetable-hotspots');
const timetableModal = document.getElementById('timetableModal');
const timetableModalPanel = timetableModal?.querySelector('.timetable-modal-panel');
const timetableModalKicker = document.getElementById('timetableModalKicker');
const timetableModalTitle = document.getElementById('timetableModalTitle');
const timetableModalMeta = document.getElementById('timetableModalMeta');
const timetableModalBody = document.getElementById('timetableModalBody');
const timetableModalPoster = document.getElementById('timetableModalPoster');

const timetableImageSize = { width: 539.14, height: 397.17 };
const foodShops = [
  { item: 'タコス、ケサディーヤ、ドリロコス', shop: 'グリルダイナー301' },
  { item: 'カオマンガイ', shop: '元気飯ーゲンキゴハンー' },
  { item: '米粉クレープ、かき氷、けずりいちご', shop: 'コバヤシクレープ' },
  { item: '射的', shop: '射劇場' },
  { item: '世田谷動物饅頭', shop: '世田谷観光物産' },
  { item: '玉川消防団第8分団によるポップアップ', shop: '玉川消防団第8分団' },
  { item: '似顔絵', shop: '似顔絵屋 ガオガオ' },
  { item: '世田谷マーマレード', shop: '用賀mura' },
  { item: 'タイのジュースとゲーム体験', shop: 'Faa Sai' },
  { item: 'ワンコイン揚げ物、ラムネほか', shop: 'Joy&Moni\'s' },
  { item: '天然アロマ商品', shop: '株式会社SeaAroma' },
  { item: 'キャンディとわたあめ', shop: 'TIK TOK HAND MADE CANDY' },
  { item: 'キンキンのラムネ', shop: 'TOGO CAFE' },
];

const timetablePrograms = [
  {
    id: 'art-talk-0801',
    label: '8月1日 トーク 美術大学の未来へ',
    rect: [40.23, 31.2, 102.05, 80.31],
    category: '教員起案',
    title: 'トーク「美術大学の未来へ」',
    date: '８/１(土)',
    time: '14:00 ~ 15:30',
    place: 'Oculus Hall（講堂）',
    poster: { src: 'poster5-display.jpg', alt: 'トーク「美術大学の未来へ」ポスター' },
    groups: [
      { heading: '内容', lines: ['美術大学の未来へ　萩原朔美', '「八王子と上野毛」萩原朔美', '「身体とデザイン そして新たな芸術哲学へ」萩原朔美、安藤礼二、石田尚志'] },
    ],
  },
  {
    id: 'art-lecture-0801',
    label: '8月1日 レクチャー ものと実験',
    rect: [40.23, 128.39, 102.05, 80.47],
    category: '教員起案',
    title: 'レクチャー「もの」と実験、多摩美術大学の批評と実践',
    date: '８/１(土)',
    time: '15:45 ~ 17:15',
    place: 'Oculus Hall（講堂）',
    poster: { src: 'poster4-display.jpg', alt: 'レクチャー「もの」と実験ポスター' },
    groups: [
      { heading: '内容', lines: ['「もの」と実験、多摩美術大学の批評と実践　安藤礼二'] },
      { heading: '登壇者', lines: ['松井茂、伊村靖子、鍵谷怜、安藤礼二'] },
    ],
  },
  {
    id: 'av-0801',
    label: '8月1日 オーディオビジュアルパフォーマンス',
    rect: [145.12, 58.97, 17, 302.46],
    category: '教員起案',
    title: 'オーディオビジュアルパフォーマンス',
    date: '８/１(土)',
    time: '14:30 ~ 18:00 / 19:30 ~ 20:00',
    place: '本部棟地下1階 Maglabo（メディアラボ）',
    poster: { src: 'poster3-display.jpg', alt: 'オーディオビジュアルパフォーマンスポスター' },
    groups: [
      { heading: '出演', lines: ['14:30~　池田敦哉 / 押川日依 / ミムラ / haku', '16:30~　中村勇吾 / 細金卓矢 / 勅使河原一雅', '19:30~　Ririko'] },
    ],
  },
  {
    id: 'workshop-0801',
    label: '8月1日 ワークショップ',
    rect: [164.96, 31.2, 17.01, 219.31],
    category: '学生起案',
    title: 'ワークショップ',
    date: '８/１(土) ~ ８/３(月)',
    time: '14:00 ~ 18:00',
    place: 'Mensa',
    groups: [{ heading: '内容', lines: ['うちわをデザインする / 内壁をデザインする / 空間をデザインする'] }],
  },
  {
    id: 'food-0801',
    label: '8月1日 屋台・キッチンカー',
    rect: [184.8, 31.2, 17.01, 330.38],
    category: '学生起案',
    title: '屋台・キッチンカー',
    date: '８/１(土) ~ ８/３(月)',
    time: '14:00 ~ 20:00',
    place: 'ガレリア・２号館前',
    groups: [
      { heading: '出店', lines: foodShops },
      { lines: ['※五十音順', '※各出店によって開催日時が異なりますのでご了承ください。'] },
    ],
  },
  {
    id: 'opening-0801',
    label: '8月1日 開会式',
    rect: [40.23, 253.34, 102.2, 24.93],
    category: '学生起案',
    title: '開会式',
    date: '８/１(土)',
    time: '18:00 ~ 18:30',
    place: '中庭特設ステージ',
    groups: [],
  },
  {
    id: 'bon-0801',
    label: '8月1日 盆踊り',
    rect: [40.23, 281.11, 102.2, 24.93],
    category: '学生起案',
    title: '盆踊り',
    date: '８/１(土)',
    time: '18:30 ~ 19:00',
    place: '中庭特設ステージ',
    poster: { src: 'poster6-display.jpg', alt: '盆踊りポスター' },
    groups: [{ heading: '内容', lines: ['HEY!WA!odori　近藤良平', '本家上野毛音頭　近藤良平　長崎綱雄'] }],
  },
  {
    id: 'stage-0801',
    label: '8月1日 ステージ企画',
    rect: [40.23, 308.88, 102.05, 80.4],
    category: '学生起案',
    title: 'ステージ企画〈学生〉',
    date: '８/１(土)',
    time: '19:00 ~ 20:30',
    place: '中庭特設ステージ',
    groups: [{ heading: '出演', lines: ['19:00~19:20　ダンスバトル　メイジング企画', '19:20~19:40　ヌーディーサマー夏の祝い　ヌーディーサマー', '19:40~20:00　爆弾犯ひばりver.夏宵祭　劇団魔法少女', '20:00~20:20　アコーディオンの女　スン・ダンス'] }],
  },
  {
    id: 'concert-0802',
    label: '8月2日 イントナルモーリ オーケストラコンサート',
    rect: [207.48, 31.2, 102.05, 53.02],
    category: '教員起案',
    title: 'コンサート「イントナルモーリ オーケストラコンサート」',
    date: '８/２(日)',
    time: '14:00 ~ 15:00',
    place: 'Oculus Hall（講堂）',
    poster: { src: 'poster2-display.jpg', alt: 'イントナルモーリ オーケストラコンサートポスター' },
    groups: [{ heading: '出演', lines: ['多摩美術大学 学生有志、足立智美（指揮）'] }],
  },
  {
    id: 'symposium-0802',
    label: '8月2日 シンポジウム イントナルモーリと未来派',
    rect: [207.48, 100.61, 102.05, 108.24],
    category: '教員起案',
    title: 'シンポジウム「イントナルモーリと未来派」',
    date: '８/２(日)',
    time: '15:15 ~ 17:15',
    place: 'Oculus Hall（講堂）',
    poster: { src: 'poster2-display.jpg', alt: 'イントナルモーリと未来派ポスター' },
    groups: [{ heading: '登壇者', lines: ['石田尚志、足立智美、横田さやか、伊東篤宏、中川克志'] }],
  },
  {
    id: 'stage-0802',
    label: '8月2日 ステージ企画',
    rect: [207.48, 253.34, 102.05, 52.7],
    category: '学生起案',
    title: 'ステージ企画〈学生〉',
    date: '８/２(日)',
    time: '18:00 ~ 19:00',
    place: '中庭特設ステージ',
    groups: [{ heading: '出演', lines: ['18:00~18:20　エレキギターとカホンによる弾き語り演奏　沙ラ', '18:20~18:40　なんやて！？〜運命のコンビ、勘違い中〜　阿娘喂', '18:40~19:00　アコーディオンの女　スン・ダンス'] }],
  },
  {
    id: 'bon-0802',
    label: '8月2日 盆踊り',
    rect: [207.48, 308.88, 102.05, 80.46],
    category: '学生起案',
    title: '盆踊り',
    date: '８/２(日)',
    time: '19:00 ~ 20:30',
    place: '中庭特設ステージ',
    poster: { src: 'poster6-display.jpg', alt: '盆踊りポスター' },
    groups: [{ heading: '内容', lines: ['19:00 ~ 19:30　HEY!WA!odori / 本家上野毛音頭', '19:30 ~ 20:30　上野毛ぽっちょん / 定番の東京音頭など'] }],
  },
  {
    id: 'av-0802',
    label: '8月2日 オーディオビジュアルパフォーマンス',
    rect: [312.36, 86.73, 17.01, 274.71],
    category: '教員起案',
    title: 'オーディオビジュアルパフォーマンス',
    date: '８/２(日)',
    time: '15:00 ~ 20:00',
    place: '本部棟地下1階 Maglabo（メディアラボ）',
    poster: { src: 'poster3-display.jpg', alt: 'オーディオビジュアルパフォーマンスポスター' },
    groups: [{ heading: '出演', lines: ['15:00~　electric catfish / ADi', '16:00~　中村勇吾 / 細金卓矢 / 勅使河原一雅', '17:30~　池田敦哉 / mine / 佐藤明日野 / 田中楓', '19:30~　Ririko'] }],
  },
  {
    id: 'workshop-0802',
    label: '8月2日 ワークショップ',
    rect: [332.2, 31.2, 17.01, 219.31],
    category: '学生起案',
    title: 'ワークショップ',
    date: '８/１(土) ~ ８/３(月)',
    time: '14:00 ~ 18:00',
    place: 'Mensa',
    groups: [{ heading: '内容', lines: ['うちわをデザインする / 内壁をデザインする / 空間をデザインする'] }],
  },
  {
    id: 'food-0802',
    label: '8月2日 屋台・キッチンカー',
    rect: [352.05, 31.2, 17.01, 330.38],
    category: '学生起案',
    title: '屋台・キッチンカー',
    date: '８/１(土) ~ ８/３(月)',
    time: '14:00 ~ 20:00',
    place: 'ガレリア・２号館前',
    groups: [{ heading: '出店', lines: foodShops }, { lines: ['※五十音順', '※各出店によって開催日時が異なりますのでご了承ください。'] }],
  },
  {
    id: 'obog-0803',
    label: '8月3日 帰って来た夜光虫達 OBOG交流会',
    rect: [374.73, 86.74, 102.05, 163.77],
    category: '教員起案',
    title: '「帰って来た夜光虫達〜OBOG交流会〜」',
    date: '８/３(月)',
    time: '15:00 ~ 18:00',
    place: '本部棟2階 209教室',
    poster: { src: 'poster1-display.jpg', alt: '帰って来た夜光虫達 OBOG交流会ポスター' },
    groups: [
      { heading: '担当', lines: ['石田尚志'] },
      { heading: 'ゲスト', lines: ['大河原　恵（俳優・映画監督・脚本家）', '嶺　豪一（俳優・映画監督）', '飯田　芳（俳優）', '白井晴幸（写真家）'] },
      { heading: '作品', lines: ['映画「みんな蒸してやる」2015年 / 41分 / カラー', '映画「故郷の詩」2012年 / 71分 / カラー', '写真：白井晴幸'] },
    ],
  },
  {
    id: 'av-0803',
    label: '8月3日 オーディオビジュアルパフォーマンス',
    rect: [479.61, 86.74, 17.01, 163.77],
    category: '教員起案',
    title: 'オーディオビジュアルパフォーマンス',
    date: '８/３(月)',
    time: '15:00 ~ 18:00',
    place: '本部棟地下1階 Maglabo（メディアラボ）',
    poster: { src: 'poster3-display.jpg', alt: 'オーディオビジュアルパフォーマンスポスター' },
    groups: [{ heading: '出演', lines: ['15:00~　池田敦哉 / ミムラ / 押川日依 / mine / 佐藤明日野', '17:30~　ADi'] }],
  },
  {
    id: 'workshop-0803',
    label: '8月3日 ワークショップ',
    rect: [499.45, 31.2, 17.01, 219.31],
    category: '学生起案',
    title: 'ワークショップ',
    date: '８/１(土) ~ ８/３(月)',
    time: '14:00 ~ 18:00',
    place: 'Mensa',
    groups: [{ heading: '内容', lines: ['うちわをデザインする / 内壁をデザインする / 空間をデザインする'] }],
  },
  {
    id: 'food-0803',
    label: '8月3日 屋台・キッチンカー',
    rect: [519.3, 31.2, 17.01, 330.38],
    category: '学生起案',
    title: '屋台・キッチンカー',
    date: '８/１(土) ~ ８/３(月)',
    time: '14:00 ~ 20:00',
    place: 'ガレリア・２号館前',
    groups: [{ heading: '出店', lines: foodShops }, { lines: ['※五十音順', '※各出店によって開催日時が異なりますのでご了承ください。'] }],
  },
  {
    id: 'stage-0803',
    label: '8月3日 ステージ企画',
    rect: [374.73, 253.34, 102.05, 80.47],
    category: '学生起案',
    title: 'ステージ企画〈学生〉',
    date: '８/３(月)',
    time: '18:00 ~ 19:30',
    place: '中庭特設ステージ',
    groups: [{ heading: '出演', lines: ['18:00~18:20　漫才　せっぷんねんど', '18:20~18:40　ダンスバトル　メイジング企画', '18:40~19:00　落語フラメンコ　落語フラメンコ実行委員会', '19:00~19:20　ヌーディーサマー夏の祝い　ヌーディーサマー'] }],
  },
  {
    id: 'bon-0803',
    label: '8月3日 盆踊り',
    rect: [374.73, 336.65, 102.05, 52.7],
    category: '学生起案',
    title: '盆踊り',
    date: '８/３(月)',
    time: '19:30 ~ 20:30',
    place: '中庭特設ステージ',
    poster: { src: 'poster6-display.jpg', alt: '盆踊りポスター' },
    groups: [{ heading: '内容', lines: ['盆踊り大集合！'] }],
  },
];

if (timetableHotspots && timetableModal && timetableModalPanel) {
  let lastFocusedTimetableButton = null;

  const createText = (tagName, className, text) => {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    el.textContent = text;
    return el;
  };

  const setHotspotPosition = (button, rect) => {
    const [x, y, width, height] = rect;
    const xRatio = x / timetableImageSize.width;
    const yRatio = y / timetableImageSize.height;
    const widthRatio = width / timetableImageSize.width;
    const heightRatio = height / timetableImageSize.height;

    button.style.setProperty('--x', `${xRatio * 100}%`);
    button.style.setProperty('--y', `${yRatio * 100}%`);
    button.style.setProperty('--w', `${widthRatio * 100}%`);
    button.style.setProperty('--h', `${heightRatio * 100}%`);
    button.style.setProperty('--hover-image-width', `${100 / widthRatio}%`);
    button.style.setProperty('--hover-image-height', `${100 / heightRatio}%`);
    button.style.setProperty('--hover-image-left', `${-(xRatio / widthRatio) * 100}%`);
    button.style.setProperty('--hover-image-top', `${-(yRatio / heightRatio) * 100}%`);
  };

  const renderModalBody = (program) => {
    timetableModalBody.replaceChildren();

    if (!program.groups.length) {
      return;
    }

    program.groups.forEach((group) => {
      const section = document.createElement('section');
      section.className = 'timetable-modal-group';

      if (group.heading) {
        section.append(createText('h4', '', group.heading));
      }

      const list = document.createElement('ul');
      group.lines.forEach((line) => {
        const item = document.createElement('li');

        if (line && typeof line === 'object' && line.shop) {
          item.className = 'timetable-modal-shop-line';
          item.append(createText('span', 'timetable-modal-shop-item', line.item));
          item.append(createText('span', 'timetable-modal-shop-name', line.shop));
        } else {
          item.textContent = line;
        }

        list.append(item);
      });

      section.append(list);
      timetableModalBody.append(section);
    });
  };

  const openTimetableModal = (program, trigger) => {
    lastFocusedTimetableButton = trigger;
    timetableModalKicker.textContent = '';
    timetableModalTitle.textContent = program.title;
    timetableModalMeta.replaceChildren();

    [
      ['日付', program.date],
      ['時間', program.time],
      ['会場', program.place],
    ].forEach(([label, value]) => {
      if (!value) return;
      timetableModalMeta.append(createText('dt', '', label));
      timetableModalMeta.append(createText('dd', '', value));
    });

    if (timetableModalPoster) {
      timetableModalPoster.replaceChildren();
      timetableModalPoster.hidden = !program.poster;

      if (program.poster) {
        const posterImage = document.createElement('img');
        posterImage.src = program.poster.src;
        posterImage.alt = program.poster.alt;
        posterImage.loading = 'lazy';
        timetableModalPoster.append(posterImage);
      }
    }

    renderModalBody(program);

    timetableModal.hidden = false;
    document.body.classList.add('is-timetable-modal-open');
    timetableModalPanel.focus({ preventScroll: true });
  };

  const closeTimetableModal = () => {
    if (timetableModal.hidden) return;
    timetableModal.hidden = true;
    document.body.classList.remove('is-timetable-modal-open');

    if (lastFocusedTimetableButton) {
      lastFocusedTimetableButton.focus({ preventScroll: true });
      lastFocusedTimetableButton = null;
    }
  };

  timetablePrograms.forEach((program) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timetable-hotspot';
    button.dataset.programId = program.id;
    button.setAttribute('aria-label', `${program.label}の詳細を開く`);

    const hoverLayer = document.createElement('span');
    const hoverGraphic = document.createElement('img');
    hoverGraphic.src = 'timetable-hover.svg';
    hoverGraphic.alt = '';
    hoverGraphic.setAttribute('aria-hidden', 'true');
    hoverLayer.append(hoverGraphic);
    button.append(hoverLayer);

    setHotspotPosition(button, program.rect);
    button.addEventListener('click', () => openTimetableModal(program, button));
    timetableHotspots.append(button);
  });

  timetableModal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute('data-timetable-close')) {
      closeTimetableModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !timetableModal.hidden) {
      closeTimetableModal();
    }
  });
}
