import { Github, Globe, Linkedin } from "lucide-react";
import socials from "./data/socials";

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  globe: Globe,
};

const FooterSocials = () => {
  return (
    <ul className="footer__socials">
      {socials.map(({ id, href, icon, name }) => {
        const Icon = socialIcons[icon];

        return (
        <li key={id}>
          <a href={href} target="_blank" rel="noreferrer noopener" aria-label={`Visit ${name}`}>
            <Icon aria-hidden="true" size={28} strokeWidth={1.8} />
            <span>{name}</span>
          </a>
        </li>
        );
      })}
    </ul>
  );
};

export default FooterSocials;
