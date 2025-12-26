import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  return (
    <div className="catalog-grid">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}