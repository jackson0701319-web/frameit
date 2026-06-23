const AD_SCRIPT_ATTR = 'data-adsense-script';

export function getAdSenseClient() {
  return import.meta.env.VITE_ADSENSE_CLIENT?.trim() || '';
}

export function getAdSenseSlot(variant) {
  const key = variant === 'top' ? 'VITE_ADSENSE_SLOT_TOP' : 'VITE_ADSENSE_SLOT_SIDEBAR';
  return import.meta.env[key]?.trim() || '';
}

function isValidAdSlot(slot) {
  return Boolean(slot) && slot !== '0000000000';
}

export function isAdSenseConfigured(variant) {
  return Boolean(getAdSenseClient() && isValidAdSlot(getAdSenseSlot(variant)));
}

export function isAdSenseEnabled() {
  return Boolean(getAdSenseClient());
}

let scriptPromise = null;

function hasAdSenseScript() {
  return Boolean(
    document.querySelector(`script[${AD_SCRIPT_ATTR}]`)
    || document.querySelector('script[src*="adsbygoogle.js"]'),
  );
}

export function loadAdSenseScript() {
  const client = getAdSenseClient();
  if (!client) return Promise.resolve(false);

  if (hasAdSenseScript()) {
    return Promise.resolve(true);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      script.crossOrigin = 'anonymous';
      script.setAttribute(AD_SCRIPT_ATTR, 'true');
      script.onload = () => resolve(true);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('AdSense script failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

export function pushAdSenseSlot(container) {
  if (!container || container.dataset.adsbygoogleStatus) return;

  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.push({});
}
