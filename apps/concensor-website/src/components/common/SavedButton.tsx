'use client';
import './SavedButton.css';

interface SavedButtonProps {
  isSaved: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  size?: number;
  ariaLabel?: string;
}

export default function SavedButton({
  isSaved,
  onClick,
  disabled = false,
  className,
  size = 24,
  ariaLabel,
}: SavedButtonProps) {
  return (
    <button
      type="button"
      className={[
        'saved-button',
        isSaved ? 'is-saved' : '',
        className || '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (isSaved ? 'Remove from saved' : 'Save post')}
      aria-pressed={isSaved}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
        {isSaved ? (
          <path
            className="saved-icon-filled"
            d="M7 4a2 2 0 0 0-2 2v14l7-3.5L19 20V6a2 2 0 0 0-2-2H7z"
          />
        ) : (
          <path
            className="saved-icon-outline"
            d="M7 4a2 2 0 0 0-2 2v14l7-3.5L19 20V6a2 2 0 0 0-2-2H7z"
          />
        )}
      </svg>
    </button>
  );
}
