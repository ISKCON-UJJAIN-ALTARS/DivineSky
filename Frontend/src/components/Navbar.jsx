import "../styles/Navbar.css";

export default function Navbar({ search, setSearch }) {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo">
        DIVIINE<span>SKY</span>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="search-icon">⌕</span>
      </div>

      {/* Links */}
      <ul className="nav-links">
        <li><a href="/">Home</a></li>       
        <li><a href="/">About</a></li>
      </ul>
    </nav>
  );
}
