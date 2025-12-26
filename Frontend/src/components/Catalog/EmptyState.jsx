export default function EmptyState({ 
  search, 
  selectedSubCategory, 
  selectedCategory,
  onClearFilter,
  onViewAll 
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📦</div>
      <p>No products found</p>
      {search && <p className="empty-hint">Try a different search term</p>}
      {selectedSubCategory && (
        <button onClick={onClearFilter} className="view-all-btn">
          Clear Filter
        </button>
      )}
      {selectedCategory !== "all" && !search && !selectedSubCategory && (
        <button onClick={onViewAll} className="view-all-btn">
          View All Products
        </button>
      )}
    </div>
  );
}