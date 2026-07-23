import Button from "./Button.jsx";

function Pagination({ page, pageCount, total, pageSize, currentCount, onPrevious, onNext }) {
  return (
    <div className="app-card app-pagination rounded-xl text-sm">
      <p className="text-sm text-[color:var(--muted)]">
        Showing {currentCount ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of{" "}
        {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page === 1}
          onClick={onPrevious}
          className="min-w-[6.25rem] rounded-xl px-3 py-2"
        >
          Previous
        </Button>
        <span className="rounded-xl bg-[color:var(--accent)] px-3 py-2 font-semibold text-white shadow-sm">
          Page {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={onNext}
          className="min-w-[6.25rem] rounded-xl px-3 py-2"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
