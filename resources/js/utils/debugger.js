// Client-side debugger utility: captures global errors, unhandled rejections,
// and console.error calls and POSTs them to the server for inspection.

export function initClientDebugger({enabled = true} = {}) {
  if (!enabled) return;

  const getUser = () => {
    try {
      const u = localStorage.getItem('user') || localStorage.getItem('admin_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  };

  const send = async (payload) => {
    try {
      await fetch('/api/debug/client-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // don't throw during logging
      // eslint-disable-next-line no-console
      console.warn('client-debug: failed to send log', e);
    }
  };

  window.addEventListener('error', (ev) => {
    const payload = {
      type: 'error',
      message: ev.message,
      filename: ev.filename,
      lineno: ev.lineno,
      colno: ev.colno,
      stack: ev.error ? ev.error.stack : null,
      url: window.location.href,
      user: getUser(),
      ua: navigator.userAgent,
      ts: new Date().toISOString(),
    };
    send(payload);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    const payload = {
      type: 'unhandledrejection',
      message: reason?.message || String(reason),
      stack: reason?.stack || null,
      url: window.location.href,
      user: getUser(),
      ua: navigator.userAgent,
      ts: new Date().toISOString(),
    };
    send(payload);
  });

  // wrap console.error to forward logs
  const origConsoleError = console.error.bind(console);
  console.error = (...args) => {
    try {
      const argsStr = args.map((a) => {
        if (a instanceof Error) return { message: a.message, stack: a.stack };
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch (e) { return String(a); }
      });
      const payload = {
        type: 'console.error',
        args: argsStr,
        url: window.location.href,
        user: getUser(),
        ua: navigator.userAgent,
        ts: new Date().toISOString(),
      };
      send(payload);
    } catch (e) {
      // ignore
    }
    origConsoleError(...args);
  };

  return { send };
}

export async function sendClientLog(payload) {
  try {
    await fetch('/api/debug/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // swallow
  }
}
