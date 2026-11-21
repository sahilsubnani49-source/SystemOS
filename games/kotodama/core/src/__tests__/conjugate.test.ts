import { describe, expect, it } from 'vitest';
import { conjugate, ruleNote, wrongForms, type Form } from '../content/honsai/conjugate';
import type { ConjClass } from '../content/honsai/words';

const c = (text: string, reading: string, cls: ConjClass, form: Form) => conjugate(text, reading, cls, form);

describe('Verb Forge conjugation', () => {
  // [written, reading, class, form, expected written, expected reading]
  const cases: [string, string, ConjClass, Form, string, string][] = [
    ['食べる', 'たべる', 'ichidan', 'masu', '食べます', 'たべます'],
    ['食べる', 'たべる', 'ichidan', 'te', '食べて', 'たべて'],
    ['食べる', 'たべる', 'ichidan', 'nai', '食べない', 'たべない'],
    ['食べる', 'たべる', 'ichidan', 'potential', '食べられる', 'たべられる'],
    ['書く', 'かく', 'ku', 'masu', '書きます', 'かきます'],
    ['書く', 'かく', 'ku', 'te', '書いて', 'かいて'],
    ['書く', 'かく', 'ku', 'ta', '書いた', 'かいた'],
    ['書く', 'かく', 'ku', 'nai', '書かない', 'かかない'],
    ['書く', 'かく', 'ku', 'potential', '書ける', 'かける'],
    ['書く', 'かく', 'ku', 'volitional', '書こう', 'かこう'],
    ['書く', 'かく', 'ku', 'passive', '書かれる', 'かかれる'],
    ['書く', 'かく', 'ku', 'causative', '書かせる', 'かかせる'],
    ['書く', 'かく', 'ku', 'ba', '書けば', 'かけば'],
    ['泳ぐ', 'およぐ', 'gu', 'te', '泳いで', 'およいで'],
    ['泳ぐ', 'およぐ', 'gu', 'ta', '泳いだ', 'およいだ'],
    ['話す', 'はなす', 'su', 'te', '話して', 'はなして'],
    ['話す', 'はなす', 'su', 'masu', '話します', 'はなします'],
    ['待つ', 'まつ', 'tsu', 'te', '待って', 'まって'],
    ['待つ', 'まつ', 'tsu', 'masu', '待ちます', 'まちます'],
    ['死ぬ', 'しぬ', 'nu', 'te', '死んで', 'しんで'],
    ['遊ぶ', 'あそぶ', 'bu', 'te', '遊んで', 'あそんで'],
    ['飲む', 'のむ', 'mu', 'te', '飲んで', 'のんで'],
    ['飲む', 'のむ', 'mu', 'ta', '飲んだ', 'のんだ'],
    ['帰る', 'かえる', 'ru', 'te', '帰って', 'かえって'],
    ['帰る', 'かえる', 'ru', 'masu', '帰ります', 'かえります'],
    ['買う', 'かう', 'u', 'nai', '買わない', 'かわない'],
    ['買う', 'かう', 'u', 'te', '買って', 'かって'],
    ['行く', 'いく', 'iku', 'te', '行って', 'いって'],
    ['行く', 'いく', 'iku', 'ta', '行った', 'いった'],
    ['行く', 'いく', 'iku', 'masu', '行きます', 'いきます'],
    ['ある', 'ある', 'aru', 'nai', 'ない', 'ない'],
    ['ある', 'ある', 'aru', 'nakatta', 'なかった', 'なかった'],
    ['ある', 'ある', 'aru', 'masu', 'あります', 'あります'],
    ['来る', 'くる', 'kuru', 'masu', '来ます', 'きます'],
    ['来る', 'くる', 'kuru', 'nai', '来ない', 'こない'],
    ['来る', 'くる', 'kuru', 'te', '来て', 'きて'],
    ['来る', 'くる', 'kuru', 'ba', '来れば', 'くれば'],
    ['来る', 'くる', 'kuru', 'volitional', '来よう', 'こよう'],
    ['する', 'する', 'suru', 'masu', 'します', 'します'],
    ['する', 'する', 'suru', 'potential', 'できる', 'できる'],
    ['勉強する', 'べんきょうする', 'suru', 'mashita', '勉強しました', 'べんきょうしました'],
    ['勉強する', 'べんきょうする', 'suru', 'te', '勉強して', 'べんきょうして'],
    ['高い', 'たかい', 'i-adj', 'adj-nai', '高くない', 'たかくない'],
    ['高い', 'たかい', 'i-adj', 'adj-ta', '高かった', 'たかかった'],
    ['高い', 'たかい', 'i-adj', 'adj-nakatta', '高くなかった', 'たかくなかった'],
    ['いい', 'いい', 'ii-adj', 'adj-nai', 'よくない', 'よくない'],
    ['いい', 'いい', 'ii-adj', 'adj-ta', 'よかった', 'よかった'],
    ['良い', 'よい', 'i-adj', 'adj-ta', '良かった', 'よかった'],
    ['静か', 'しずか', 'na-adj', 'adj-nai', '静かじゃない', 'しずかじゃない'],
    ['静か', 'しずか', 'na-adj', 'adj-ta', '静かだった', 'しずかだった'],
    ['静か', 'しずか', 'na-adj', 'adj-te', '静かで', 'しずかで'],
    ['読む', 'よむ', 'mu', 'teiru', '読んでいる', 'よんでいる'],
    ['行く', 'いく', 'iku', 'teiru', '行っている', 'いっている'],
    ['来る', 'くる', 'kuru', 'teiru', '来ている', 'きている'],
    ['書く', 'かく', 'ku', 'tara', '書いたら', 'かいたら'],
    ['する', 'する', 'suru', 'tara', 'したら', 'したら'],
    ['食べる', 'たべる', 'ichidan', 'tara', '食べたら', 'たべたら'],
    ['帰る', 'かえる', 'ru', 'ba', '帰れば', 'かえれば'],
  ];
  it.each(cases)('%s (%s, %s) %s → %s', (text, reading, cls, form, wantText, wantReading) => {
    expect(c(text, reading, cls, form)).toEqual({ text: wantText, reading: wantReading });
  });

  it('wrong answers are plausible, distinct and never the right one', () => {
    for (const [text, reading, cls, form] of cases) {
      const right = c(text, reading, cls, form).text;
      const wrong = wrongForms(text, reading, cls, form);
      expect(wrong.length, `${text} ${form}`).toBeGreaterThanOrEqual(3);
      expect(wrong).not.toContain(right);
      expect(new Set(wrong).size).toBe(wrong.length);
    }
    expect(wrongForms('書く', 'かく', 'ku', 'te')).toEqual(expect.arrayContaining(['書んで', '書して']));
  });

  it('explains the rule, special cases included', () => {
    expect(ruleNote('iku', 'te')).toContain('行って');
    expect(ruleNote('ichidan', 'masu')).toContain('drop る');
    expect(ruleNote('ku', 'te')).toContain('く→いて');
  });
});
