sessionStorage.removeItem('solanaFloatClosed');

const SOLANA_ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
const PLATFORMS = [
  { name: 'Axiom', url: 'https://axiom.trade/@d15', key: 'axiom', logo: 'assets/axiom-logo.png' },
  { name: 'GMGN', url: 'https://gmgn.ai/sol/token/', key: 'gmgn', logo: 'assets/gmgn-logo.png' },
  { name: 'AVE', url: 'https://ave.ai/token/', key: 'ave', logo: 'assets/ave-logo.png' },
  { name: 'OKX', url: 'https://web3.okx.com/token/solana/', key: 'okx', logo: 'assets/okx-logo.png' },
  { name: 'Photon', url: 'https://photon-sol.tinyastro.io/lp/', key: 'photon', logo: 'assets/photon.svg' }
];

function isEditable(node) {
  if (!node) return false;
  if (node.nodeType !== 1) return false;
  const tag = node.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if (node.isContentEditable) return true;
  return false;
}

function wrapSolanaAddresses(node) {
  if (sessionStorage.getItem('solanaFloatClosed')) return;
  if (!node || node.nodeType !== 3 || !node.textContent.match(SOLANA_ADDRESS_REGEX)) return;
  if (isEditable(node.parentNode)) return;
  if (node.parentNode && (node.parentNode.classList && node.parentNode.classList.contains('solana-address') || node.parentNode.hasAttribute('data-solana-wrapped'))) return;
  const parent = node.parentNode;
  const frag = document.createDocumentFragment();
  let lastIndex = 0;
  let match;
  SOLANA_ADDRESS_REGEX.lastIndex = 0;
  while ((match = SOLANA_ADDRESS_REGEX.exec(node.textContent)) !== null) {
    const before = node.textContent.slice(lastIndex, match.index);
    if (before) frag.appendChild(document.createTextNode(before));
    const span = document.createElement('span');
    span.className = 'solana-address';
    span.textContent = match[0];
    span.setAttribute('data-solana-wrapped', '1');
    frag.appendChild(span);
    lastIndex = match.index + match[0].length;
  }
  const after = node.textContent.slice(lastIndex);
  if (after) frag.appendChild(document.createTextNode(after));
  parent.replaceChild(frag, node);
}

function processTweetNode(node) {
  if (!node.querySelectorAll) return;
  node.querySelectorAll('span').forEach(span => {
    span.childNodes.forEach(child => {
      if (child.nodeType === 3 && SOLANA_ADDRESS_REGEX.test(child.textContent)) {
        wrapSolanaAddresses(child);
      }
    });
  });
  // 处理顶层 span
  node.childNodes.forEach(child => {
    if (child.nodeType === 3 && SOLANA_ADDRESS_REGEX.test(child.textContent)) {
      wrapSolanaAddresses(child);
    }
  });
}

let floatBoxTimer = null;
let currentFloatBox = null;
let currentSelectedPlatform = 'gmgn';
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get({ selectedPlatform: 'gmgn' }, function(result) {
    if (result.selectedPlatform) currentSelectedPlatform = result.selectedPlatform;
  });
  chrome.storage.onChanged && chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === 'sync' && changes.selectedPlatform) {
      currentSelectedPlatform = changes.selectedPlatform.newValue;
    }
  });
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';
async function getAxiomPairAddress(tokenAddress) {
  const url = `https://lite-api.jup.ag/ultra/v1/search?query=${tokenAddress}`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await resp.json();
  console.log('Jupiter Ultra API返回：', data); // 调试用
  let pairAddress = null;
  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const pairs = item.pairs || [];
      for (const pair of pairs) {
        if (
          (pair.name && pair.name.includes('SOL')) ||
          pair.baseSymbol === 'SOL' || pair.quoteSymbol === 'SOL' ||
          pair.baseMint === SOL_MINT || pair.quoteMint === SOL_MINT
        ) {
          pairAddress = pair.address;
          break;
        }
      }
      if (pairAddress) break;
    }
  }
  return pairAddress;
}

async function showFloatingButtonAtMouse(addressSpan, mouseEvent) {
  if (sessionStorage.getItem('solanaFloatClosed')) return;
  const address = addressSpan.textContent;
  const selectedPlatform = currentSelectedPlatform;
  const platform = PLATFORMS.find(p => p.key === selectedPlatform);
  if (!platform) return;
  // 移除已有浮窗
  if (currentFloatBox) currentFloatBox.remove();
  const floatBox = document.createElement('div');
  floatBox.className = 'solana-float-box';
  floatBox.style.position = 'fixed';
  floatBox.style.left = mouseEvent.clientX + 10 + 'px';
  floatBox.style.top = mouseEvent.clientY + 10 + 'px';
  floatBox.style.zIndex = 99999;
  floatBox.style.display = 'inline-block';
  floatBox.style.verticalAlign = 'middle';
  floatBox.style.marginLeft = '0';

  floatBox.onmouseenter = () => {
    if (floatBoxTimer) {
      clearTimeout(floatBoxTimer);
      floatBoxTimer = null;
    }
  };
  floatBox.onmouseleave = () => {
    if (floatBoxTimer) clearTimeout(floatBoxTimer);
    floatBoxTimer = setTimeout(() => {
      floatBox.remove();
      currentFloatBox = null;
    }, 1000);
  };
  const btn = document.createElement('button');
  btn.className = `solana-btn solana-btn-${platform.key}`;
  let logoUrl = platform.logo;
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    logoUrl = chrome.runtime.getURL(platform.logo);
  }
  btn.innerHTML = `<span class='platform-logo-wrapper'><img src="${logoUrl}" class="solana-platform-logo"></span> ${platform.name}`;
  // 恢复为默认白色字体
  btn.style.color = '#fff';
  btn.onclick = async e => {
    e.stopPropagation();
    if (platform.key === 'axiom') {
      let copied = false;
      try {
        await navigator.clipboard.writeText(address);
        copied = true;
      } catch (err) {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = address;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copied = true;
        } catch (e) {}
      }
      // 无论是否复制成功，都跳转
      window.open('https://axiom.trade/discover', '_blank');
      if (floatBox) floatBox.remove();
      currentFloatBox = null;
      return;
    }
    let url = platform.url + address;
    if (platform.key === 'ave') url = platform.url + address + '-solana';
    if (platform.key === 'okx') url = platform.url + address;
    if (platform.key === 'photon') url = platform.url + address;
    window.open(url, '_blank');
    if (floatBox) floatBox.remove();
    currentFloatBox = null;
  };
  floatBox.appendChild(btn);
  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'solana-float-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    floatBox.remove();
    currentFloatBox = null;
    sessionStorage.setItem('solanaFloatClosed', '1');
  };
  floatBox.appendChild(closeBtn);
  document.body.appendChild(floatBox);
  currentFloatBox = floatBox;
}

function addHoverEventsToAddresses(root) {
  root.querySelectorAll('span.solana-address').forEach(span => {
    if (span._solanaHoverBound) return;
    span._solanaHoverBound = true;
    span.addEventListener('mouseenter', (e) => {
      if (floatBoxTimer) {
        clearTimeout(floatBoxTimer);
        floatBoxTimer = null;
      }
      showFloatingButtonAtMouse(span, e);
    });
    span.addEventListener('mouseleave', () => {
      if (floatBoxTimer) clearTimeout(floatBoxTimer);
      floatBoxTimer = setTimeout(() => {
        if (currentFloatBox) {
          currentFloatBox.remove();
          currentFloatBox = null;
        }
      }, 1000);
    });
  });
}

// 递归扫描所有文本节点，包裹合约地址
function scanAndWrapTextNodes(root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (
          node.parentNode &&
          !isEditable(node.parentNode) &&
          !node.parentNode.classList?.contains('solana-address') &&
          !node.parentNode.hasAttribute('data-solana-wrapped') &&
          SOLANA_ADDRESS_REGEX.test(node.textContent)
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    },
    false
  );
  let node;
  const nodesToWrap = [];
  while ((node = treeWalker.nextNode())) {
    nodesToWrap.push(node);
  }
  nodesToWrap.forEach(wrapSolanaAddresses);
  addHoverEventsToAddresses(document);
}

// 移除原有 observer 相关代码（如有）
// 增强型 MutationObserver
const enhancedObserver = new MutationObserver(() => {
  scanAndWrapTextNodes(document.body);
});

enhancedObserver.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// 首次加载时也执行一次
scanAndWrapTextNodes(document.body);

// 定时兜底
setInterval(() => {
  scanAndWrapTextNodes(document.body);
}, 3000);