function Loader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        
        {/* Spinner */}
        <div className="h-12 w-12 border-4 border-[color:var(--accent-soft)] border-t-[color:var(--accent)] rounded-full animate-spin"></div>
        <div className="h-12 w-12 border-2 border-transparent border-t-[color:var(--accent)] rounded-full animate-pulse opacity-30"></div>

        {/* Text */}
        <p className="text-sm font-medium text-[color:var(--muted)] animate-pulse">{text}</p>

      </div>
    </div>
  );
}

export default Loader;