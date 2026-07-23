function InlineSpinner({ label = "Loading", size = "sm" }) {
  const dimension = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`${dimension} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

export default InlineSpinner;
