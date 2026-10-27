/**
 * A small, dismissible notice: the browser-library patterns this template shows in one place.
 * Nothing runs at import; styles live in a shadow root so the host page can't restyle it.
 */

export interface NoticeOptions {
  /** Plain text only; it is never parsed as HTML. */
  text: string;
  /** Where to attach the notice. Defaults to document.body. */
  target?: HTMLElement;
  onDismiss?: () => void;
}

export interface Notice {
  element: HTMLElement;
  dismiss: () => void;
}

const STYLES = `
  :host { all: initial; font: 15px/1.4 system-ui, sans-serif; }
  .notice { display: flex; gap: 12px; align-items: center; padding: 12px 16px;
    background: #14202e; color: #fff; border-radius: 12px; }
  button { min-width: 44px; min-height: 44px; border: 0; border-radius: 999px;
    background: transparent; color: inherit; font: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
`;

export function createNotice(options: NoticeOptions): Notice {
  const host = document.createElement('div');
  // Rename data-web after your package when you copy this example.
  host.setAttribute('data-web', '');
  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = STYLES;

  const notice = document.createElement('div');
  notice.className = 'notice';
  notice.setAttribute('role', 'status');

  const message = document.createElement('span');
  message.textContent = options.text;

  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss');
  close.textContent = '×';

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    host.remove();
    options.onDismiss?.();
  };
  close.addEventListener('click', dismiss);

  notice.append(message, close);
  root.append(style, notice);
  (options.target ?? document.body).append(host);

  return { element: host, dismiss };
}
