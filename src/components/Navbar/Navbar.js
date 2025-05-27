import React, { useState } from 'react';
import './Navbar.css';
import LoginModal from '../LoginModal/LoginModal';
import logo from '../../assets/pulsework.png'; // Adjust path based on location

function Navbar() {
  const [showLogin, setShowLogin] = useState(false);

  const toggleLogin = () => {
    setShowLogin(!showLogin);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={logo} alt="Pulse Work Logo" className="logo-image" />
        </div>
        <button className="navbar-login" onClick={toggleLogin}>Login</button>
      </nav>
      {showLogin && <LoginModal closeModal={toggleLogin} />}
    </>
  );
}

export default Navbar;
