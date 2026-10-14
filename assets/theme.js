(() => {
  const cartCount = document.querySelector('[data-cart-count]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactMotion = window.matchMedia('(max-width: 900px)');
  let motionContext;

  function initializeMotion() {
    if (reducedMotion.matches || !window.gsap || !window.ScrollTrigger) return;

    const { gsap, ScrollTrigger } = window;
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const compact = compactMotion.matches;
    gsap.registerPlugin(ScrollTrigger);
    motionContext?.revert();
    document.documentElement.classList.add('gsap-motion');

    motionContext = gsap.context(() => {
      const hero = document.querySelector('[data-motion-hero]');
      const heroCopy = hero?.querySelector('[data-motion-hero-copy]');
      const heroBadge = hero?.querySelector('[data-motion-hero-badge]');

      if (heroCopy) {
        gsap.fromTo(
          heroCopy,
          { autoAlpha: 0, y: mobile ? 30 : compact ? 40 : 54, rotateX: compact ? 0 : 5, transformPerspective: 1200 },
          { autoAlpha: 1, y: 0, rotateX: 0, duration: mobile ? 0.7 : 1, ease: 'power3.out' },
        );
      }

      if (heroBadge) {
        gsap.fromTo(
          heroBadge,
          { autoAlpha: 0, y: 22, scale: 0.92, rotateY: mobile ? 0 : -10 },
          { autoAlpha: 1, y: 0, scale: 1, rotateY: 0, duration: 0.75, delay: 0.2, ease: 'power3.out' },
        );
      }

      document.querySelectorAll('[data-motion-heading]').forEach((heading) => {
        gsap.fromTo(
          heading,
          { autoAlpha: 0, y: mobile ? 18 : compact ? 24 : 32, rotateX: compact ? 0 : 4, transformPerspective: 1000 },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: mobile ? 0.55 : 0.75,
            ease: 'power2.out',
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
          },
        );
      });

      document.querySelectorAll('[data-motion-grid]').forEach((grid) => {
        const cards = grid.querySelectorAll('[data-motion-card]');
        if (!cards.length) return;

        gsap.fromTo(
          cards,
          {
            autoAlpha: 0,
            y: mobile ? 20 : compact ? 28 : 42,
            z: compact ? 0 : -34,
            rotateX: compact ? 0 : 6,
            scale: compact ? 0.99 : 0.965,
            transformPerspective: 1100,
          },
          {
            autoAlpha: 1,
            y: 0,
            z: 0,
            rotateX: 0,
            scale: 1,
            duration: mobile ? 0.55 : 0.72,
            ease: 'power2.out',
            stagger: { each: mobile ? 0.045 : 0.07, from: 'start' },
            clearProps: 'transform',
            scrollTrigger: { trigger: grid, start: 'top 88%', once: true },
          },
        );
      });

      document.querySelectorAll('[data-motion-product-info], [data-motion-gallery], [data-motion-panel]').forEach((panel, index) => {
        gsap.fromTo(
          panel,
          { autoAlpha: 0, x: compact ? 0 : index === 0 ? -28 : 28, y: mobile ? 18 : 0, rotateY: compact ? 0 : index === 0 ? -3 : 3 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: panel, start: 'top 86%', once: true },
          },
        );
      });

      if (!compact) {
        document.querySelectorAll('[data-motion-parallax], .motion-parallax-image').forEach((image) => {
          const section = image.closest('[data-motion-hero], [data-motion-section]');
          if (!section) return;

          gsap.fromTo(
            image,
            { yPercent: -3, scale: 1.04 },
            {
              yPercent: 7,
              scale: 1.09,
              ease: 'none',
              scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
            },
          );
        });

        document.querySelectorAll('[data-motion-article-image]').forEach((image) => {
          gsap.fromTo(
            image,
            { y: 24, rotateX: 2, transformPerspective: 1200 },
            {
              y: -18,
              rotateX: 0,
              ease: 'none',
              scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
            },
          );
        });
      }
    }, document);

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function syncMotionPreference() {
    if (reducedMotion.matches) {
      motionContext?.revert();
      motionContext = null;
      document.documentElement.classList.remove('gsap-motion');
    } else {
      initializeMotion();
    }
  }

  async function refreshCartCount() {
    const cartUrl = document.body.dataset.cartUrl;
    if (!cartUrl || !cartCount) return;
    try {
      const response = await fetch(cartUrl, { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const cart = await response.json();
      cartCount.textContent = cart.item_count;
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    } catch {
      // The native cart form remains available if the AJAX request cannot complete.
    }
  }

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-sort-select]');
    if (select) select.form.requestSubmit();

    const variantSelect = event.target.closest('[data-variant-select]');
    if (!variantSelect) return;
    const option = variantSelect.selectedOptions[0];
    const price = document.querySelector('[data-product-price]');
    const addButton = document.querySelector('[data-add-button]');
    if (price && option.dataset.price) price.textContent = option.dataset.price;
    if (addButton) {
      addButton.disabled = option.disabled;
      addButton.textContent = option.disabled ? 'Sold out' : 'Add to cart';
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest("form[action*='/cart/add']");
    if (!form || !window.fetch) return;
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    const originalLabel = button?.textContent;
    const status = form.querySelector('[data-product-status]');
    const viewCart = form.querySelector('[data-view-cart]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Adding…';
    }
    if (status) status.textContent = '';
    try {
      const response = await fetch(`${form.action}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.description || 'Unable to add this item.');
      if (status) status.textContent = 'Added to your shopping bag.';
      if (button) button.textContent = 'Added';
      if (viewCart) viewCart.hidden = false;
      await refreshCartCount();
    } catch (error) {
      if (status) status.textContent = error instanceof Error ? error.message : 'Unable to add this item.';
      if (button) button.textContent = originalLabel || 'Add to cart';
    } finally {
      if (button) button.disabled = false;
    }
  });

  initializeMotion();
  reducedMotion.addEventListener?.('change', syncMotionPreference);
  compactMotion.addEventListener?.('change', initializeMotion);
  document.addEventListener('shopify:section:load', () => requestAnimationFrame(initializeMotion));
  document.addEventListener('shopify:section:unload', () => requestAnimationFrame(initializeMotion));
  window.addEventListener('load', () => window.ScrollTrigger?.refresh(), { once: true });
})();