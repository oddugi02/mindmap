// ─── Firebase Init ────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFV1o3777TorEDXPAb6SSJbn5bXtYlGiE",
  authDomain: "mindmap-43bac.firebaseapp.com",
  projectId: "mindmap-43bac",
  storageBucket: "mindmap-43bac.firebasestorage.app",
  messagingSenderId: "44458661795",
  appId: "1:44458661795:web:1d2e362cbacc8af056ec16"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// URL Parameter Handling (Room ID)
const params = new URLSearchParams(window.location.search);
let roomId = params.get('id');
if (!roomId) {
  roomId = Math.random().toString(36).slice(2, 8);
  window.history.replaceState(null, '', `?id=${roomId}`);
}
const docRef = doc(db, 'mindmaps', roomId);

// ─── Data Store ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'treemap_v1';

let tree = null;       // root node object
let selectedId = null; // currently selected node id

// Node schema: { id, text, size, weight, color, children: [] }
function makeNode(text = '키워드', size = 16, weight = 400, color = '#1a1a1a') {
  return {
    id: 'n' + Date.now() + Math.random().toString(36).slice(2, 7),
    text, size, weight, color,
    children: []
  };
}

// ─── Toolbar State ────────────────────────────────────────────────────────────
let tb = { size: 16, weight: 400, color: '#1a1a1a' };

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const treeLayer = document.getElementById('tree-layer');
const svgLayer  = document.getElementById('svg-layer');
const szVal     = document.getElementById('sz-val');

// ─── Save / Load ──────────────────────────────────────────────────────────────
// ─── Save / Load ──────────────────────────────────────────────────────────────
let saveTimeout = null;
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  // Firebase save (debounced)
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    setDoc(docRef, { tree }).catch(console.error);
  }, 400);
}

// 사용자님의 스크린샷 바탕으로 복구한 데이터
const RECOVERY_DATA = {
  text: "안의(安意)", size: 24, weight: 700, color: "#1a1a1a",
  children: [
    { text: "신념", size: 18, weight: 700, color: "#2563eb", children: [
      { text: "공동체", size: 16, weight: 700, color: "#1a1a1a", children: [
        { text: "계승", children: [
          { text: "지속", children: [
            { text: "반복", children: [{ text: "연속성" }, { text: "복제" }] },
            { text: "간격" }
          ]},
          { text: "전달", children: [
            { text: "교차", children: [
              { text: "끝과 시작", children: [
                { text: "경계" },
                { text: "닮은꼴", children: [
                  { text: "대칭", children: [{ text: "책의 페이지" }, { text: "직선" }] },
                  { text: "투영", children: [{ text: "반사판" }] }
                ]}
              ]}
            ]}
          ]}
        ]},
        { text: "통념", children: [
          { text: "통일", children: [
            { text: "구조", children: [
              { text: "틀" },
              { text: "정형화", children: [{ text: "개념" }] },
              { text: "견고함", children: [{ text: "직조", children: [{text:"격자"},{text:"수직수평"},{text:"반복확장"},{text:"파생"}] }] }
            ]}
          ]}
        ]},
        { text: "관리", children: [
          { text: "통제", children: [
            { text: "주입", children: [{ text: "강제성" }, { text: "폐쇄" }, { text: "압력", children: [{text:"밀착"},{text:"창조"}] }] }
          ]}
        ]},
        { text: "세뇌", children: [
          { text: "변화" },
          { text: "믿음", children: [{ text: "당위" }, { text: "입력", children: [{text:"즉각반응/출력"}] }] }
        ]}
      ]},
      { text: "공감대", children: [
        { text: "상호주관" },
        { text: "암묵적 합의" },
        { text: "파장/주파수", children: [
          { text: "호흡", children: [
            { text: "오르내림", children: [{ text: "확장과 수축" }, { text: "부풂과 가라앉음" }] }
          ]},
          { text: "전율", children: [
            { text: "아우라" },
            { text: "파장", children: [{ text: "시차" }] }
          ]}
        ]},
        { text: "직관" }
      ]},
      { text: "각인", children: [
        { text: "영구", children: [
          { text: "비가역성", children: [{ text: "일방향" }] },
          { text: "귀속" }
        ]}
      ]},
      { text: "기초", children: [
        { text: "신뢰", children: [{ text: "신성" }, { text: "전래" }] },
        { text: "규율", children: [{ text: "가설" }, { text: "철학" }, { text: "기준" }] }
      ]},
      { text: "자아" }
    ]},
    { text: "침묵", size: 18, weight: 700, color: "#2563eb", children: [
      { text: "수련", children: [
        { text: "고독", children: [{ text: "소외" }, { text: "고립" }] },
        { text: "수양", children: [{ text: "내면집중" }, { text: "자가검열" }, { text: "집중", children: [{text:"집착"}] }] }
      ]},
      { text: "정지", children: [{ text: "인내" }, { text: "고정" }] },
      { text: "질서", children: [
        { text: "인식", children: [{ text: "부동" }, { text: "정숙" }, { text: "의존" }] }
      ]},
      { text: "절제", children: [
        { text: "순수", children: [{ text: "맑음" }, { text: "투명함" }] },
        { text: "통제", children: [{ text: "억압" }, { text: "은폐", children: [{text:"부재"},{text:"그림자"}] }] }
      ]}
    ]},
    { text: "비언어", size: 18, weight: 700, color: "#2563eb" },
    { text: "자연", size: 18, weight: 700, color: "#2563eb", children: [
      { text: "이정표", children: [
        { text: "어머니", children: [{ text: "품" }, { text: "가르침", children: [{text:"확장", children:[{text:"세계관"}]}] }] },
        { text: "길", children: [{ text: "인도" }] }
      ]},
      { text: "이상", children: [{ text: "존경", children:[{text:"경외"}] }, { text: "모방" }] }
    ]}
  ]
};

// 재귀적으로 ID와 기본 스타일 부여
function prepareData(node) {
  if (!node.id) node.id = 'n' + Date.now() + Math.random().toString(36).slice(2, 7);
  if (node.size === undefined) node.size = 16;
  if (node.weight === undefined) node.weight = 400;
  if (node.color === undefined) node.color = '#1a1a1a';
  if (!node.children) node.children = [];
  node.children.forEach(prepareData);
  return node;
}

/* Firebase 실시간 동기화 설정 */
let isFirstLoad = true;
function setupRealtime() {
  onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
    if (docSnap.metadata.hasPendingWrites) return; // 내가 저장한 내역이면 리렌더 방지
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    if (data.tree) {
      tree = prepareData(data.tree);
      if (!isFirstLoad) {
        render(); // 다른 기기에서 바꿨을 때 새로고침
        if (selectedId) selectNode(selectedId);
      }
    }
  });
}

async function load() {
  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.tree) {
        tree = prepareData(data.tree);
        setupRealtime();
        isFirstLoad = false;
        return;
      }
    }
  } catch (err) {
    console.error("Firebase fetch error", err);
  }

  // Not found in firebase -> Read local or create fresh
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.text) {
        tree = prepareData(parsed);
        save();
        setupRealtime();
        isFirstLoad = false;
        return;
      }
    } catch(e) {}
  }
  
  console.log("Starting fresh or restoring from recovery data...");
  tree = prepareData(JSON.parse(JSON.stringify(RECOVERY_DATA))); 
  save();
  setupRealtime();
  isFirstLoad = false;
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindmap_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target.result);
        if (data && data.text) {
          if (confirm("현재 내용을 덮어쓰고 백업 파일을 불러올까요?")) {
            tree = data;
            save();
            render();
          }
        }
      } catch(err) { alert("올바른 JSON 파일이 아닙니다."); }
    };
    reader.readAsText(file);
  };
  input.click();
}


// ─── Find / Iterate ───────────────────────────────────────────────────────────
function findNode(id, node = tree) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const c of node.children) {
    const found = findNode(id, c);
    if (found) return found;
  }
  return null;
}

function findParent(id, node = tree, parent = null) {
  if (node.id === id) return parent;
  for (const c of node.children) {
    const found = findParent(id, c, node);
    if (found !== undefined) return found;
  }
  return undefined;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  treeLayer.innerHTML = '';
  svgLayer.innerHTML  = '';
  if (!tree) return;
  renderNode(tree, treeLayer, 0);
  // After DOM is painted, draw SVG connectors
  requestAnimationFrame(drawLines);
}

function renderNode(node, container, depth) {
  // Wrapper
  const wrap = document.createElement('div');
  wrap.className = 'node-wrap';
  wrap.dataset.id = node.id;
  if (node.id === selectedId) wrap.classList.add('selected');

  // Self: bullet + label
  const self = document.createElement('div');
  self.className = 'node-self';
  self.dataset.id = node.id;

  const bullet = document.createElement('div');
  bullet.className = 'node-bullet';
  bullet.style.color = node.color;
  bullet.style.borderColor = node.color;

  const label = document.createElement('div');
  label.className = 'node-label';
  label.textContent = node.text;
  label.style.fontSize   = node.size + 'px';
  label.style.fontWeight = node.weight;
  label.style.color      = node.color;
  label.contentEditable = 'false';

  self.appendChild(bullet);
  self.appendChild(label);
  wrap.appendChild(self);

  // Children container
  if (node.children.length > 0) {
    const childContainer = document.createElement('div');
    childContainer.className = 'node-children';
    for (const child of node.children) {
      renderNode(child, childContainer, depth + 1);
    }
    wrap.appendChild(childContainer);
  }

  container.appendChild(wrap);

  // ── Events ──────────────────────────────────────────────────────────────
  // Single click: select
  self.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    selectNode(node.id);
  });

  // Double click: edit
  label.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startEdit(node.id, label);
  });
}

// ─── SVG Lines ────────────────────────────────────────────────────────────────
// 캔버스 기준 좌표: getBoundingClientRect를 #canvas 기준으로 보정
const canvasEl   = document.getElementById('canvas');
const canvasWrap = document.getElementById('canvas-wrap');

function getBulletCenter(bulletEl) {
  const bRect  = bulletEl.getBoundingClientRect();
  const wRect  = canvasWrap.getBoundingClientRect();
  // viewport 기준 위치 → canvasWrap 기준 → 스크롤 더하면 canvas 내부 절대 좌표
  return {
    x: bRect.left + bRect.width  / 2 - wRect.left + canvasWrap.scrollLeft,
    y: bRect.top  + bRect.height / 2 - wRect.top  + canvasWrap.scrollTop
  };
}

function drawLines() {
  svgLayer.innerHTML = '';
  if (!tree) return;
  // SVG 크기를 실제 전체 컨텐츠(scrollWidth/Height)에 맞게 강제 확장
  const w = Math.max(canvasEl.scrollWidth, canvasEl.offsetWidth);
  const h = Math.max(canvasEl.scrollHeight, canvasEl.offsetHeight);
  svgLayer.setAttribute('width',  w);
  svgLayer.setAttribute('height', h);
  svgLayer.style.width  = w + 'px';
  svgLayer.style.height = h + 'px';
  drawNodeLines(tree);
}

function drawNodeLines(node) {
  const selfEl = getSelfEl(node.id);
  if (!selfEl) return;

  const bul = selfEl.querySelector('.node-bullet');
  const { x: px, y: py } = getBulletCenter(bul);

  for (const child of node.children) {
    const childSelf = getSelfEl(child.id);
    if (!childSelf) continue;
    const cb = childSelf.querySelector('.node-bullet');
    const { x: cx, y: cy } = getBulletCenter(cb);

    // 직선적(Orthogonal) 구조: 90도 꺾인 선
    // 부모 점(px, py) -> 중간 지점(midX, py) -> 자식 높이(midX, cy) -> 자식 점(cx, cy)
    const midX = px + 28; // 고정 오프셋이 구조를 더 단단하게 보여줌
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${px} ${py} L ${midX} ${py} L ${midX} ${cy} L ${cx} ${cy}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#d1d1cf');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svgLayer.appendChild(path);

    drawNodeLines(child);
  }
}

function getSelfEl(id) {
  return treeLayer.querySelector(`.node-self[data-id="${id}"]`);
}


// ─── Selection ────────────────────────────────────────────────────────────────
function selectNode(id) {
  selectedId = id;
  // Re-apply selected class without full re-render
  document.querySelectorAll('.node-wrap').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });

  // Sync toolbar to node's current style
  const node = findNode(id);
  if (node) {
    tb.size   = node.size;
    tb.weight = node.weight;
    tb.color  = node.color;
    syncToolbarUI();
  }
}

function deselect() {
  selectedId = null;
  document.querySelectorAll('.node-wrap').forEach(el => el.classList.remove('selected'));
}

// ─── Editing ──────────────────────────────────────────────────────────────────
function startEdit(id, labelEl) {
  selectNode(id);
  labelEl.contentEditable = 'true';
  labelEl.focus();
  // Select all text
  const range = document.createRange();
  range.selectNodeContents(labelEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const node = findNode(id);

  function onInput() {
    if (node) {
      node.text = labelEl.textContent; // .trim()을 빼서 스페이스 입력 가능하게 함
      save();
      showAutosaveHint();
    }
  }

  function finish() {
    labelEl.contentEditable = 'false';
    if (node) {
      node.text = labelEl.textContent.trim() || node.text;
      labelEl.textContent = node.text;
      save();
    }
    labelEl.removeEventListener('input', onInput);
    labelEl.removeEventListener('blur', finish);
    labelEl.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); labelEl.blur(); }
    if (e.key === 'Escape') { labelEl.blur(); }
    e.stopPropagation();
  }

  labelEl.addEventListener('input', onInput);
  labelEl.addEventListener('blur', finish);
  labelEl.addEventListener('keydown', onKey);
}

let saveHintTimeout = null;
function showAutosaveHint() {
  let hint = document.getElementById('autosave-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'autosave-hint';
    hint.style = `
      position: fixed; bottom: 20px; right: 20px;
      background: rgba(0,0,0,0.7); color: white;
      padding: 6px 12px; border-radius: 20px;
      font-size: 12px; pointer-events: none;
      opacity: 0; transition: opacity 0.3s;
      z-index: 9999;
    `;
    hint.textContent = '자동 저장됨 ✓';
    document.body.appendChild(hint);
  }
  hint.style.opacity = '1';
  clearTimeout(saveHintTimeout);
  saveHintTimeout = setTimeout(() => {
    hint.style.opacity = '0';
  }, 1000);
}


// ─── CRUD ─────────────────────────────────────────────────────────────────────
function addChildTo(id) {
  const node = findNode(id);
  if (!node) return;
  const child = makeNode('키워드', tb.size, tb.weight, tb.color);
  node.children.push(child);
  save();
  render();
  selectNode(child.id);
  // Start editing right away
  requestAnimationFrame(() => {
    const lbl = treeLayer.querySelector(`.node-self[data-id="${child.id}"] .node-label`);
    if (lbl) startEdit(child.id, lbl);
  });
}

function addSiblingAfter(id) {
  const parent = findParent(id);
  if (parent === null) {
    // id is root — don't add sibling to root
    alert('최상위 노드에는 형제를 추가할 수 없습니다.');
    return;
  }
  if (!parent) return;
  const idx = parent.children.findIndex(c => c.id === id);
  const sibling = makeNode('키워드', tb.size, tb.weight, tb.color);
  parent.children.splice(idx + 1, 0, sibling);
  save();
  render();
  selectNode(sibling.id);
  requestAnimationFrame(() => {
    const lbl = treeLayer.querySelector(`.node-self[data-id="${sibling.id}"] .node-label`);
    if (lbl) startEdit(sibling.id, lbl);
  });
}

function deleteNode(id) {
  if (tree.id === id) { alert('루트 노드는 삭제할 수 없습니다.'); return; }
  const parent = findParent(id);
  if (!parent) return;
  parent.children = parent.children.filter(c => c.id !== id);
  selectedId = null;
  save();
  render();
}

// ─── Style Updates ────────────────────────────────────────────────────────────
function applyStyleToSelected(patch) {
  if (!selectedId) return;
  const node = findNode(selectedId);
  if (!node) return;
  Object.assign(node, patch);
  Object.assign(tb, patch);
  syncToolbarUI();
  save();

  // Update DOM directly (no re-render needed)
  const selfEl = getSelfEl(selectedId);
  if (!selfEl) return;
  const lbl = selfEl.querySelector('.node-label');
  const bul = selfEl.querySelector('.node-bullet');
  if (patch.size   !== undefined) lbl.style.fontSize   = patch.size + 'px';
  if (patch.weight !== undefined) lbl.style.fontWeight = patch.weight;
  if (patch.color  !== undefined) {
    lbl.style.color = patch.color;
    bul.style.color = patch.color;
    bul.style.borderColor = patch.color;
  }
  // Redraw lines because label size may have changed
  requestAnimationFrame(drawLines);
}

function syncToolbarUI() {
  szVal.textContent = tb.size;
  document.querySelectorAll('.weight-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.w) === tb.weight)
  );
  document.querySelectorAll('.color-dot').forEach(b =>
    b.classList.toggle('active', b.dataset.c === tb.color)
  );
}

// ─── Toolbar Events ───────────────────────────────────────────────────────────
document.getElementById('sz-up').addEventListener('click', () => {
  const s = Math.min((tb.size || 16) + 2, 48);
  applyStyleToSelected({ size: s });
  if (!selectedId) { tb.size = s; syncToolbarUI(); }
});

document.getElementById('sz-down').addEventListener('click', () => {
  const s = Math.max((tb.size || 16) - 2, 8);
  applyStyleToSelected({ size: s });
  if (!selectedId) { tb.size = s; syncToolbarUI(); }
});

document.querySelectorAll('.weight-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const w = parseInt(btn.dataset.w);
    applyStyleToSelected({ weight: w });
    if (!selectedId) { tb.weight = w; syncToolbarUI(); }
  });
});

document.querySelectorAll('.color-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    const c = btn.dataset.c;
    applyStyleToSelected({ color: c });
    if (!selectedId) { tb.color = c; syncToolbarUI(); }
  });
});

document.getElementById('btn-add-child').addEventListener('click', () => {
  if (!selectedId) return alert('먼저 노드를 선택하세요.');
  addChildTo(selectedId);
});

document.getElementById('btn-add-sibling').addEventListener('click', () => {
  if (!selectedId) return alert('먼저 노드를 선택하세요.');
  addSiblingAfter(selectedId);
});

document.getElementById('btn-delete').addEventListener('click', () => {
  if (!selectedId) return alert('먼저 노드를 선택하세요.');
  if (confirm('선택한 노드와 모든 자식을 삭제할까요?')) deleteNode(selectedId);
});

document.getElementById('btn-save').addEventListener('click', () => {
  save();
  const btn = document.getElementById('btn-save');
  const orig = btn.textContent;
  btn.textContent = '저장됨 ✓';
  btn.style.background = '#18181b';
  btn.style.color = 'white';
  btn.style.borderColor = '#18181b';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }, 1600);
});

document.getElementById('btn-json-export').addEventListener('click', exportJSON);
document.getElementById('btn-json-import').addEventListener('click', importJSON);

document.getElementById('btn-new').addEventListener('click', () => {
  if (confirm('현재 작업을 모두 지우고 새로운 마인드맵을 만들까요?')) {
    tree = makeNode('새로운 주제', 24, 700, '#1a1a1a');
    save();
    render();
    deselect();
  }
});


// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Ignore if inside editable
  if (document.activeElement && document.activeElement.contentEditable === 'true') return;
  if (!selectedId) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    addChildTo(selectedId);
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    addSiblingAfter(selectedId);
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      if (confirm('삭제할까요?')) deleteNode(selectedId);
    }
  }
  if (e.key === 'F2') {
    const lbl = treeLayer.querySelector(`.node-self[data-id="${selectedId}"] .node-label`);
    if (lbl) startEdit(selectedId, lbl);
  }
  if (e.key === 'Escape') deselect();
});

// Click on empty area = deselect
document.getElementById('canvas-wrap').addEventListener('mousedown', (e) => {
  if (e.target === document.getElementById('canvas-wrap') ||
      e.target === document.getElementById('canvas') ||
      e.target === svgLayer) {
    deselect();
  }
});

// ─── Export PNG ───────────────────────────────────────────────────────────────
document.getElementById('btn-export').addEventListener('click', exportPNG);

function exportPNG() {
  const SCALE = 2.5;
  const PAD   = 80;

  // Collect all bullet positions to determine bounding box
  const selfEls = treeLayer.querySelectorAll('.node-self');
  const canvasEl = document.getElementById('canvas');
  const canvasRect = canvasEl.getBoundingClientRect();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  selfEls.forEach(el => {
    const bul = el.querySelector('.node-bullet');
    const lbl = el.querySelector('.node-label');
    const br  = el.getBoundingClientRect();
    const tr  = lbl.getBoundingClientRect();

    const x1 = bul.getBoundingClientRect().left - canvasRect.left + canvasEl.scrollLeft;
    const y1 = br.top  - canvasRect.top  + canvasEl.scrollTop;
    const x2 = tr.right  - canvasRect.left + canvasEl.scrollLeft;
    const y2 = br.bottom - canvasRect.top  + canvasEl.scrollTop;

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  if (!isFinite(minX)) { alert('노드가 없습니다.'); return; }

  const W = Math.ceil(maxX - minX) + PAD * 2;
  const H = Math.ceil(maxY - minY) + PAD * 2;
  const ox = -minX + PAD;
  const oy = -minY + PAD;

  const cvs = document.createElement('canvas');
  cvs.width  = W * SCALE;
  cvs.height = H * SCALE;
  const ctx  = cvs.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // White bg
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let gx = 0; gx < W; gx += 28) {
    for (let gy = 0; gy < H; gy += 28) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Draw lines first ---
  function drawNodeLinesCtx(node) {
    const sel = treeLayer.querySelector(`.node-self[data-id="${node.id}"]`);
    if (!sel) return;
    const pb  = sel.querySelector('.node-bullet').getBoundingClientRect();
    const px  = pb.left + pb.width  / 2 - canvasRect.left + ox;
    const py  = pb.top  + pb.height / 2 - canvasRect.top  + oy;

    for (const child of node.children) {
      const csel = treeLayer.querySelector(`.node-self[data-id="${child.id}"]`);
      if (!csel) continue;
      const cb   = csel.querySelector('.node-bullet').getBoundingClientRect();
      const cx   = cb.left + cb.width  / 2 - canvasRect.left + ox;
      const cy   = cb.top  + cb.height / 2 - canvasRect.top  + oy;
      
      const midX = px + 28;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(midX, py);
      ctx.lineTo(midX, cy);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = '#d1d1cf';
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      drawNodeLinesCtx(child);
    }
  }
  drawNodeLinesCtx(tree);

  // --- Draw nodes ---
  function drawNodeCtx(node) {
    const sel = treeLayer.querySelector(`.node-self[data-id="${node.id}"]`);
    if (!sel) return;
    const bul = sel.querySelector('.node-bullet');
    const lbl = sel.querySelector('.node-label');

    const br  = bul.getBoundingClientRect();
    const bx  = br.left + br.width  / 2 - canvasRect.left + ox;
    const by  = br.top  + br.height / 2 - canvasRect.top  + oy;

    // Bullet circle
    ctx.beginPath();
    ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label text
    ctx.font = `${node.weight} ${node.size}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = node.color;
    ctx.textBaseline = 'middle';
    const lr = lbl.getBoundingClientRect();
    const lx = lr.left - canvasRect.left + ox + 8;
    const ly = lr.top  + lr.height / 2 - canvasRect.top + oy;
    ctx.fillText(node.text, lx, ly);

    for (const child of node.children) drawNodeCtx(child);
  }
  drawNodeCtx(tree);

  // Download
  const link = document.createElement('a');
  link.download = '마인드맵.png';
  link.href = cvs.toDataURL('image/png');
  link.click();
}

// ─── Resize: redraw lines when window resizes ─────────────────────────────────
window.addEventListener('resize', () => requestAnimationFrame(drawLines));
document.getElementById('canvas-wrap').addEventListener('scroll', () => requestAnimationFrame(drawLines));

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  await load();
  render();
  syncToolbarUI();
}
boot();
