import { describe, expect, it } from 'vitest';
import { KANA, acceptsRomaji, getKana, kanaWhere, lookalikesOf } from '../content/kana';

describe('kana table', () => {
  it('has the full gojūon, voiced and combined sets for both scripts', () => {
    for (const script of ['hiragana', 'katakana'] as const) {
      expect(kanaWhere({ script, kind: 'basic' })).toHaveLength(46);
      expect(kanaWhere({ script, kind: 'dakuten' })).toHaveLength(25);
      expect(kanaWhere({ script, kind: 'yoon' })).toHaveLength(33);
    }
  });

  it('uses unique ids and unique characters', () => {
    expect(new Set(KANA.map((k) => k.id)).size).toBe(KANA.length);
    expect(new Set(KANA.map((k) => k.char)).size).toBe(KANA.length);
  });

  it('accepts common alternative spellings when typing', () => {
    expect(acceptsRomaji(getKana('h-shi'), 'si')).toBe(true);
    expect(acceptsRomaji(getKana('h-shi'), ' SHI ')).toBe(true);
    expect(acceptsRomaji(getKana('h-wo'), 'o')).toBe(true);
    expect(acceptsRomaji(getKana('h-sha'), 'sya')).toBe(true);
    expect(acceptsRomaji(getKana('h-ka'), 'ga')).toBe(false);
  });

  it('gives ぢ/づ their own ids even though they read ji/zu', () => {
    expect(getKana('h-di').char).toBe('ぢ');
    expect(getKana('h-du').char).toBe('づ');
    expect(getKana('h-ji').char).toBe('じ');
  });

  it('knows real look-alikes', () => {
    expect(lookalikesOf('ぬ')).toContain('め');
    expect(lookalikesOf('シ')).toContain('ツ');
    expect(lookalikesOf('ぬ')).not.toContain('ぬ');
  });
});
