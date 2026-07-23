import Button from "./Button.jsx";

function TableActionButtons({ onEdit, onDelete, deleteLabel = "Delete", editLabel = "Edit" }) {
  return (
    <div className="actions">
      {onEdit ? (
        <Button type="button" variant="soft" onClick={onEdit} className="px-3 py-2 text-sm">
          {editLabel}
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="danger"
          onClick={onDelete}
          className="px-3 py-2 text-sm"
        >
          {deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default TableActionButtons;
