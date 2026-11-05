/**
 * EcoTrack – Custom Accessible Select Dropdown Component
 * 
 * Replaces unstyleable native Windows/Chromium OS <select> popups with fully
 * themeable, dark botanical dropdown menus rendered in the document DOM.
 * 
 * Features:
 * - Blends into dark background (#0a2119 surface, subtle 0.12 mint borders)
 * - Eliminates OS bright-blue option highlights (#163b2f dark-green selected)
 * - Complete keyboard accessibility (Arrow keys, Enter, Space, Escape, Tab)
 * - ARIA combobox / listbox pattern
 * - Automatic bidirectional synchronization with underlying native <select>
 * - Preserves all existing event listeners, change triggers, and test suites
 */

(function() {
  'use strict';

  /**
   * Enhances all targeted <select> elements in container with custom accessible dropdowns
   * @param {HTMLElement|Document} [container=document]
   */
  function initCustomSelects(container) {
    const root = container || document;
    if (!root || typeof root.querySelectorAll !== 'function') return;

    const selects = root.querySelectorAll('select.select-control, select.hub-category-select');
    selects.forEach(select => enhanceSelect(select));
  }

  /**
   * Enhances a single native <select> element
   * @param {HTMLSelectElement} select
   */
  function enhanceSelect(select) {
    if (!select || select.dataset.ecoCustomEnhanced === 'true') {
      // If already enhanced, update trigger label and options
      if (select._ecoSyncCustomSelect) {
        select._ecoSyncCustomSelect();
      }
      return;
    }

    select.dataset.ecoCustomEnhanced = 'true';

    // Hide native select accessibly
    select.classList.add('custom-select-native');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    // Create custom dropdown container
    const wrapper = document.createElement('div');
    wrapper.className = 'eco-custom-select';
    if (select.id) {
      wrapper.id = 'eco-custom-select-' + select.id;
      wrapper.setAttribute('data-select-for', select.id);
    }

    // Determine initial selected option
    const initialSelectedOption = select.options[select.selectedIndex] || select.options[0];
    const initialText = initialSelectedOption ? initialSelectedOption.text : '';

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'eco-custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (select.id) {
      trigger.setAttribute('aria-labelledby', select.id);
    }
    trigger.setAttribute('title', initialText);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'eco-custom-select-label';
    labelSpan.textContent = initialText;
    trigger.appendChild(labelSpan);

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'eco-custom-select-arrow';
    arrowSpan.setAttribute('aria-hidden', 'true');
    arrowSpan.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e998c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    trigger.appendChild(arrowSpan);

    // Create dropdown menu list
    const dropdown = document.createElement('div');
    dropdown.className = 'eco-custom-select-dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.style.display = 'none';

    const ul = document.createElement('ul');
    ul.className = 'eco-custom-select-list';

    function buildOptions() {
      ul.innerHTML = '';
      Array.from(select.options).forEach((opt, idx) => {
        const li = document.createElement('li');
        li.className = 'eco-custom-select-option';
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', opt.value);
        li.setAttribute('data-index', String(idx));
        li.textContent = opt.text;

        if (opt.selected) {
          li.classList.add('selected');
          li.setAttribute('aria-selected', 'true');
        } else {
          li.setAttribute('aria-selected', 'false');
        }

        li.addEventListener('click', (e) => {
          e.stopPropagation();
          selectOption(opt.value, true);
          closeDropdown();
          trigger.focus();
        });

        ul.appendChild(li);
      });
    }

    buildOptions();
    dropdown.appendChild(ul);
    wrapper.appendChild(trigger);
    wrapper.appendChild(dropdown);

    // Insert wrapper directly after native select in DOM
    if (select.parentNode) {
      select.parentNode.insertBefore(wrapper, select.nextSibling);
    }

    let isOpen = false;
    let focusedIndex = select.selectedIndex >= 0 ? select.selectedIndex : 0;

    function openDropdown() {
      // Close all other open custom selects
      document.querySelectorAll('.eco-custom-select-trigger[aria-expanded="true"]').forEach(btn => {
        if (btn !== trigger) {
          btn.setAttribute('aria-expanded', 'false');
          const siblingDrop = btn.parentElement ? btn.parentElement.querySelector('.eco-custom-select-dropdown') : null;
          if (siblingDrop) siblingDrop.style.display = 'none';
        }
      });

      buildOptions();

      // Check available space below vs above
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        wrapper.classList.add('eco-custom-select--dropup');
      } else {
        wrapper.classList.remove('eco-custom-select--dropup');
      }

      dropdown.style.display = 'block';
      trigger.setAttribute('aria-expanded', 'true');
      wrapper.classList.add('is-open');
      isOpen = true;

      // Scroll selected option into view
      const selectedItem = ul.querySelector('.eco-custom-select-option.selected');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }

    function closeDropdown() {
      dropdown.style.display = 'none';
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open');
      wrapper.classList.remove('eco-custom-select--dropup');
      isOpen = false;
      clearOptionFocus();
    }

    function toggleDropdown() {
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }

    function clearOptionFocus() {
      ul.querySelectorAll('.eco-custom-select-option.focused').forEach(el => {
        el.classList.remove('focused');
      });
    }

    function setOptionFocus(idx) {
      clearOptionFocus();
      const items = ul.querySelectorAll('.eco-custom-select-option');
      if (idx >= 0 && idx < items.length) {
        focusedIndex = idx;
        items[idx].classList.add('focused');
        items[idx].scrollIntoView({ block: 'nearest' });
      }
    }

    function selectOption(val, dispatchEvent = true) {
      select.value = val;
      const currentOpt = select.options[select.selectedIndex];
      const newText = currentOpt ? currentOpt.text : '';
      labelSpan.textContent = newText;
      trigger.setAttribute('title', newText);

      ul.querySelectorAll('.eco-custom-select-option').forEach(li => {
        const isMatch = li.getAttribute('data-value') === val;
        li.classList.toggle('selected', isMatch);
        li.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      if (dispatchEvent) {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Trigger click & keyboard
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    trigger.addEventListener('keydown', (e) => {
      const items = ul.querySelectorAll('.eco-custom-select-option');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
          setOptionFocus(select.selectedIndex >= 0 ? select.selectedIndex : 0);
        } else {
          let next = focusedIndex + 1;
          if (next >= items.length) next = 0;
          setOptionFocus(next);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
          setOptionFocus(select.selectedIndex >= 0 ? select.selectedIndex : items.length - 1);
        } else {
          let prev = focusedIndex - 1;
          if (prev < 0) prev = items.length - 1;
          setOptionFocus(prev);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
          setOptionFocus(select.selectedIndex >= 0 ? select.selectedIndex : 0);
        } else {
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            const targetVal = items[focusedIndex].getAttribute('data-value');
            if (targetVal !== null) {
              selectOption(targetVal, true);
              closeDropdown();
            }
          }
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeDropdown();
        trigger.focus();
      } else if (e.key === 'Tab' && isOpen) {
        closeDropdown();
      }
    });

    // Listen to native select change to keep custom trigger in sync
    function syncFromNative() {
      const currentOpt = select.options[select.selectedIndex];
      if (currentOpt) {
        labelSpan.textContent = currentOpt.text;
        trigger.setAttribute('title', currentOpt.text);
        ul.querySelectorAll('.eco-custom-select-option').forEach(li => {
          const isMatch = li.getAttribute('data-value') === currentOpt.value;
          li.classList.toggle('selected', isMatch);
          li.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
      }
    }

    select.addEventListener('change', syncFromNative);
    select._ecoSyncCustomSelect = syncFromNative;

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (isOpen && !wrapper.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  // Auto-initialize on DOM ready
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      initCustomSelects(document);
    });
  }

  // Expose on window for dynamic views & tests
  if (typeof window !== 'undefined') {
    window.EcoCustomSelect = {
      init: initCustomSelects,
      enhance: enhanceSelect
    };
    window.initCustomSelects = initCustomSelects;
  }

})();
