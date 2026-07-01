import React, { useMemo, useState } from "react";
import { Search, Sparkles, Hash } from "lucide-react";
import { useAppSelector } from "../../store";

export const FoundWords: React.FC = () => {
  const puzzle = useAppSelector((state) => state.puzzle);
  const [query, setQuery] = useState("");
  const filteredWords = useMemo(() => {
    return puzzle.wordsFound
      .filter((word) => word.text.toLowerCase().includes(query.toLowerCase()))
      .slice()
      .sort((a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text));
  }, [query, puzzle.wordsFound]);

  const wordRows = useMemo(() => {
    const rows: typeof filteredWords[] = [];
    for (let i = 0; i < filteredWords.length; i += 5) {
      rows.push(filteredWords.slice(i, i + 5));
    }
    return rows;
  }, [filteredWords]);

  return (
    <div className="rounded-xl border border-gold/80 p-5 bg-parchment/85 dark:bg-black/20 text-gold/90">
      <div className="items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gold">
            Found Words
          </h2>
          <p className="text-sm text-jade dark:text-white/70">
            {puzzle.wordsFound.length} of {puzzle.totalValidWords} words found
          </p>
        </div>
        <div className=" items-center gap-2 rounded-lg border border-gold/80 px-3 py-2 bg-parchment/20 text-gold flex">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-32"
          />
        </div>
      </div>
      {filteredWords.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Hash
            size={42}
            className="mx-auto mb-3 opacity-40"
          />
          <p>No matching words.</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto text-white space-y-3 pr-2">
          {wordRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-3">
              {row.map((word) => {
                const isDuplicateFlash =
                  puzzle.lastRejectedReason === "duplicate" &&
                  puzzle.lastRejectedWord?.toUpperCase() === word.text.toUpperCase();

                return (
                  <div
                    key={word.text}
                    style={{ flexBasis: "calc(16.666% - 0.75rem)", maxWidth: "350px" }}
                    className={
                      `rounded-lg border px-4 py-3 transition-all duration-200 ${
                        word.isPangram
                          ? "border-purple-400 bg-purple-500/10"
                          : "border-gold/10 bg-gold/5 text-gold/90"
                      } ${
                        isDuplicateFlash
                          ? "border-red-400 bg-red-500/20 shadow-[0_0_0_2px_rgba(248,113,113,0.35)]"
                          : ""
                      }`
                    }
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {word.isPangram && (
                          <Sparkles
                            size={18}
                            className="text-purple-400"
                          />
                        )}
                        <span className="truncate font-semibold uppercase tracking-wide">
                          {word.text}
                        </span>
                      </div>
                      <span className="rounded-full bg-gold px-2 py-1 text-xs font-bold text-black">
                        +{word.score}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] opacity-70">
                      <span>{word.text.length} letters</span>
                      {isDuplicateFlash && (
                        <span className="rounded-full border border-red-400/60 bg-red-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-200">
                          already found
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoundWords;