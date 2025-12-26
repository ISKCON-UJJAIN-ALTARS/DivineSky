export default function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state">
      <p>Error loading products: {error}</p>
      <button onClick={onRetry} className="retry-btn">
        Retry
      </button>
    </div>
  );
}