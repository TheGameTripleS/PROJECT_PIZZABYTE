import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ResetLocation from "../../../../utils/ResetLocation";
import blogPreview from "./data/blog-preview";
import "./blog.css";

const Blog = () => {
  return (
    <motion.section
      className="homepage__blog flex-container flex-column"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}>
      <h2 className="txt-center pop-font txt-white">Recent from blog</h2>
      <p className="section-description">
        Fresh, flavorful, and maybe some healthy recipes made for real, actual, everyday life. You don't need to be a
        pro! Helping you celebrate the joy of food in a non-intimidating way.
      </p>
      <div className="homepage__blog-posts">
        {blogPreview.map((post) => (
          <article key={post.id} className="homepage__blog-post flex-container flex-column">
            <img src={post.img} alt="" aria-hidden="true" width={330} height={220} loading="lazy" />
            <header className="blog__posts__credentials">
              <time className="date" dateTime={post.date}>
                {post.date}
              </time>
              <p>by {post.author}</p>
            </header>
            <Link
              onClick={ResetLocation}
              to={`/blog/${post.name.toLowerCase().replaceAll(" ", "-")}`}
              aria-label={`Continue reading ${post.name}`}>
              <h3 className="pop-font txt-white">{post.name}</h3>
            </Link>
            <p className="homepage__blog-intro">{post.intro}</p>
          </article>
        ))}
      </div>

      <Link onClick={ResetLocation} to="/blog" className="active-button-style txt-white">
        More posts
      </Link>
    </motion.section>
  );
};
export default Blog;
