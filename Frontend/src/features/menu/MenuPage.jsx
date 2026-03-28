import "./assets/menu.css";
import MenuCategories from "./components/MenuCategories";
import ScrollButton from "../../components/ScrollBtn";
import ItemCard from "../../components/ItemCard";
import ReactPaginate from "react-paginate";
import { useState, useEffect } from "react";
import ResetLocation from "../../utils/ResetLocation";
import { AnimatePresence, motion } from "framer-motion";
import { PackageIcon } from "lucide-react";
import CustomerItemCardActions from "./components/CustomerItemCardActions";
import { fadeIn, slideInLeft } from "../../utils/animations";
import { useItemStore } from "../../store/useItemStore";

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState("Menu");
  const {
    items,
    loading,
    error,
    fetchItems,
    searchTerm,
    setSearchTerm,
  } = useItemStore();
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchItems]);

  const continuedItems = items.filter((item) => {
    const currentStatus = item.status || item.Status;
    return currentStatus === "continued";
  });
  const filteredItems = continuedItems.filter((item) => {
    const itemCat = item.category || item.Category;
    
    if (activeCategory === "Menu") return true;
    if (activeCategory === "Side") {
      return itemCat === "Side" || itemCat === "Sides";
    }
    return itemCat === activeCategory;
  });
  const currentItems = filteredItems.slice(itemOffset, itemOffset + itemsPerPage);
  const pageCountProducts = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = event.selected * itemsPerPage;
    setItemOffset(newOffset);
    setCurrentPage(event.selected);
    ResetLocation();
  };

  const resetPagination = () => {
    setItemOffset(0);
    setCurrentPage(0);
  };

  useEffect(() => {
    document.title = `${activeCategory} | PizzaByte`;
    resetPagination();
    ResetLocation();
  }, [activeCategory, searchTerm]);

  return (
    <motion.main
      className="menu"
      initial={slideInLeft.initial}
      whileInView={slideInLeft.whileInView}
      exit={slideInLeft.exit}
      transition={slideInLeft.transition}>
      <MenuCategories
        activeCategory={activeCategory}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setActiveCategory={setActiveCategory}
      />
      <section className="menu__items">
        <h2 className="visually-hidden">Menu</h2>
        {error && <p className="menu__not-found">{error}</p>}
        {loading ? (
          <div className="menu__loading">
            <div className="loading loading-spinner loading-lg" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="menu__empty-state">
            <PackageIcon className="size-12" />
            <p className="menu__not-found">Nothing found!</p>
          </div>
        ) : (
          <AnimatePresence mode="sync">
            {currentItems.map((item, index) => (
              <motion.div
                // ADDED FALLBACKS HERE to prevent Framer Motion from crashing
                key={item.sku || item.SKU || `fallback-key-${index}`} 
                initial={fadeIn.initial}
                whileInView={fadeIn.whileInView}
                exit={fadeIn.exit}
                transition={fadeIn.transition}>
                <ItemCard
                  item={item}
                  variant="customer"
                  renderActions={(cardItem) => <CustomerItemCardActions item={cardItem} />}
                />
              </motion.div>
              ))}
          </AnimatePresence>
        )}
      </section>

      <ReactPaginate
        className="pagination"
        breakLabel="..."
        nextLabel=" &#62;"
        onPageChange={handlePageClick}
        pageRangeDisplayed={3}
        pageCount={Math.max(1, pageCountProducts)}
        forcePage={currentPage}
        previousLabel="&#60;"
        renderOnZeroPageCount={null}
        aria-label="Blog pagination"
      />
      <ScrollButton />
    </motion.main>
  );
};

export default MenuPage;
