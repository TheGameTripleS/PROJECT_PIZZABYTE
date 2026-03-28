import "./assets/careers.css";
import { useEffect } from "react";
import careers from "./data/careers";
import { motion } from "framer-motion";
import { slideInLeft } from "../../utils/animations";
const CareersPage = () => {
  useEffect(() => {
    document.title = "Careers | PizzaByte";
  }, []);
  return (
    <motion.main
      className="careers"
      initial={slideInLeft.initial}
      whileInView={slideInLeft.whileInView}
      exit={slideInLeft.exit}
      transition={slideInLeft.transition}>
      <h2>Careers</h2>
      <h3>If you think you can add value with your expertise, passion, and hard work, you might be the ONE!</h3>
      <ul className="careers__inner">
        {careers.map((career) => (
          <li key={career.id} className="careers__listings">
            <div>
              <h4>{career.title}</h4>
              <p>{career.description}</p>
              <hr aria-hidden="true" />
            </div>
            <span aria-label={`Applications for ${career.title} are currently unavailable`}>
              Applications unavailable
            </span>
          </li>
        ))}
      </ul>
    </motion.main>
  );
};

export default CareersPage;
