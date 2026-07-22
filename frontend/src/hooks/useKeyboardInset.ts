import { useEffect } from "react";

/**
 * Keeps a `--keyboard-inset` CSS variable on the document root in sync with the
 * height of the on-screen keyboard (via the visualViewport API). Elements fixed
 * to the bottom can use `bottom: var(--keyboard-inset, 0)` to stay visible above
 * the keyboard on browsers that don't resize the layout viewport (e.g. iOS).
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    const update = () => {
      // Space hidden below the visual viewport (i.e. the keyboard height).
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--keyboard-inset", `${inset}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);
}
