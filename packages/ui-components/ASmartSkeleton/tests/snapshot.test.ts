import { afterEach, describe, expect, it, vi } from 'vitest';
import { autoKey, fill, restore, serialize } from '../src/core/snapshot';
import { checkNonce, sampleFrom } from '../src/core/dev';

const mount = (html: string) => {
  const element = document.body.appendChild(document.createElement('div'));
  element.innerHTML = html;
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('serialize', () => {
  it('keeps nothing that runs or loads', () => {
    const html = serialize(
      mount(
        `<img src="/a.png" srcset="/b.png 2x" onerror="alert(1)"><a href="javascript:alert(1)">x</a><script>alert(1)</script><iframe src="/x"></iframe>`
      ),
      false
    );

    expect(html).not.toMatch(/script|onerror|javascript:|src=|srcset|iframe/);
  });

  it('replaces text with filler when asked', () => {
    const html = serialize(mount(`<p>Ada Lovelace, 1815</p>`), true);
    expect(html).toContain('Xxx Xxxxxxxx, 0000');
    expect(html).not.toContain('Ada');
  });

  it('keeps real text otherwise', () => {
    expect(serialize(mount(`<p>Ada</p>`), false)).toContain('Ada');
  });

  it('drops form values', () => {
    const html = serialize(mount(`<input value="secret">`), false);
    expect(html).not.toContain('secret');
  });

  it('drops legacy URL-bearing attrs', () => {
    const html = serialize(
      mount(
        `<button formaction="/x" formtarget="_top">x</button><body background="/y"><a ping="/z">p</a>`
      ),
      false
    );
    expect(html).not.toMatch(/formaction|formtarget|background=|ping=/);
  });

  it('drops a style attribute with a javascript url or expression', () => {
    const html = serialize(
      mount(
        `<div style="background: url(javascript:alert(1))">a</div><div style="width: expression(alert(1))">b</div><div style="color: red">c</div>`
      ),
      false
    );
    expect(html).not.toMatch(/javascript:|expression\(/);
    expect(html).toContain('color: red');
  });

  it('drops data: href values', () => {
    const html = serialize(
      mount(`<a href="data:text/html,<script>alert(1)</script>">x</a>`),
      false
    );
    expect(html).not.toContain('data:text/html');
  });
});

describe('restore', () => {
  it('sanitizes markup it did not write', () => {
    const fragment = restore(`<img src=x onerror="alert(1)"><script>1</script>`);
    const holder = document.createElement('div');
    holder.append(fragment);

    expect(holder.innerHTML).toBe(`<img alt="">`);
  });
});

describe('autoKey', () => {
  it('matches markup with and without its data', () => {
    const loaded = mount(`<div class="card"><span>Ada</span><b>1</b></div>`);
    const empty = mount(`<div class="card"><span></span><b></b></div>`);
    expect(autoKey(loaded)).toBe(autoKey(empty));
  });

  it('tells different shapes apart', () => {
    const a = mount(`<div class="card"><span></span></div>`);
    const b = mount(`<div class="row"><span></span></div>`);
    expect(autoKey(a)).not.toBe(autoKey(b));
  });

  it('has nothing to key on an empty element', () => {
    expect(autoKey(mount(''))).toBeNull();
  });
});

describe('checkNonce', () => {
  it('warns once when a page has a restrictive CSP and no nonce is passed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', "default-src 'self'; script-src 'self'");
    document.head.appendChild(meta);

    checkNonce(undefined);
    checkNonce(undefined);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toMatch(/nonce/i);

    meta.remove();
    warn.mockRestore();
  });

  it('stays quiet when a nonce was passed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', "default-src 'self'; script-src 'self'");
    document.head.appendChild(meta);

    checkNonce('abc');

    expect(warn).not.toHaveBeenCalled();

    meta.remove();
    warn.mockRestore();
  });

  it('stays quiet when CSP allows unsafe-inline', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', "script-src 'self' 'unsafe-inline'");
    document.head.appendChild(meta);

    checkNonce(undefined);

    expect(warn).not.toHaveBeenCalled();

    meta.remove();
    warn.mockRestore();
  });
});

describe('sampleFrom', () => {
  it('keeps keys and lengths, never values', () => {
    expect(
      sampleFrom({
        name: 'Ada Lovelace',
        avatar: 'https://example.com/ada.png',
        age: 36,
        tags: ['Maths'],
      })
    ).toEqual({ name: 'Xxx Xxxxxxxx', avatar: '', age: 36, tags: ['Xxxxx'] });
  });

  it('fills digits', () => {
    expect(fill('$12.50')).toBe('$00.00');
  });
});
