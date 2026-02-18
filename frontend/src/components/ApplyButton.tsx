interface ApplyButtonProps {
  disabled: boolean;
  isLoading: boolean;
}

export function ApplyButton({ disabled, isLoading }: ApplyButtonProps) {
  return (
    <button type="submit" disabled={disabled} className="apply-button">
      {isLoading ? 'Applying…' : 'Apply Decals'}
    </button>
  );
}
