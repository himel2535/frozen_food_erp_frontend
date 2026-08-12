const LINE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

function clearTransition(el: HTMLElement | SVGElement) {
  el.style.transition = '';
}

export function animateLinePath(path: SVGPathElement, durationMs = 900, delayMs = 0) {
  const len = path.getTotalLength();
  if (!Number.isFinite(len) || len <= 0) return;

  path.style.transition = 'none';
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  path.getBoundingClientRect();
  path.style.transition = `stroke-dashoffset ${durationMs}ms ${LINE_EASE} ${delayMs}ms`;
  path.style.strokeDashoffset = '0';

  const onEnd = () => {
    clearTransition(path);
    path.style.strokeDasharray = '';
    path.style.strokeDashoffset = '';
  };
  path.addEventListener('transitionend', onEnd, { once: true });
}

export function animateAreaFill(path: SVGPathElement, durationMs = 750, delayMs = 220) {
  path.style.transition = 'none';
  path.style.opacity = '0';
  path.getBoundingClientRect();
  path.style.transition = `opacity ${durationMs}ms ease ${delayMs}ms`;
  path.style.opacity = '1';

  path.addEventListener(
    'transitionend',
    () => {
      clearTransition(path);
      path.style.opacity = '';
    },
    { once: true },
  );
}

export function animateDonutArc(
  circle: SVGCircleElement,
  targetLength: number,
  circumference: number,
  durationMs = 850,
  delayMs = 0,
) {
  circle.style.transition = 'none';
  circle.setAttribute('stroke-dasharray', `0 ${circumference}`);
  circle.getBoundingClientRect();
  circle.style.transition = `stroke-dasharray ${durationMs}ms ${LINE_EASE} ${delayMs}ms`;
  circle.setAttribute('stroke-dasharray', `${targetLength} ${circumference - targetLength}`);

  circle.addEventListener(
    'transitionend',
    () => {
      clearTransition(circle);
    },
    { once: true },
  );
}

export function animateBarRect(
  rect: SVGRectElement,
  targetHeight: number,
  baseY: number,
  durationMs = 700,
  delayMs = 0,
) {
  rect.setAttribute('height', '0');
  rect.setAttribute('y', String(baseY));
  rect.style.transition = 'none';
  rect.getBoundingClientRect();
  rect.style.transition = `all ${durationMs}ms ${LINE_EASE} ${delayMs}ms`;
  rect.setAttribute('height', String(targetHeight));
  rect.setAttribute('y', String(baseY - targetHeight));

  rect.addEventListener(
    'transitionend',
    () => {
      clearTransition(rect);
    },
    { once: true },
  );
}

export function runDonutArcMotion(
  svg: SVGSVGElement | null,
  selector: string,
  staggerMs = 70,
) {
  if (!svg) return;
  const circles = svg.querySelectorAll<SVGCircleElement>(selector);
  circles.forEach((circle, index) => {
    const length = Number(circle.dataset.arcLength ?? '0');
    const circumference = Number(circle.dataset.circumference ?? '0');
    if (!circumference) return;
    animateDonutArc(circle, length, circumference, 850, index * staggerMs);
  });
}
