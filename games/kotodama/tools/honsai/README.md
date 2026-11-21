# Honsai word data

Arc 6 (Honsai) teaches thousands of words. They are **chosen by hand**, one district
per file (`d1_gate.txt`, `d2_market.txt`, ...), and **looked up in JMdict** for the
parts that are easy to get wrong by hand: the meaning, the part of speech, and the
conjugation class the Verb Forge needs.

```bash
# 1. Download jmdict-eng-<version>.json from https://github.com/scriptin/jmdict-simplified/releases
# 2. Rebuild core/src/content/honsai/words.generated.ts
python3 -I tools/honsai/build.py path/to/jmdict-eng-<version>.json
```

## List format

One word per line. `#` starts a comment.

| Line | Meaning |
|---|---|
| `食べる` | look up by spelling |
| `十|とお` | spelling and reading (when one spelling has several readings) |
| `いる||exist` | a hint: use the JMdict sense whose gloss contains "exist" |
| `僕|ぼく|=I (boys and men, casual)` | override the meaning (nuance JMdict cannot give) |
| `いる||exist=to be (people, animals)` | hint and override together |
| `大人|おとな!` | never conjugate (a noun JMdict also lists as a な-adjective) |

The build **fails** if a word is missing from JMdict or if two words would share a
meaning (a battle would show two right answers): fix it with a hint or an override.

**Append new words at the end of a list.** Word ids (`x-<romaji>`, `-2` for a second
word with the same reading) are counted in list order, and saved review progress is
keyed by id.

## The Great Library

The twelve districts hold about 1,900 hand-picked words. The Library tops Honsai up to
5,000 with JMdict's **common** words, picked by script:

```bash
# KANJIDIC2 comes from the same jmdict-simplified release (kanjidic2-en-<version>.json)
python3 -I tools/honsai/pick_library.py path/to/jmdict-eng-<version>.json path/to/kanjidic2-en-<version>.json 3150
python3 -I tools/honsai/build.py path/to/jmdict-eng-<version>.json
```

`pick_library.py` filters to everyday senses (no archaic, slang, honorific, specialist or
dialect senses; no set phrases, affixes or counters), never repeats a district word or
meaning, and ranks words by their rarest kanji's newspaper frequency, because JMdict marks
words common without ranking them. It writes `library.txt` (`<JMdict id>\t<wing>`), which
is **append-only**: running it again keeps every line and only adds words. Library ids
(`x-l-<romaji>`) are counted apart from district ids, so editing a district list never
renumbers them. Because the words are chosen by rule, some are dry compounds (下期, 員数):
remove a line only before it ships, since saved progress is keyed by its id.

## Licence

JMdict and KANJIDIC2 are the property of the Electronic Dictionary Research and Development Group
(https://www.edrdg.org/) and is used under the Creative Commons Attribution-ShareAlike 4.0
licence. The generated file carries that notice and is shared under the same licence;
the game credits it in the System menu.
