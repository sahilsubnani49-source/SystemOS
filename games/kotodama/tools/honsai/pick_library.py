#!/usr/bin/env python3
"""Choose the Great Library's words from JMdict's common words.

    python3 -I tools/honsai/pick_library.py path/to/jmdict-eng-X.json path/to/kanjidic2-en-X.json [target]

The twelve districts are hand-picked. The Library tops Honsai up to its 5,000-word goal
with JMdict entries marked common, filtered to everyday words (no archaic, slang,
specialist or honorific senses, no set phrases, no affixes) and never repeating a
district word or meaning. JMdict marks ~22,000 words common but does not rank them, so
words are ranked by their rarest kanji's newspaper frequency (KANJIDIC2, same licence):
a word written only with everyday kanji comes before one that needs a rare kanji.

Writes library.txt: one `<JMdict id>\t<wing>` per line. The file is APPEND-ONLY: ids
already in it are kept in place (saved review progress is keyed by position-derived
ids), and new words are only ever added at the end. build.py turns it into word rows.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build  # noqa: E402  (the same gloss, class and kana rules as the districts)

LIBRARY = HERE / 'library.txt'
WING_SIZE = 210

ALLOWED_POS = {'n', 'adj-i', 'adj-na', 'adv', 'adv-to', 'v1', 'v5u', 'v5k', 'v5g', 'v5s', 'v5t', 'v5n', 'v5b', 'v5m', 'v5r', 'vs'}
BANNED_POS = {'exp', 'prt', 'aux', 'aux-v', 'aux-adj', 'pref', 'suf', 'n-suf', 'n-pref', 'ctr', 'pn', 'int', 'cop',
              'n-pr', 'unc', 'num', 'conj', 'adj-pn', 'vs-c', 'v5k-s', 'v5r-i', 'v5aru', 'vk', 'vs-i', 'vs-s', 'adj-ix', 'vz'}
BANNED_MISC = {'arch', 'obs', 'rare', 'vulg', 'sl', 'derog', 'X', 'm-sl', 'net-sl', 'col', 'hon', 'hum', 'pol', 'yoji',
               'proverb', 'id', 'abbr', 'joc', 'dated', 'sens', 'euph', 'poet', 'male', 'fem', 'chn', 'on-mim', 'form',
               'obsc', 'arch', 'Buddh', 'char', 'company', 'given', 'surname', 'place', 'person', 'product', 'work'}
BAD_KANJI_TAGS = {'iK', 'oK', 'rK', 'ateji', 'sK', 'io'}
# Grammar words taught elsewhere, letters of the alphabet, and one with an adult meaning.
BANNED_TEXT = {'ない', 'される', 'する', 'いる', 'ある', 'なる', 'エッチ', 'エス', 'エム', 'エル', 'ビー', 'シー', 'ディー'}
JAPANESE = re.compile(r'^[ぁ-ゖァ-ヺー一-鿿々]+$')
MAX_LOAN, MAX_KANA = 360, 180


def written(e):
    """The spelling a learner meets: a common, untagged kanji form unless usually kana."""
    usually_kana = any('uk' in s['misc'] for s in e['sense'][:1])
    kanji = [k for k in e['kanji'] if k.get('common') and not (set(k['tags']) & BAD_KANJI_TAGS)]
    kana = [k for k in e['kana'] if not (set(k['tags']) & BAD_KANJI_TAGS)]
    if kanji and not usually_kana:
        text = kanji[0]['text']
        fits = [k for k in kana if '*' in k['appliesToKanji'] or text in k['appliesToKanji']]
        fits.sort(key=lambda k: not k.get('common'))
        return (text, fits[0]['text']) if fits else (None, None)
    kana.sort(key=lambda k: not k.get('common'))
    return (kana[0]['text'], kana[0]['text']) if kana else (None, None)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    target = int(sys.argv[3]) if len(sys.argv) > 3 else 3150
    data = json.load(open(sys.argv[1], encoding='utf-8'))
    freq = {c['literal']: c['misc']['frequency'] for c in json.load(open(sys.argv[2], encoding='utf-8'))['characters'] if c['misc'].get('frequency')}
    rows = build.district_rows(data)
    # 輸出する is a district word, so the noun 輸出 is taken too.
    taken_text = {r[0] for r in rows} | {r[1] for r in rows} | {r[0][:-2] for r in rows if r[0].endswith('する')} | {r[1][:-2] for r in rows if r[1].endswith('する')}
    seen_meaning = {r[2].lower() for r in rows}
    known_kanji = {c for r in rows for c in r[0] if build.KANJI.match(c)}

    kept = []
    if LIBRARY.exists():
        kept = [l.split('\t') for l in LIBRARY.read_text(encoding='utf-8').splitlines() if l.strip()]
    by_id = {e['id']: e for e in data['words']}
    for eid, _ in kept:
        e = by_id[eid]
        text, reading = written(e)
        taken_text |= {text, reading}
        seen_meaning.add(build.gloss(e)[0].lower())
    kept_ids = {eid for eid, _ in kept}

    cands = []
    for e in data['words']:
        if e['id'] in kept_ids or not build.common(e) or not e['sense']:
            continue
        s0 = e['sense'][0]
        pos = set(s0['partOfSpeech'])
        if not pos & ALLOWED_POS or pos & BANNED_POS:
            continue
        if set(s0['misc']) & BANNED_MISC or s0['field'] or s0['dialect']:
            continue
        text, reading = written(e)
        if not text or not reading:
            continue
        if not JAPANESE.match(text) or text in BANNED_TEXT:
            continue
        kanji = [c for c in text if build.KANJI.match(c) and c != '々']
        # Every kanji must be one of the ~2,500 in newspaper use; at most three of them.
        if any(c not in freq for c in kanji) or len(kanji) > 3:
            continue
        has_kanji = bool(kanji)
        if (has_kanji and len(text) > 4) or (not has_kanji and len(text) > 6) or len(reading) > 8:
            continue
        forms = {k['text'] for k in e['kanji']} | {k['text'] for k in e['kana']}
        if forms & taken_text:
            continue
        meaning, senses = build.gloss(e)
        first = meaning.split(';')[0]
        if len(first) < 3 or not re.match(r'^[\x20-\x7e]+$', meaning):
            continue
        # A noun whose first gloss is a verb ("to fix") would look like a verb with no conjugation.
        if meaning.startswith('to ') and build.classify(senses) == '':
            continue
        # Rank: the rarest kanji's frequency in 250-wide bands, then fewer kanji, then known kanji.
        rarest = max((freq[c] for c in kanji), default=0)
        unknown = (rarest // 250, len(kanji) if kanji else 9, sum(1 for c in kanji if c not in known_kanji))
        kind = 'verb' if build.classify(senses) not in ('', 'i-adj', 'na-adj') else \
            'adj' if build.classify(senses) in ('i-adj', 'na-adj') else \
            'adv' if pos & {'adv', 'adv-to'} else \
            'loan' if build.KATAKANA_ONLY.match(text) else 'noun'
        cands.append((unknown, -min(len(e['sense']), 6), len(text), e['id'], e, text, reading, meaning, kind))
    cands.sort(key=lambda c: c[:4])
    # Kana-only words and loanwords have no kanji to rank by: keep the most-used (most senses) few.
    loans = sorted([c for c in cands if c[8] == 'loan'], key=lambda c: (c[1], c[2], c[3]))[:MAX_LOAN]
    kana = sorted([c for c in cands if c[8] != 'loan' and not build.KANJI.search(c[5])], key=lambda c: (c[1], c[2], c[3]))[:MAX_KANA]
    rest = [c for c in cands if build.KANJI.search(c[5])]
    cands = loans + kana + rest

    picked = []
    for c in cands:
        if len(kept) + len(picked) >= target:
            break
        if c[5] in taken_text or c[6] in taken_text or c[7].lower() in seen_meaning:
            continue
        taken_text |= {c[5], c[6]}
        seen_meaning.add(c[7].lower())
        picked.append(c)

    # Shelve by kind, so a wing is "verbs", "adjectives", "nouns" ...: easier to learn together.
    order = ['verb', 'adj', 'adv', 'noun', 'loan']
    picked.sort(key=lambda c: (order.index(c[8]), c[:4]))
    next_wing = max((int(w) for _, w in kept), default=0) + 1
    lines = []
    for kind in order:
        group = [c for c in picked if c[8] == kind]
        if not group:
            continue
        wings = max(1, round(len(group) / WING_SIZE))
        for i, c in enumerate(group):
            lines.append(f'{c[3]}\t{next_wing + i * wings // len(group)}')
        next_wing += wings
    with LIBRARY.open('a', encoding='utf-8') as f:
        for l in lines:
            f.write(l + '\n')
    from collections import Counter
    print(f'{len(picked)} words added ({len(kept)} kept); kinds {Counter(c[8] for c in picked)}')


if __name__ == '__main__':
    main()
