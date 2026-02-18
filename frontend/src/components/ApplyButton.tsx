interface ApplyButtonProps {
  disabled: boolean;
  isLoading: boolean;
}

export function ApplyButton({ disabled, isLoading }: ApplyButtonProps) {
  return (
    <button type="submit" disabled={disabled} className="apply-button">
      {isLoading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          Applying…
        </>
      ) : (
        'Apply Decals'
      )}
    </button>
  );
}
