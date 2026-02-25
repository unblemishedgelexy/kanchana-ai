'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
}

const EDGE_PADDING = 12;
const TOOLTIP_HEIGHT = 34;

const getTooltipTarget = (eventTarget: EventTarget | null): HTMLElement | null => {
  if (!(eventTarget instanceof Element)) return null;

  const element = eventTarget.closest<HTMLElement>(
    '[data-tooltip], button[aria-label], [role="button"][aria-label], [title]'
  );

  if (!element) return null;

  const text =
    element.getAttribute('data-tooltip') ||
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    '';

  if (!text.trim()) return null;
  return element;
};

const getTooltipText = (element: HTMLElement): string => {
  return (
    element.getAttribute('data-tooltip') ||
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    ''
  ).trim();
};

const getTooltipPosition = (clientX: number, clientY: number, text: string) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const estimatedWidth = Math.max(84, Math.min(260, text.length * 8 + 36));

  let x = clientX + 16;
  let y = clientY - 14;

  if (x + estimatedWidth > viewportWidth - EDGE_PADDING) {
    x = clientX - estimatedWidth - 16;
  }

  if (x < EDGE_PADDING) {
    x = EDGE_PADDING;
  }

  if (y < EDGE_PADDING) {
    y = clientY + 18;
  }

  if (y + TOOLTIP_HEIGHT > viewportHeight - EDGE_PADDING) {
    y = viewportHeight - TOOLTIP_HEIGHT - EDGE_PADDING;
  }

  return { x, y };
};

const GlobalIconTooltip: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    setMounted(true);

    const showPointerTooltip = (event: PointerEvent) => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return;
      }

      const target = getTooltipTarget(event.target);
      if (!target) {
        setTooltip((previous) => (previous.visible ? { ...previous, visible: false } : previous));
        return;
      }

      const text = getTooltipText(target);
      if (!text) return;

      const position = getTooltipPosition(event.clientX, event.clientY, text);
      setTooltip({
        text,
        x: position.x,
        y: position.y,
        visible: true,
      });
    };

    const showFocusTooltip = (event: FocusEvent) => {
      const target = getTooltipTarget(event.target);
      if (!target) return;

      const text = getTooltipText(target);
      if (!text) return;

      const rect = target.getBoundingClientRect();
      const position = getTooltipPosition(rect.right, rect.top + rect.height / 2, text);
      setTooltip({
        text,
        x: position.x,
        y: position.y,
        visible: true,
      });
    };

    const hideTooltip = () => {
      setTooltip((previous) => (previous.visible ? { ...previous, visible: false } : previous));
    };

    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip();
      }
    };

    window.addEventListener('pointermove', showPointerTooltip, true);
    window.addEventListener('focusin', showFocusTooltip, true);
    window.addEventListener('focusout', hideTooltip, true);
    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('keydown', hideOnEscape, true);

    return () => {
      window.removeEventListener('pointermove', showPointerTooltip, true);
      window.removeEventListener('focusin', showFocusTooltip, true);
      window.removeEventListener('focusout', hideTooltip, true);
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('keydown', hideOnEscape, true);
    };
  }, []);

  if (!mounted || !tooltip.visible || !tooltip.text) {
    return null;
  }

  return createPortal(
    <div
      className="fixed px-3.5 py-1.5 rounded-lg bg-black/92 text-[10px] text-white uppercase tracking-[0.16em] border border-white/15 pointer-events-none z-[9999] whitespace-nowrap shadow-2xl shadow-black/70"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {tooltip.text}
    </div>,
    document.body
  );
};

export default GlobalIconTooltip;
