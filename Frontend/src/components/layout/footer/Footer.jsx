import FooterMenu from "./FooterMenu";
import FooterLegal from "./FooterLegal";
import FooterSocials from "./FooterSocials";
import "./assets/footer.css";

const Footer = () => {
  return (
    <footer className="flex-container flex-column txt-center txt-white pop-font">
      <div className="footer__top">
        <FooterMenu />
        <FooterSocials />
      </div>
      <hr aria-hidden="true" />
      <FooterLegal />
    </footer>
  );
};

export default Footer;
