import pizzaOne375 from "../assets/pizza-one-375.webp";
import pizzaTwo375 from "../assets/pizza-two-375.webp";
import pizzaThree375 from "../assets/pizza-three-375.webp";
import ChickenAlfredo375 from "../assets/pasta-one-375.webp";
import AllaGricia375 from "../assets/pasta-two-375.webp";
import SheetPan375 from "../assets/pasta-three-375.webp";

import pizzaOne700 from "../assets/pizza-one-700.webp";
import pizzaTwo700 from "../assets/pizza-two-700.webp";
import pizzaThree700 from "../assets/pizza-three-700.webp";
import ChickenAlfredo700 from "../assets/pasta-one-700.webp";
import AllaGricia700 from "../assets/pasta-two-700.webp";
import SheetPan700 from "../assets/pasta-three-700.webp";

const menuSliderCategories = [
  {
    name: "pizza",
    id: "pizza",
  },
  {
    name: "pasta",
    id: "pasta",
  },
];
const productsData = [
  {
    id: "pepperoni-pizza",
    name: "Pepperoni Pizza",
    description: "Pizza crust yeast, pepperoni, tomato paste, mozzarella cheese, sugar.",

    img375: pizzaOne375,
    img700: pizzaOne700,
    category: "pizza",
  },
  {
    id: "bbq-chicken-pizza",
    name: "BBQ Chicken",
    description: "Rotisserie chicken, pizza dough, bbq sauce, smoked cheddar cheese, mozzarella cheese.",

    img375: pizzaTwo375,
    img700: pizzaTwo700,
    category: "pizza",
  },
  {
    id: "cheese-pizza",
    name: "Cheese Pizza",
    description: "Pizza dough, pizza sauce, provolone cheese, mozzarella.",

    img375: pizzaThree375,
    img700: pizzaThree700,
    category: "pizza",
  },
  {
    id: "chicken-alfredo",
    img375: ChickenAlfredo375,
    img700: ChickenAlfredo700,
    name: "Chicken Alfredo",
    description: "Skinless chicken breast, heavy cream, olive oil, parmigiano reggiano, black pepper.",
    category: "pasta",
  },
  {
    id: "pasta-alla-gricia",
    img375: AllaGricia375,
    img700: AllaGricia700,
    name: "Pasta Alla Gricia",
    description: "Rigatoni pasta, pancetta, olive oil, pecorino romano, black pepper.",
    category: "pasta",
  },
  {
    id: "sheet-pan-burrata-caprese-gnocchi",
    img375: SheetPan375,
    img700: SheetPan700,
    name: "Burrata Caprese Gnocchi",
    description: "Penne pasta, sour cream, rotisserie chicken, cherry tomatoes, curly kale.",
    category: "pasta",
  },
];

export { productsData, menuSliderCategories };
