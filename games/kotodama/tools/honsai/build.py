#!/usr/bin/env python3
"""Build Honsai's word data from the curated district lists and JMdict.

    python3 -I tools/honsai/build.py path/to/jmdict-eng-X.json

The words are chosen by hand (d*_*.txt, one per line, `written` or `written|reading`).
JMdict supplies what is easy to get wrong by hand: the meaning, the part of speech and,
for verbs and adjectives, the conjugation class that the Verb Forge relies on.

JMdict is the property of the Electronic Dictionary Research and Development Group and
is used under CC BY-SA 4.0; the generated file carries that notice and the same licence.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / 'core' / 'src' / 'content' / 'honsai' / 'words.generated.ts'
# Numeric order: d10_ must come after d9_, not after d1_ (ids are counted in list order).
DISTRICTS = sorted(HERE.glob('d*_*.txt'), key=lambda p: int(re.match(r'd(\d+)_', p.name).group(1)))

KANJI = re.compile(r'[一-鿿々]')
KATAKANA_ONLY = re.compile(r'^[゠-ヿー・]+$')
VERB_CLASSES = {
    'v1': 'ichidan', 'v5u': 'u', 'v5k': 'ku', 'v5k-s': 'iku', 'v5g': 'gu', 'v5s': 'su', 'v5t': 'tsu',
    'v5n': 'nu', 'v5b': 'bu', 'v5m': 'mu', 'v5r': 'ru', 'v5r-i': 'aru', 'v5aru': 'ru-aru', 'vk': 'kuru',
    'v1-s': 'ichidan', 'vs-i': 'suru', 'vs-s': 'suru', 'adj-i': 'i-adj', 'adj-ix': 'ii-adj', 'adj-na': 'na-adj',
}
LANG = {'eng': 'English', 'por': 'Portuguese', 'ger': 'German', 'fre': 'French', 'dut': 'Dutch', 'ita': 'Italian'}
MAX_MEANING = 34


def load(path):
    data = json.load(open(path, encoding='utf-8'))
    by_kanji, by_kana = {}, {}
    for e in data['words']:
        for k in e['kanji']:
            by_kanji.setdefault(k['text'], []).append(e)
        for k in e['kana']:
            by_kana.setdefault(k['text'], []).append(e)
    return data, by_kanji, by_kana


def common(e):
    return any(k.get('common') for k in e['kanji']) or any(k.get('common') for k in e['kana'])


def pick(text, reading, by_kanji, by_kana, hint=''):
    """The JMdict entry for this word: exact spelling, matching reading, common first.
    A hint (from the list) picks the entry whose senses mention it: いる "to be" vs 要る."""
    if KANJI.search(text):
        cands = [e for e in by_kanji.get(text, []) if not reading or any(k['text'] == reading for k in e['kana'])]
    else:
        cands = by_kana.get(text, [])
        # Kana-only words: prefer entries usually written in kana, or with no kanji at all.
        cands = sorted(cands, key=lambda e: (not (not e['kanji'] or any('uk' in s['misc'] for s in e['sense']))))
    cands = sorted(cands, key=lambda e: not common(e))
    if hint:
        cands = [e for e in cands if any(hint in g['text'] for s in e['sense'] for g in s['gloss'])]
    return cands[0] if cands else None


def gloss(e, wanted_pos=None, hint=''):
    senses = e['sense']
    if hint:
        senses = [s for s in senses if any(hint in g['text'] for g in s['gloss'])] or senses
    if wanted_pos:
        senses = [s for s in senses if any(p in wanted_pos for p in s['partOfSpeech'])] or senses
    first = senses[0]
    # Long glosses lose their asides ("strawberry (esp. the garden strawberry...)" -> "strawberry").
    words = [g['text'] if len(g['text']) <= MAX_MEANING else re.sub(r'\s*\([^()]*(\([^()]*\)[^()]*)*\)', '', g['text']).strip() for g in first['gloss']]
    out = words[0]
    for w in words[1:3]:
        if len(out) + 2 + len(w) > MAX_MEANING:
            break
        out += '; ' + w
    return out, senses


def classify(senses):
    # Only the sense actually taught decides the class: まだ is an adverb, whatever a later sense says.
    pos = senses[0]['partOfSpeech'] if senses else []
    # An adverb that can also act as a な-adjective (たいてい, すぐ) is taught as an adverb.
    if any(p.startswith('adv') for p in pos):
        pos = [p for p in pos if p != 'adj-na']
    for p in pos:
        if p in VERB_CLASSES:
            return VERB_CLASSES[p]
    return ''


def district_rows(data, missing=None):
    """Rows for the twelve hand-picked districts: [written, reading, meaning, class, kind, origin, district]."""
    by_kanji, by_kana = {}, {}
    for e in data['words']:
        for k in e['kanji']:
            by_kanji.setdefault(k['text'], []).append(e)
        for k in e['kana']:
            by_kana.setdefault(k['text'], []).append(e)
    missing = [] if missing is None else missing
    rows, seen_meaning = [], {}
    for n, path in enumerate(DISTRICTS, start=1):
        for raw in path.read_text(encoding='utf-8').splitlines():
            line = raw.strip()
            if not line or line.startswith('#'):
                continue
            # A trailing ! means "never conjugate": nouns JMdict also lists as な-adjectives (大人).
            noconj = line.endswith('!')
            line = line.rstrip('!')
            parts = line.split('|')
            text, reading = parts[0], parts[1] if len(parts) > 1 else ''
            extra = parts[2] if len(parts) > 2 else ''
            # `hint`, `=meaning`, or `hint=meaning`: pick the sense mentioning hint, then teach `meaning`.
            hint, _, override = extra.partition('=')
            suru = text.endswith('する') and text != 'する'
            base, base_reading = (text[:-2], reading[:-2] if reading else '') if suru else (text, reading)
            e = pick(base, base_reading, by_kanji, by_kana, hint)
            if not e:
                missing.append(f'{path.name}: {line}')
                continue
            if not reading:
                reading = text if not KANJI.search(text) else e['kana'][0]['text'] + ('する' if suru else '')
            if suru:
                meaning, _ = gloss(e, ['vs'])
                meaning = f'to do {meaning}' if not meaning.startswith('to ') else meaning
                cls = 'suru'
            else:
                meaning, senses = gloss(e, None, hint)
                cls = classify(senses)
            if override:
                meaning = override
            if noconj:
                cls = ''
            if KANJI.search(text):
                kind, origin = 'vocab', 'Japanese'
            elif KATAKANA_ONLY.match(text):
                src = [l.get('lang') for s in e['sense'] for l in s.get('languageSource', [])]
                kind, origin = 'loanword', LANG.get(src[0], 'English') if src else 'English'
            else:
                kind, origin = 'native', 'Japanese'
            # No two words may share a meaning: a battle would show two right answers.
            key = meaning.lower()
            if key in seen_meaning:
                missing.append(f'{path.name}: {line}: meaning "{meaning}" is already used by {seen_meaning[key]} (add |=a distinct meaning)')
            seen_meaning[key] = text
            rows.append([text, reading, meaning, cls, kind, origin, n])
    return rows


def kind_of(text, e):
    if KANJI.search(text):
        return 'vocab', 'Japanese'
    if KATAKANA_ONLY.match(text):
        src = [l.get('lang') for s in e['sense'] for l in s.get('languageSource', [])]
        return 'loanword', LANG.get(src[0], 'English') if src else 'English'
    return 'native', 'Japanese'


def library_rows(data, taken):
    """The Great Library (library.txt, chosen by pick_library.py): district 13, one wing each."""
    path = HERE / 'library.txt'
    if not path.exists():
        return []
    sys.path.insert(0, str(HERE))
    import pick_library
    by_id = {e['id']: e for e in data['words']}
    rows = []
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        eid, wing = line.split('\t')
        e = by_id[eid]
        text, reading = pick_library.written(e)
        meaning, senses = gloss(e)
        kind, origin = kind_of(text, e)
        rows.append([text, reading, meaning, classify(senses), kind, origin, 13, int(wing)])
    return rows


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = json.load(open(sys.argv[1], encoding='utf-8'))
    missing = []
    rows = district_rows(data, missing)
    rows += library_rows(data, rows)
    seen = {}
    for r in rows:
        if r[2].lower() in seen:
            missing.append(f'{r[0]}: meaning "{r[2]}" is already used by {seen[r[2].lower()]}')
        seen[r[2].lower()] = r[0]
    if missing:
        print('PROBLEMS:', *missing, sep='\n  ', file=sys.stderr)
        sys.exit(1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    body = ',\n'.join('  ' + json.dumps(r, ensure_ascii=False) for r in rows)
    OUT.write_text(
        '// GENERATED by tools/honsai/build.py from the curated district lists. Do not edit by hand:\n'
        '// change tools/honsai/d*_*.txt and run the script again.\n'
        '//\n'
        f'// Meanings, readings and conjugation classes come from JMdict ({data["dictDate"]}), the property of\n'
        '// the Electronic Dictionary Research and Development Group (https://www.edrdg.org/), used\n'
        '// under the Creative Commons Attribution-ShareAlike 4.0 licence. This file is shared under\n'
        '// the same licence.\n\n'
        '/** [written, reading, meaning, conjugation class, kind, origin, district, library wing] */\n'
        'export type HonsaiRow = [string, string, string, string, string, string, number, number?];\n\n'
        f'export const HONSAI_ROWS: readonly HonsaiRow[] = [\n{body},\n];\n',
        encoding='utf-8',
    )
    print(f'{len(rows)} words written to {OUT.relative_to(HERE.parent.parent)}')


if __name__ == '__main__':
    main()
