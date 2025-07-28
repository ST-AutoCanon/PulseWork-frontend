//////////////////////////
/////////////////////

import React from "react";
import "./Broucherfirst.css"; // Updated CSS file name
import Broucher from "../Broucher/Broucher";
// Details of Cards
const Broucherfirst = () => {
  const cardData = [
    { title: "Software Development", description: "We build reliable software solutions.", imgPath: "./images/logo.png" },
    { title: "Application Development", description: "Custom applications tailored to your needs.", imgPath: "./images/logo.png" },
    { title: "Website Design & Development", description: "Creative and responsive web solutions.", imgPath: "./images/logo.png" },
    { title: "Maintenance & Enhancement", description: "Ensure systems run smoothly and efficiently.", imgPath: "./images/logo.png" },
    { title: "Campus & Wireless", description: "Seamless connectivity solutions.", imgPath: "./images/logo.png" },
    { title: "Cloud Solutions", description: "Scalable and secure cloud integrations.", imgPath: "./images/logo.png" },
    { title: "IT Consulting", description: "Strategic IT guidance to grow your business.", imgPath: "./images/logo.png" },
    { title: "Testing & QA", description: "Thorough testing for flawless products.", imgPath: "./images/logo.png" },
    { title: "Cloud Solutions", description: "Reliable and future-ready cloud services.", imgPath: "./images/logo.png" },
  ];

  return (
    <>
      {/* Container for Broucher */}
      <div className="broucherfirstpage-container">
        <div className="broucherfirstpage-image-section">
          <img src="./images/KnowMore.png" alt="About Us" className="broucherfirstpage-about-image" />
        </div>
        <div className="broucherfirstpage-text-section">
          <h1>Know More</h1>
          <p>Our journey, our purpose—Knowmore about us</p>
        </div>
      </div>
      
      {/* <EMobilitySolutions /> */}
      <Broucher />
    </>
  );
};

export default Broucherfirst;
