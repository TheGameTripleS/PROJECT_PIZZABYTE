import { NavLink } from "react-router-dom";
import { categories as categoriesData } from "../../../data/categories";
import SearchIcon from "../assets/search-icon.png";

const MenuCategories = ({ activeCategory, searchTerm, setSearchTerm, setActiveCategory }) => {
  return (
    <section className="menu__categories">
      <h2 className="visually-hidden">Menu Categories</h2>
      <form className="menu__categories__search" role="search" onSubmit={(e) => e.preventDefault()}>
        <input
          value={searchTerm}
          name="search"
          type="text"
          placeholder="search..."
          aria-label="Search products"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <img src={SearchIcon} alt="" aria-hidden="true" />
      </form>
      <ul>
        {categoriesData.map((category) => (
          <li key={category.id}>
            <NavLink
              to="/menu"
              aria-label={`Select category ${category.name}`}
              className={activeCategory === category.name ? "menu__categories__active" : ""}
              onClick={() => {
                setActiveCategory(category.name);
                setSearchTerm("");
              }}>
              {category.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </section>
  );
};
export default MenuCategories;
