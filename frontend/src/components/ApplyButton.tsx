interface ApplyButtonProps {
  disabled: boolean;
}

export function ApplyButton({ disabled }: ApplyButtonProps) {
  return (
    <button type="submit" disabled={disabled} className="apply-button">
      Apply Decals
    </button>
  );
}
