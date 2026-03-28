import "./assets/statistics.css";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import statsPreview from "./data/company-statistics";
import Background from "./assets/section-7-bg.webp";
import { getStatistics } from "../../../../api/updateUser.js";
import { STATS_CACHE_DURATION, STATS_CACHE_KEY, STATS_TIMESTAMP_KEY } from "../../../../config/statsConfig.js";

const Statistics = () => {
  const ref = useRef(null);
  const [stats, setStats] = useState(statsPreview);

  useEffect(() => {
    const fetchStats = async () => {
      const now = Date.now();
      const cachedTimestamp = localStorage.getItem(STATS_TIMESTAMP_KEY);
      const cachedStats = localStorage.getItem(STATS_CACHE_KEY);

      // Check if cache is still valid
      if (cachedTimestamp && cachedStats) {
        const timeSinceLastUpdate = now - parseInt(cachedTimestamp);
        if (timeSinceLastUpdate < STATS_CACHE_DURATION) {
          // Use cached data
          const parsedStats = JSON.parse(cachedStats);
          const updatedStats = statsPreview.map((stat) => {
            if (stat.id === 3) return { ...stat, stats: parsedStats.customers };
            if (stat.id === 4) return { ...stat, stats: parsedStats.staff };
            return stat;
          });
          setStats(updatedStats);
          console.log("Using cached statistics");
          return;
        }
      }

      // Cache expired or doesn't exist - fetch fresh data
      console.log("Cache expired or missing - fetching fresh statistics");
      const result = await getStatistics();
      if (result.success) {
        const freshStats = {
          customers: String(result.data.customers),
          staff: String(result.data.staff),
        };

        // Store in cache
        localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(freshStats));
        localStorage.setItem(STATS_TIMESTAMP_KEY, String(now));

        const updatedStats = statsPreview.map((stat) => {
          if (stat.id === 3) return { ...stat, stats: freshStats.customers };
          if (stat.id === 4) return { ...stat, stats: freshStats.staff };
          return stat;
        });
        setStats(updatedStats);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.style.backgroundImage = `url(${Background})`;
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <section ref={ref} className="homepage__stats flex-container flex-column txt-center">
      <ul className="stats__items flex-container flex-column">
        {stats.map((stat) => (
          <li key={stat.id} className="stats__item">
            <motion.img
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 1 }}
              width="50"
              height="50"
              src={stat.img}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
            <h2>{stat.stats}</h2>
            <p className="pop-font txt-white">{stat.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Statistics;
