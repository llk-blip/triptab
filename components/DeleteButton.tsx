"use client";

export default function DeleteButton({ confirmText }: { confirmText: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
    >
      Delete
    </button>
  );
}
