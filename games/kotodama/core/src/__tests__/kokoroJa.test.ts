import { describe, expect, it } from 'vitest';
import { KANA, NATIVE_WORDS, PHRASES, TALES, TALE_PASSAGES, WORDS, kanaToPhonemes, kokoroTokens, phonemesToIds } from '../index';
import { VOCAB } from '../speech/kokoroTables';

describe('kana to Kokoro phonemes', () => {
  it('maps single kana as flashcards, not particles', () => {
    expect(kanaToPhonemes('か')).toBe('ka');
    expect(kanaToPhonemes('は')).toBe('ha');
    expect(kanaToPhonemes('へ')).toBe('he');
    expect(kanaToPhonemes('し')).toBe('ɕi');
    expect(kanaToPhonemes('つ')).toBe('ʦɨ');
    expect(kanaToPhonemes('ん')).toBe('ɴ');
  });

  it('joins combined sounds', () => {
    expect(kanaToPhonemes('きゃ')).toBe('kʲa');
    expect(kanaToPhonemes('しゅ')).toBe('ɕɨ');
    expect(kanaToPhonemes('ちょ')).toBe('ʨo');
  });

  it('makes long vowels the way they are spoken', () => {
    expect(kanaToPhonemes('きょう')).toBe('kʲoː');
    expect(kanaToPhonemes('がっこう')).toBe('ɡaʔkoː');
    expect(kanaToPhonemes('せんせい')).toBe('seɴseː');
    expect(kanaToPhonemes('おかあさん')).toBe('okaːsaɴ');
    expect(kanaToPhonemes('おおきい')).toBe('oːkʲiː');
    expect(kanaToPhonemes('くうき')).toBe('kɯːkʲi');
    expect(kanaToPhonemes('りゅうぐうじょう')).toBe('ɾʲɨːɡɯːʥoː');
  });

  it('keeps two beats where the vowels are separate', () => {
    expect(kanaToPhonemes('おもう')).toBe('omoɯ'); // a verb: o-mo-u
    expect(kanaToPhonemes('たべている')).toBe('tabeteiɾɯ'); // て-form + いる
    expect(kanaToPhonemes('あい')).toBe('ai');
    expect(kanaToPhonemes('いえ')).toBe('ie');
  });

  it('assimilates ん to the sound after it', () => {
    expect(kanaToPhonemes('さんぽ')).toBe('sampo');
    expect(kanaToPhonemes('ぎんこう')).toBe('ɡʲiŋkoː');
    expect(kanaToPhonemes('こんにちは')).toBe('koɲɲiʨiβa');
    expect(kanaToPhonemes('みんな')).toBe('mʲinna');
    expect(kanaToPhonemes('ほん')).toBe('hoɴ');
  });

  it('reads katakana and the long-vowel mark', () => {
    expect(kanaToPhonemes('コーヒー')).toBe('koːçiː');
    expect(kanaToPhonemes('カメラ')).toBe('kameɾa');
  });

  it('speaks particles as their own word in a spaced sentence', () => {
    expect(kanaToPhonemes('おばあさんは かわで ももを みつけました。')).toBe('obaːsaɴ βa kaβade momo o mʲiʦɨkemaɕita.');
    expect(kanaToPhonemes('やまへ いきます')).toBe('jama e ikʲimasɨ');
    expect(kanaToPhonemes('これは なに？')).toBe('koɾe βa naɲi?');
  });

  it('keeps punctuation and quotes', () => {
    expect(kanaToPhonemes('おには 「まいった！」 と いいました。')).toBe('oɲi βa “maiʔta!” to iːmaɕita.');
    expect(kanaToPhonemes('むかし むかし、 ある ところに')).toBe('mɯkaɕi mɯkaɕi, aɾɯ tokoɾoɲi');
  });

  it('refuses what it cannot read reliably', () => {
    expect(kanaToPhonemes('日本')).toBeNull(); // kanji
    expect(kanaToPhonemes('きょうは日よう日')).toBeNull();
    expect(kanaToPhonemes('abc')).toBeNull();
    expect(kanaToPhonemes('')).toBeNull();
    expect(kanaToPhonemes('。')).toBeNull();
    // No spaces: は could be "ha" or the particle.
    expect(kanaToPhonemes('わたしはまいにちがっこうへいきます')).toBeNull();
  });

  it('pads token ids with 0 and uses only the model alphabet', () => {
    expect(phonemesToIds('ka')).toEqual([0, VOCAB.k, VOCAB.a, 0]);
    expect(kokoroTokens('日本')).toBeNull();
    expect(kokoroTokens('か')).toEqual([0, VOCAB.k, VOCAB.a, 0]);
  });

  it('converts every kana, native word, phrase and tale page', () => {
    const lines = [
      ...KANA.map((k) => k.char),
      ...NATIVE_WORDS.map((w) => w.text),
      ...WORDS.filter((w) => w.kind === 'loanword').map((w) => w.text),
      ...PHRASES.map((p) => p.text),
      ...TALES.flatMap((t) => [t.titleJa, ...t.pages.map((p) => p.ja)]),
      ...TALE_PASSAGES.map((p) => p.text),
    ];
    expect(lines.length).toBeGreaterThan(350);
    const failed = lines.filter((line) => {
      const ps = kanaToPhonemes(line);
      return !ps || [...ps].some((ch) => VOCAB[ch] === undefined) || !kokoroTokens(line);
    });
    expect(failed).toEqual([]);
  });
});
