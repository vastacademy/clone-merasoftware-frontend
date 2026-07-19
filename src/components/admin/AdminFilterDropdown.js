import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const AdminFilterDropdown = ({ icon: Icon, label, value, options, onChange, ariaLabel }) => {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex] || options[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectOption = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!isOpen && ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    if (!isOpen || !options.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const currentIndex = highlightedIndex >= 0 ? highlightedIndex : selectedIndex;
      const nextIndex = (currentIndex + direction + options.length) % options.length;
      setHighlightedIndex(nextIndex);
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      selectOption(options[highlightedIndex]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full min-w-[9rem] sm:w-auto">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-slate-200 transition hover:border-emerald-400/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
      >
        {Icon ? <Icon size={16} className="shrink-0 text-slate-400" /> : null}
        <span className="shrink-0 font-semibold">{label}</span>
        <span className="min-w-0 flex-1 truncate text-slate-300">{selectedOption?.label}</span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-[12rem] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-1.5 shadow-2xl shadow-slate-950/40"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${isHighlighted ? "bg-emerald-500 text-slate-950" : "text-slate-200 hover:bg-emerald-500 hover:text-slate-950"}`}
              >
                <Check size={15} className={`shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                <span className="flex-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminFilterDropdown;
