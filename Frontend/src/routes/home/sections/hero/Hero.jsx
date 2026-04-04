import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import "react-alice-carousel/lib/alice-carousel.css";
import HeroBg from "./assets/hero-bg.jpg";
import "./assets/hero.css";

const Hero = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <section className="homepage__hero" aria-labelledby="hero-title">
      <h2 id="hero-title" className="visually-hidden">
        Welcome to PizzaByte!
      </h2>
      
      {/* Hero Background Image with Animation */}
      <motion.img
        src={HeroBg}
        alt="PizzaByte Hero Background"
        className={`hero__video ${!isLoading && "loaded"}`}
        onLoad={() => setIsLoading(false)}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Hero Content with Staggered Animation */}
      <motion.div
        className="hero__info flex-container flex-column txt-center pop-font txt-white"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}>
          <span>Welcome</span>
          <h2 className="txt-white">try something amazing</h2>
          <p className="txt-white">Ordering your fave Pizza is quick and easy with our app or on our website.</p>
        </motion.div>

        <motion.div
          className="hero__interaction flex-container flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}>
          <Link className="passive-button-style" to="/blog" aria-label="Read our blog">
            Read Blog
          </Link>
          <Link className="passive-button-style" to="/menu" aria-label="View our menu">
            View Menu
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
