"use client";

import React, { useState } from "react";
import Sidebar from "../Sidebar/page";
import "./header.css";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="header">
        {/* زر الهامبرغر يظهر على الشاشات الصغيرة */}
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          ☰
        </button>

        <h1>نظام</h1>
        <img src="/globe.svg" alt="logo" />
      </div>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
    </>
  );
};

export default Header;
