"use client";

export default function DeleteButton({ confirmText }: { confirmText: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="text-xs text-coral font-semibold hover:text-[#e85d3d] underline underline-offset-2"
    >
      Delete
    </button>
  );
}
