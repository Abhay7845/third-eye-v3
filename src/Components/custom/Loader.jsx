import "../Styles/loader.css";
import logo from "../../asset/3rdeye_logo.png";

const Loader = () => {
  return (
    <div className='loader-wrapper'>
      <img src={logo} alt='Tanishq Logo' className='center-logo' />
      <div className='spinner-ring' />
    </div>
  );
};

export default Loader;
