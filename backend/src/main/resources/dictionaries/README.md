# Offline dictionary setup (ESDB / SCOWL)

Word Quest gameplay **never** calls SCOWL, wordfreq, or any external API.

## Import

Place a word-per-line lexicon (ESDB/SCOWL export or the bundled seed) at a configurable path, then:

```bash
# Optional: frequency TSV (word<TAB>score), higher = more common
export WQ_DICT_PATH=file:/var/wordquest/scowl-60.txt
export WQ_DICT_SOURCE=ESDB
export WQ_DICT_SOURCE_VERSION=2026.08.10
export WQ_DICT_FREQ_PATH=file:/var/wordquest/wordfreq.tsv

java -jar wordquest.jar --import-dictionary
```

Idempotent: re-running upserts by `normalized_word` and does not create duplicates.

## Dev default

If `wordquest.dictionary.seed-if-empty=true` (default) and the table is empty, the app imports
`classpath:dictionaries/wordlist.txt` once at startup for local development.

## Historical puzzles

`puzzle_words` rows are immutable snapshots. Updating the dictionary does not change
existing puzzle answers.
