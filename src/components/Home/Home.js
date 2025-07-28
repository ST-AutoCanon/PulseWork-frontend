
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Typewriter from 'typewriter-effect';
// import About from "../About/About";
// import Services from '../Services/Services';
// import HomologationFirst from '../HomologationFirst/HomologationFirst';
// import './Home.css';
// import H101 from '../../assets/images/H101.png';
// import H106 from '../../assets/images/H106.png';
// import Homepage4 from '../../assets/images/Homepage4.png';
// import H105 from '../../assets/images/H105.png';

// const desktopImages = [H101, H106, Homepage4, H105];
// const mobileImages = [
//   require('../../assets/images/hhh105.png'),
//   require('../../assets/images/hhh111.png'),
//   require('../../assets/images/hhh115.png'),
//   require('../../assets/images/hhh114.png'),
// ];

// const typewriterContents = [
//   { text: 'At STS, we specialize in providing seamless turnkey solutions that handle every aspect of your project. From initial concept to final execution, we take care of all the details so you can focus on what matters most-growing your business.', duration: 16000 },
//   { text: 'We offer custom-tailored CAE services to enhance product performance, durability, and efficiency, using advanced simulations to predict real-world behavior, minimize prototypes, reduce costs, and accelerate time-to-market.', duration: 16000 },
//   { text: 'We specialize in delivering end-to-end 3-wheeler design solutions, offering custom branding, high-quality vehicle wraps, and expert installation to enhance visibility and drive your brand forward on the road.', duration: 15000 },
//   { text: 'We support automotive activities, from product development to innovative software app creation.', duration: 8000 },
// ];

// const mobileDurations = [2000, 2000, 2000, 2000]; // Fixed durations for mobile slides

// const Home = () => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isTyping, setIsTyping] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const navigate = useNavigate();
//   const timerRef = useRef(null); // Reference for the timer

//   const images = isMobile ? mobileImages : desktopImages;

//   // Get the duration dynamically
//   const getSlideDuration = () => {
//     return isMobile
//       ? mobileDurations[currentIndex % mobileDurations.length] // Mobile durations
//       : typewriterContents[currentIndex % typewriterContents.length]?.duration || 10000; // Desktop durations
//   };

//   // Function to reset the timer
//   const resetTimer = () => {
//     if (timerRef.current) clearTimeout(timerRef.current);

//     const duration = getSlideDuration();
//     timerRef.current = setTimeout(() => {
//       setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
//     }, duration);
//   };

//   // Handle resizing to toggle between mobile and desktop
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };

//     window.addEventListener('resize', handleResize);
//     return () => {
//       window.removeEventListener('resize', handleResize);
//       if (timerRef.current) clearTimeout(timerRef.current);
//     };
//   }, []);

//   // Handle slide transitions and timers
//   useEffect(() => {
//     resetTimer(); // Reset the timer on slide change
//     return () => {
//       if (timerRef.current) clearTimeout(timerRef.current); // Clear on unmount
//     };
//   }, [currentIndex, isMobile]); // Re-run on state changes

//   // Handle manual scrolling button clicks
//   const handleScrollButtonClick = (index) => {
//     setCurrentIndex(index);
//     resetTimer(); // Reset the timer after a manual scroll
//   };

//   const handleLearnMoreClick = () => {
//     navigate("/MainAbout");
//   };

//   return (
//     <section className="home123">
      
//       <div
//         className="hero-image"
//         style={{
//           backgroundImage: `url(${images[currentIndex]})`,
//           backgroundSize: 'cover',
//           backgroundPosition: 'center',
//           backgroundRepeat: 'no-repeat',
//         }}
//       >
//         <div className="hero-card">
//           <h1 className="hero-card-title3">Welcome to</h1>
//           <h2 className="hero-card-title">Sukalpa Tech Solutions</h2>
//           <p className="hero-card-description">Let us join to support you deserve</p>
//           <button className="learn-moree-btn" onClick={handleLearnMoreClick}>
//             Learn More
//           </button>
  
//         </div>

//         {/* Conditionally render Typewriter effect only for desktop */}
//         {!isMobile && (
//           <div className={`dynamic-box dynamic-box-${currentIndex + 1}`}>
//             <div className="box-content">
//               <Typewriter
//                 options={{
//                   strings: [typewriterContents[currentIndex]?.text || ''],
//                   autoStart: true,
//                   delay: 50,
//                   onStart: () => setIsTyping(true),
//                   onComplete: () => setIsTyping(false),
//                 }}
//               />
//             </div>
//           </div>
//         )}

//         <div className="scrolling-buttons">
//           {images.map((_, index) => (
//             <button
//               key={index}
//               className={`scroll-btn ${index === currentIndex ? 'active' : ''}`}
//               onClick={() => handleScrollButtonClick(index)}
//             ></button>
//           ))}
//         </div>
//       </div>
     
//       <div className="HomeServices">
//         <Services />
//       </div>
//       <div className="HomeServices1">
//         <HomologationFirst />
//       </div>
//       <div className="HomeServices3">
//         <About />
//       </div>

//     </section>
//   );
// };

// export default Home;

import React, { useState } from 'react';
import './Home.css';

function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('Login successful!');
        setErrorMsg('');
        console.log('User data:', data);
      } else {
        setErrorMsg(data.message || 'Login failed');
        setSuccessMsg('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Server error. Please try again later.');
      setSuccessMsg('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <h1>Welcome to</h1>
          <h2>Pulse work</h2>
          <p>
            PUNCH IN PUNCH OUT with Geolocation and face detection App Categorized Recruitment approval process with related...
          </p>
        </div>
        <div className="login-right">
          <h2>Sign Up</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Your user name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <a href="/">Forget Password?</a>
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" /> I agree to the Terms of Service.
              </label>
            </div>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            {successMsg && <p className="success-msg">{successMsg}</p>}
            <button type="submit" className="login-btn">Sign In</button>
          </form>
        </div>
 DMP       </div>
    </div>
  );
}

export default Home;