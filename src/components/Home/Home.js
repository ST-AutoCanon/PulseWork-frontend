import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Section */}
        <div className="login-left">
  <h1>Welcome to</h1>
  <h2>Pulse-Work HRMS</h2>
  <p>
    Pulse-Work is a smart and seamless HR management platform that simplifies employee attendance, leave tracking, payroll, and more — all in one place.
  </p>
</div>


        {/* Right Section */}
        <div className="login-right">
          <h2>Login</h2>
          <p>Please enter your credentials to continue.</p>
          <form>
            <div className="input-group">
              <label>Username</label>
              <input type="text" placeholder="Enter username" />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Enter password" />
            </div>

            <div className="form-options">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <a href="/">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Home;
