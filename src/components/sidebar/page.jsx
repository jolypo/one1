"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./sidebar.css";

const Sidebar = ({ open, setOpen }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // ✅ جلب بيانات المستخدم من localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }
  }, []);

  // ✅ تسجيل الخروج (بدون confirm)
  const handleLogout = () => {
    // حذف البيانات من localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // التوجيه لصفحة تسجيل الدخول
    router.push("/login");
  };

  // ✅ قائمة العناصر مع الصلاحيات
  const allItems = [
    { 
      name: "الرئيسية", 
      path: "/", 
      icon: "🏠",
      roles: ["user", "admin"]
    },
    { 
      name: "سند استلام", 
      path: "/receipt", 
      icon: "📝",
      roles: ["admin"]
    },
    { 
      name: "سند تسليم", 
      path: "/delivery", 
      icon: "🚚",
      roles: ["admin"]
    },
    {
      name: "المخزون",
      path: "/inventory",
      icon: "📦",
      roles: ["admin"],
      subItems: [
        { name: "إضافة منتج", path: "/additem" },
        { name: "قائمة المواد", path: "/storge" },
      ],
    },
    {
      name: "المستخدم",
      path: "/user",
      icon: "👤",
      roles: ["user", "admin"],
      subItems: [
        { 
          name: "لوحة التحكم", 
          path: "/dshbord",
          roles: ["admin"]
        },
        { 
          name: "تسجيل الخروج", 
          path: "/logout",
          roles: ["user", "admin"],
          isLogout: true
        },
      ],
    },
  ];

  // ✅ تصفية العناصر حسب الصلاحية
  const getFilteredItems = () => {
    if (!userRole) return [];

    return allItems
      .filter(item => item.roles.includes(userRole))
      .map(item => {
        if (item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(
              subItem => !subItem.roles || subItem.roles.includes(userRole)
            )
          };
        }
        return item;
      });
  };

  const items = getFilteredItems();

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const handleNavigation = (path, isLogout) => {
    if (isLogout) {
      handleLogout(); // ✅ تسجيل خروج فوري بدون confirm
    } else {
      router.push(path);
      setOpen(false);
    }
  };

  if (!userRole) {
    return (
      <div className={`sidebar ${open ? "show" : ""}`}>
        <div style={{ 
          padding: "20px", 
          textAlign: "center", 
          color: "#666" 
        }}>
          جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div className={`sidebar ${open ? "show" : ""}`}>
      {open && (
        <div className="close" onClick={() => setOpen(false)}>
          ×
        </div>
      )}

      

      <ul>
        {items.map((item, index) => {
          const isOpen = openDropdown === index;
          return (
            <li key={index} className={`menu-block ${isOpen ? "active-block" : ""}`}>
              <div
                className="menu-item"
                onClick={() =>
                  item.subItems ? toggleDropdown(index) : handleNavigation(item.path)
                }
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.name}</span>
                {item.subItems && (
                  <span className={`arrow ${isOpen ? "open" : ""}`}>▼</span>
                )}
              </div>

              {item.subItems && isOpen && (
                <ul className="dropdown">
                  {item.subItems.map((subItem, subIndex) => (
                    <li
                      key={subIndex}
                      className="dropdown-item"
                      onClick={() => handleNavigation(subItem.path, subItem.isLogout)}
                    >
                      {subItem.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;