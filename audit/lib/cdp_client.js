/**
 * EcoTrack Master Audit Runner - Lightweight CDP Client
 * Communicates with Chrome/Edge DevTools Protocol using native Node.js WebSocket.
 */

const http = require('http');

class CDPClient {
  constructor(port = 9222) {
    this.port = port;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.networkLogs = [];
    this.consoleLogs = [];
  }

  async connect(targetFilter = null) {
    // 1. Get targets from /json
    const targets = await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${this.port}/json`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse targets: ${e.message}`));
          }
        });
      });
      req.on('error', reject);
    });

    const pageTarget = targetFilter
      ? targets.find(targetFilter)
      : targets.find(t => t.type === 'page');

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No inspectable page target found in browser');
    }

    // 2. Connect native WebSocket
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve: res, reject: rej } = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
            else res(msg.result);
          } else if (msg.method === 'Network.responseReceived') {
            this.networkLogs.push({
              url: msg.params.response.url,
              status: msg.params.response.status,
              mimeType: msg.params.response.mimeType
            });
          } else if (msg.method === 'Network.loadingFailed') {
            this.networkLogs.push({
              url: msg.params.url,
              status: 'FAILED',
              errorText: msg.params.errorText
            });
          } else if (msg.method === 'Log.entryAdded') {
            this.consoleLogs.push({
              level: msg.params.entry.level,
              text: msg.params.entry.text,
              source: msg.params.entry.source,
              timestamp: msg.params.entry.timestamp
            });
          } else if (msg.method === 'Runtime.consoleAPICalled') {
            this.consoleLogs.push({
              level: msg.params.type,
              text: msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' ')
            });
          } else if (msg.method === 'Runtime.exceptionThrown') {
            this.consoleLogs.push({
              level: 'error',
              text: msg.params.exceptionDetails.text + (msg.params.exceptionDetails.exception ? ' ' + msg.params.exceptionDetails.exception.description : '')
            });
          }
        } catch (_) {}
      };
    });

    // 3. Enable essential domains
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
    await this.send('Log.enable');
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== 1) {
        return reject(new Error('WebSocket not connected'));
      }
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url, timeoutMs = 20000) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(); // resolve on timeout to prevent deadlock
      }, timeoutMs);

      const onMsg = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Page.loadEventFired') {
            clearTimeout(timer);
            this.ws.removeEventListener('message', onMsg);
            setTimeout(resolve, 300); // short settle buffer
          }
        } catch (_) {}
      };

      this.ws.addEventListener('message', onMsg);
      try {
        await this.send('Page.navigate', { url });
      } catch (err) {
        clearTimeout(timer);
        this.ws.removeEventListener('message', onMsg);
        reject(err);
      }
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await new Promise(r => setTimeout(r, 200));
  }

  async captureScreenshot(outputPath) {
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
  }

  async click(selector) {
    const found = await this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el) {
          el.scrollIntoView({ block: 'center', inline: 'center' });
          el.click();
          return true;
        }
        return false;
      })()
    `);
    if (!found) throw new Error(`Element not found for click: ${selector}`);
    await new Promise(r => setTimeout(r, 200));
  }

  async type(selector, text) {
    const found = await this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el) {
          el.focus();
          el.value = ${JSON.stringify(text)};
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      })()
    `);
    if (!found) throw new Error(`Element not found for type: ${selector}`);
    await new Promise(r => setTimeout(r, 100));
  }

  async dispatchKey(type, key, code, keyCode) {
    await this.send('Input.dispatchKeyEvent', {
      type,
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode
    });
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
  }
}

module.exports = { CDPClient };
