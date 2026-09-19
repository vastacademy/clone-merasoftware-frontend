import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Fully keyboard-controlled dropdown, styled to match the app's form-field look.
 * Enter/Space/ArrowDown opens it; ArrowUp/ArrowDown moves the highlight;
 * Enter/Space confirms; Esc closes without changing the value.
 * See frontend/src/DOCS/context-keyboard.md for the reuse pattern.
 */
const KeyboardSelect = React.forwardRef(
  ({ value, onChange, options, placeholder = "Select", onConfirm, className = "" }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const listRef = useRef(null);

    React.useImperativeHandle(ref, () => buttonRef.current);

    const selectedOption = options.find((option) => option.value === value) || null;

    useEffect(() => {
      if (!isOpen) return undefined;
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (isOpen && listRef.current) {
        const activeItem = listRef.current.querySelector('[data-active="true"]');
        activeItem?.scrollIntoView({ block: "nearest" });
      }
    }, [isOpen, highlightIndex]);

    const openDropdown = () => {
      const currentIndex = options.findIndex((option) => option.value === value);
      setHighlightIndex(currentIndex >= 0 ? currentIndex : 0);
      setIsOpen(true);
    };

    const commitSelection = (index) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      setIsOpen(false);
      onConfirm?.();
    };

    const handleKeyDown = (event) => {
      if (!isOpen) {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
          event.preventDefault();
          openDropdown();
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, options.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        commitSelection(highlightIndex);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
      } else if (event.key === "Tab") {
        setIsOpen(false);
      }
    };

    return (
      <div ref={containerRef} className="peer relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 ${className}`}
        >
          <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                data-active={index === highlightIndex}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => commitSelection(index)}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  index === highlightIndex ? "bg-emerald-50 text-emerald-800" : "text-slate-700"
                }`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

KeyboardSelect.displayName = "KeyboardSelect";

export default KeyboardSelect;
