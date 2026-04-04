import SlideOne from "../assets/img-one.jpeg";
import SlideTwo from "../assets/carbonara.jpeg";
import SlideThree from "../assets/img-three.jpeg";
import SlideFour from "../assets/img-four.jpeg";

const AboutUs = () => {
  return (
    <section className="about__company" aria-labelledby="about-title">
      <article className="about__company__content">
        <h2 id="about-title">About us</h2>
        <h3 className="sub-title">More than delicious food</h3>
        <p>
          Founded in 2026 we bring pizza slice by slice to the next level! Unique branding and being in the pizza
          industry is the formula to our success. We do understand what people want and convert desires to unique
          experiences of taste.
        </p>
        <ul>
          <li>🥬 Freshness, originality, and quality are our priorities.</li>
          <li>💰 Affordable costs, located almost anywhere.</li>
          <li>📱 Amazing online ordering system – order food in one click.</li>
          <li>📆 Easy-to-navigate pre-order options.</li>
          <li>🎈 Great options for corporate parties!</li>
        </ul>
        <p>At PizzaByte we always care about you because you are the one who makes us special!</p>
        <p>The PizzaByte project was made with love for pizza by Sajid Ibne Zaman and Md. Musfiqur Rahman.</p>
        <div className="about__company__glass"></div>
      </article>
      <div className="about__company__gallery">
        <img src={SlideOne} alt="" aria-hidden="true" loading="lazy" fetchPriority="low" />
        <img src={SlideTwo} alt="" aria-hidden="true" loading="lazy" fetchPriority="low" />
        <img src={SlideThree} alt="" aria-hidden="true" loading="lazy" fetchPriority="low" />
        <img src={SlideFour} alt="" aria-hidden="true" loading="lazy" fetchPriority="low" />
      </div>
    </section>
  );
};

export default AboutUs;
