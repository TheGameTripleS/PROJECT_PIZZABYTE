import "./assets/contact-info.css";
import { motion } from "framer-motion";
import PizzaOne from "./assets/image-one-parallax.webp";

const ContactInfo = () => {
  return (
    <section className="homepage__company-info flex-container flex-row txt-white" aria-describedby="contact-title">
      <h2 id="contact-title" className="visually-hidden">
        Contact us
      </h2>
      <motion.img
        initial={{ opacity: 0, right: 100 }}
        whileInView={{ opacity: 0.8, right: 300 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
        src={PizzaOne}
        alt=""
        aria-hidden="true"
        className="parallax company-info__img"
        loading="lazy"
      />
      <motion.img
        initial={{ opacity: 0, right: 100 }}
        whileInView={{ opacity: 0.8, right: 200 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
        src={PizzaOne}
        alt=""
        aria-hidden="true"
        className="parallax company-info__img"
        loading="lazy"
      />
      <motion.img
        initial={{ opacity: 0, right: 50 }}
        whileInView={{ opacity: 0.8, right: 100 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
        src={PizzaOne}
        alt=""
        aria-hidden="true"
        className="parallax company-info__img"
        loading="lazy"
      />
      <address className="company-info__details">
        <ul>
          <li>
            <h3>
              <a href="tel:880255155097">+880-2-55155097</a>
            </h3>
            <p>Contact us if you have any questions</p>
          </li>
          <li>
            <h3>CSE BUET</h3>
            <p>Polashi, Dhaka</p>
          </li>
          <li>
            <h3>Open Monday-Friday</h3>
            <p>
              <time dateTime="8:00">8:00</time>am - <time dateTime="21:00">9:00</time>pm
            </p>
          </li>
        </ul>
      </address>
    </section>
  );
};

export default ContactInfo;