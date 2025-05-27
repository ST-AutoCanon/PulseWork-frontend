import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Left Section */}
        <div className="login-left">
          <h2>WELCOME</h2>
          <h4>Your Headline Name</h4>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>

        {/* Right Section */}
        <div className="login-right">
          <h3>Sign in</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>

          <div className="input-group">
            <i className="fa fa-user icon" />
            <input type="text" placeholder="User Name" />
          </div>

          <div className="input-group">
            <i className="fa fa-lock icon" />
            <input type={showPassword ? "text" : "password"} placeholder="Password" />
            <span
              className="show-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </span>
          </div>

          <div className="options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#">Forgot Password?</a>
          </div>

          <button className="btn-primary">Sign in</button>
          <div className="divider">or</div>
          <button className="btn-secondary">Sign in with other</button>

          <p className="signup-link">
            Don’t have an account? <a href="#">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
