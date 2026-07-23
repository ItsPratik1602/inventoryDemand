import { useEffect, useRef, useState } from "react";
import Button from "./Button.jsx";

function ActionDropdown({ label, disabled = false, items = [] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = async (action) => {
    setOpen(false);
    await action();
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="min-w-[9.5rem] justify-between"
      >
        <span>{label}</span>
        <span className="text-xs">▼</span>
      </Button>

      {open ? (
        <div className="app-card absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-full rounded-2xl bg-white p-2 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSelect(item.onClick)}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)]"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ActionDropdown;
