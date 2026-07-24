import React, { useEffect, useRef, useState } from "react";
import { Grid2x2 } from "lucide-react";
import SummaryApi from "../common";
import { resolvePerfectForIcon, perfectForIconList } from "../helpers/perfectForIconSet";

const MAX_VISIBLE_SUGGESTIONS = 5;
const TEXT_SEARCH_DEBOUNCE_MS = 250;
const GRID_COLUMNS = 6;

// Free-text "Who is it for?" field, fully keyboard-operable.
// Flow:
//  1. Admin types -> after a short debounce, a floating dropdown shows matching TEXT suggestions
//     (prefix match against the perfectForSuggestion dictionary, text only, no icons yet).
//     Lines already added to this project are excluded from the list (no point re-suggesting
//     something that's already a chip below).
//     ArrowDown/ArrowUp moves a highlight through the list; Enter selects the highlighted item
//     (or, with nothing highlighted, commits the raw typed text as a new entry).
//  2. Selecting a text match applies its already-known icon immediately (no icon-choice step -
//     a dictionary match already has a fixed icon). Only genuinely new/unmatched text (committed
//     via Enter) opens the icon-choice row: up to 5 icon buttons + a 6th icon-shaped "more" button
//     that opens the full icon grid, all keyboard-navigable the same way (ArrowDown/Up + Enter).
//  3. In the grid, ArrowRight/Left move within a row, ArrowUp/Down jump a full row (6 columns),
//     Enter confirms the highlighted icon.
//  4. Confirming any icon immediately adds { text, icon, fromDb } to the project's list, then
//     clears the input and returns focus to it so the admin can start the next line right away.
// Persisting a brand-new text+icon pair into the shared perfectForSuggestion dictionary does NOT
// happen here - it only happens when the whole Add Project form is submitted (see
// AdminCreateProjectPage.js's submit handler), which syncs every fromDb:false line at once.
// Lines picked from an existing DB suggestion (fromDb: true) can only be removed (X).
// Lines typed fresh via the grid (fromDb: false) can be edited (pencil) or removed (X).
const PerfectForField = ({ value, onChange }) => {
  const [draftText, setDraftText] = useState("");
  const [committedText, setCommittedText] = useState("");
  const [textMatches, setTextMatches] = useState([]);
  const [isTextDropdownOpen, setIsTextDropdownOpen] = useState(false);
  const [textHighlightIndex, setTextHighlightIndex] = useState(-1);
  const [iconSuggestions, setIconSuggestions] = useState([]);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [iconHighlightIndex, setIconHighlightIndex] = useState(-1);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [gridHighlightIndex, setGridHighlightIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const fieldRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fieldRef.current && !fieldRef.current.contains(event.target)) {
        setIsTextDropdownOpen(false);
        setIsIconDropdownOpen(false);
        setIsGridOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const focusInput = () => {
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const resetDraft = () => {
    setDraftText("");
    setCommittedText("");
    setTextMatches([]);
    setIsTextDropdownOpen(false);
    setTextHighlightIndex(-1);
    setIconSuggestions([]);
    setIsIconDropdownOpen(false);
    setIconHighlightIndex(-1);
    setIsGridOpen(false);
    setGridHighlightIndex(0);
    setEditingIndex(null);
    focusInput();
  };

  const fetchTextMatches = async (query) => {
    try {
      const response = await fetch(`${SummaryApi.perfectForSuggestionsSearch.url}?q=${encodeURIComponent(query)}`, {
        method: SummaryApi.perfectForSuggestionsSearch.method,
        credentials: "include",
      });
      const result = await response.json();
      return result?.data || [];
    } catch (error) {
      console.error("Error fetching perfect-for suggestions:", error);
      return [];
    }
  };

  const handleDraftChange = (newDraft) => {
    setDraftText(newDraft);
    setCommittedText("");
    setIconSuggestions([]);
    setIsIconDropdownOpen(false);
    setIconHighlightIndex(-1);
    setIsGridOpen(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = newDraft.trim();
    if (!trimmed) {
      setTextMatches([]);
      setIsTextDropdownOpen(false);
      setTextHighlightIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const matches = await fetchTextMatches(trimmed);
      const alreadyAddedTexts = new Set(
        value
          .filter((_, index) => index !== editingIndex)
          .map((line) => line.text.toLowerCase())
      );
      const filteredMatches = matches.filter(
        (match) => !alreadyAddedTexts.has(match.text.toLowerCase())
      );
      setTextMatches(filteredMatches);
      setIsTextDropdownOpen(true);
      setTextHighlightIndex(-1);
    }, TEXT_SEARCH_DEBOUNCE_MS);
  };

  const commitNewTextAndLoadIcons = async (text) => {
    setCommittedText(text);
    setIsTextDropdownOpen(false);
    setTextHighlightIndex(-1);

    const matches = await fetchTextMatches(text);
    setIconSuggestions(matches);
    setIsIconDropdownOpen(true);
    setIconHighlightIndex(0);
  };

  const applyIconChoice = (text, icon, fromDb) => {
    const newLine = { text, icon, fromDb };

    if (editingIndex !== null) {
      const updated = [...value];
      updated[editingIndex] = newLine;
      onChange(updated);
    } else {
      onChange([...value, newLine]);
    }

    resetDraft();
  };

  // A text picked straight from the dictionary already has a known icon - apply it immediately,
  // no icon choice needed. Icon selection only applies to genuinely new/unmatched text.
  const handleSelectTextMatch = (suggestion) => {
    applyIconChoice(suggestion.text, suggestion.icon, true);
  };

  const visibleIconSuggestions = iconSuggestions.slice(0, MAX_VISIBLE_SUGGESTIONS);
  // Index layout in the icon row: [0..visibleIconSuggestions.length-1] are suggestions, last index is "more".
  const iconRowLength = visibleIconSuggestions.length + 1;
  const moreButtonIndex = visibleIconSuggestions.length;

  const handleKeyDown = (event) => {
    if (isGridOpen) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setGridHighlightIndex((i) => Math.min(i + 1, perfectForIconList.length - 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setGridHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setGridHighlightIndex((i) => Math.min(i + GRID_COLUMNS, perfectForIconList.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setGridHighlightIndex((i) => Math.max(i - GRID_COLUMNS, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const chosen = perfectForIconList[gridHighlightIndex];
        if (chosen) applyIconChoice(committedText, chosen.key, false);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsGridOpen(false);
      }
      return;
    }

    if (isIconDropdownOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIconHighlightIndex((i) => Math.min(i + 1, iconRowLength - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIconHighlightIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (iconHighlightIndex === moreButtonIndex || iconHighlightIndex < 0) {
          setIsGridOpen(true);
          setGridHighlightIndex(0);
        } else {
          const chosen = visibleIconSuggestions[iconHighlightIndex];
          if (chosen) applyIconChoice(committedText, chosen.icon, true);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setIsIconDropdownOpen(false);
        return;
      }
    }

    if (isTextDropdownOpen && textMatches.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setTextHighlightIndex((i) => Math.min(i + 1, textMatches.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setTextHighlightIndex((i) => Math.max(i - 1, -1));
        return;
      }
      if (event.key === "Enter" && textHighlightIndex >= 0) {
        event.preventDefault();
        handleSelectTextMatch(textMatches[textHighlightIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setIsTextDropdownOpen(false);
        return;
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const trimmed = draftText.trim();
      if (!trimmed) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commitNewTextAndLoadIcons(trimmed);
    }
  };

  const handleEditLine = (index) => {
    const line = value[index];
    setEditingIndex(index);
    setDraftText(line.text);
    setCommittedText(line.text);
    setTextMatches([]);
    setIsTextDropdownOpen(false);
    setIconSuggestions([]);
    setIsIconDropdownOpen(false);
    focusInput();
  };

  const handleDeleteLine = (index) => {
    onChange(value.filter((_, i) => i !== index));
    if (editingIndex === index) resetDraft();
  };

  const justAddedLine = committedText
    ? value.find((line) => line.text === committedText)
    : null;

  return (
    <div ref={fieldRef} className="relative">
      <input
        ref={inputRef}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        type="text"
        placeholder="Type an audience (e.g. Freelancers)"
        value={draftText}
        onChange={(event) => handleDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      {isTextDropdownOpen && !isIconDropdownOpen && textMatches.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {textMatches.map((suggestion, index) => (
            <button
              key={suggestion._id}
              type="button"
              onClick={() => handleSelectTextMatch(suggestion)}
              onMouseEnter={() => setTextHighlightIndex(index)}
              className={`flex w-full items-center px-3 py-2 text-left text-base text-black transition ${
                textHighlightIndex === index ? "bg-emerald-50" : "hover:bg-emerald-50"
              }`}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}

      {isIconDropdownOpen && committedText && !justAddedLine && !isGridOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="flex items-center gap-2">
            {visibleIconSuggestions.map((suggestion, index) => {
              const Icon = resolvePerfectForIcon(suggestion.icon);
              return (
                <button
                  key={suggestion._id}
                  type="button"
                  onClick={() => applyIconChoice(committedText, suggestion.icon, true)}
                  onMouseEnter={() => setIconHighlightIndex(index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                    iconHighlightIndex === index
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                  title={suggestion.text}
                >
                  <Icon size={18} />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsGridOpen(true);
                setGridHighlightIndex(0);
              }}
              onMouseEnter={() => setIconHighlightIndex(moreButtonIndex)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border border-dashed transition ${
                iconHighlightIndex === moreButtonIndex
                  ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                  : "border-slate-300 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
              title="Browse all icons"
              aria-label="Browse all icons"
            >
              <Grid2x2 size={18} />
            </button>
          </div>
        </div>
      )}

      {isGridOpen && (
        <div className="absolute left-0 top-full z-30 mt-1 grid max-h-64 w-72 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          {perfectForIconList.map(({ key, Icon }, index) => (
            <button
              key={key}
              type="button"
              onClick={() => applyIconChoice(committedText, key, false)}
              onMouseEnter={() => setGridHighlightIndex(index)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                gridHighlightIndex === index
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((line, index) => {
            const Icon = resolvePerfectForIcon(line.icon);
            return (
              <span
                key={`${line.text}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800"
              >
                <Icon size={14} />
                {line.text}
                {!line.fromDb && (
                  <button
                    type="button"
                    onClick={() => handleEditLine(index)}
                    className="text-emerald-600 transition hover:text-emerald-800"
                    aria-label={`Edit ${line.text}`}
                  >
                    ✎
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteLine(index)}
                  className="text-emerald-500 transition hover:text-red-500"
                  aria-label={`Remove ${line.text}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PerfectForField;
