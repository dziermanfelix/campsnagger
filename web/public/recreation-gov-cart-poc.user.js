// ==UserScript==
// @name         Campsnagger Recreation.gov Cart POC
// @namespace    https://campsnagger.local
// @version      0.1.0
// @description  Reads campsite/date intent from the URL hash and attempts to select dates and add the site to cart on Recreation.gov.
// @match        https://www.recreation.gov/camping/campsites/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  const HASH_KEY = 'campsnagger_cart_poc';
  const STATUS_ID = 'campsnagger-cart-poc-status';
  const intent = parseIntent();

  if (!intent) {
    return;
  }

  start().catch((error) => {
    showStatus(`Cart POC failed: ${String(error)}`, true);
    console.error('[campsnagger-cart-poc]', error);
  });

  async function start() {
    showStatus(`Trying to add site ${intent.siteNumber} to cart for ${intent.availableDates.length} date(s)...`);

    const uniqueDates = [...new Set(intent.availableDates)].sort();
    let clickedDates = 0;

    for (const date of uniqueDates) {
      const dateControl = await waitForDateControl(date, 3000);
      if (!dateControl) {
        showStatus(`Could not find a clickable control for ${date}. You may need to select that date manually.`, true);
        continue;
      }

      clickControl(dateControl);
      clickedDates += 1;
      showStatus(`Selected ${clickedDates}/${uniqueDates.length} dates for site ${intent.siteNumber}...`);
      await sleep(400);
    }

    const addToCartButton = await waitForAddToCartButton(5000);
    if (!addToCartButton) {
      showStatus('Dates were selected, but no Add to Cart button was found. Complete the reservation manually.', true);
      return;
    }

    clickControl(addToCartButton);
    showStatus(`Clicked Add to Cart for site ${intent.siteNumber}. Finish checkout in Recreation.gov.`, false);
  }

  function parseIntent() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const encoded = hash.get(HASH_KEY);
    if (!encoded) {
      return null;
    }

    try {
      const parsed = JSON.parse(window.atob(encoded));
      if (
        typeof parsed?.campsiteId !== 'string' ||
        typeof parsed?.siteNumber !== 'string' ||
        !Array.isArray(parsed?.availableDates)
      ) {
        return null;
      }

      return {
        campsiteId: parsed.campsiteId,
        siteNumber: parsed.siteNumber,
        availableDates: parsed.availableDates.filter((date) => typeof date === 'string'),
      };
    } catch (error) {
      console.error('[campsnagger-cart-poc] Failed to decode link intent', error);
      return null;
    }
  }

  function showStatus(message, isWarning = false) {
    let root = document.getElementById(STATUS_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = STATUS_ID;
      Object.assign(root.style, {
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: '2147483647',
        maxWidth: '360px',
        padding: '12px 14px',
        borderRadius: '12px',
        background: isWarning ? 'rgba(127, 29, 29, 0.95)' : 'rgba(6, 78, 59, 0.95)',
        color: '#fff',
        font: '14px/1.4 system-ui, sans-serif',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      });
      document.body.appendChild(root);
    }

    root.textContent = message;
    root.style.background = isWarning ? 'rgba(127, 29, 29, 0.95)' : 'rgba(6, 78, 59, 0.95)';
  }

  async function waitForDateControl(isoDate, timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const control = findDateControl(isoDate);
      if (control) {
        return control;
      }
      await sleep(250);
    }
    return null;
  }

  function findDateControl(isoDate) {
    const [year, month, day] = isoDate.split('-');
    const dayNumber = String(Number(day));
    const monthName = new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const shortMonthName = new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    });

    const candidates = Array.from(
      document.querySelectorAll(
        [
          'button',
          '[role="button"]',
          '[data-date]',
          '[aria-label]',
          '[aria-selected]',
          'td',
          '[tabindex]',
        ].join(','),
      ),
    );

    const exactMatches = candidates.filter((element) => {
      const attrs = collectSearchableText(element).join(' ').toLowerCase();
      return (
        attrs.includes(isoDate.toLowerCase()) ||
        attrs.includes(`${monthName.toLowerCase()} ${dayNumber}`) ||
        attrs.includes(`${shortMonthName.toLowerCase()} ${dayNumber}`) ||
        attrs.includes(`${monthNumber(month)}\/${dayNumber}\/${year}`.toLowerCase()) ||
        attrs.includes(`${dayNumber} ${monthName.toLowerCase()}`) ||
        attrs.includes(`${year}-${month}-${day}`.toLowerCase())
      );
    });

    const clickableExactMatch = exactMatches.find(isClickable);
    if (clickableExactMatch) {
      return clickableExactMatch;
    }

    const dayOnlyMatches = candidates.filter((element) => {
      if (!isClickable(element)) {
        return false;
      }
      const text = element.textContent?.trim();
      return text === dayNumber;
    });

    return dayOnlyMatches[0] ?? null;
  }

  async function waitForAddToCartButton(timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const button = findButtonByText(['Add to Cart', 'Book Now']);
      if (button) {
        return button;
      }
      await sleep(250);
    }
    return null;
  }

  function findButtonByText(labels) {
    const controls = Array.from(document.querySelectorAll('button, [role="button"], a'));
    for (const control of controls) {
      const text = control.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!text) {
        continue;
      }
      if (labels.some((label) => text.includes(label.toLowerCase())) && isClickable(control)) {
        return control;
      }
    }
    return null;
  }

  function collectSearchableText(element) {
    return [
      element.textContent ?? '',
      element.getAttribute('aria-label') ?? '',
      element.getAttribute('data-date') ?? '',
      element.getAttribute('datetime') ?? '',
      element.getAttribute('title') ?? '',
      element.getAttribute('aria-describedby') ?? '',
      element.getAttribute('aria-selected') ?? '',
    ];
  }

  function isClickable(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
      return false;
    }
    return true;
  }

  function clickControl(element) {
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: 'center', inline: 'center' });
      element.click();
    }
  }

  function monthNumber(month) {
    return String(Number(month));
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
})();
