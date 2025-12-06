"use client";

import React, { useEffect, useState } from "react";
import { api, isAuthenticated } from '@/utils/api';
import { useRouter } from "next/navigation";
import "./storge.css";

const Page = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(10);

  // ===== التحقق من تسجيل الدخول =====
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("❌ يجب تسجيل الدخول كمسؤول للوصول لهذه الصفحة");
      router.push("/login");
      return;
    }
  }, [router]);

  // ===== جلب البيانات مع debounce =====
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        let res;
        
        if (searchQuery && searchQuery.trim().length > 0) {
          // استخدام البحث
          res = await api.searchItems(searchQuery.trim());
        } else {
          // جلب جميع المواد
          res = await api.getAllItems();
        }

        if (!res.ok) {
          throw new Error("فشل في جلب البيانات");
        }

        const data = await res.json();
        setItems(data);
        setError(null);
      } catch (err) {
        console.error("❌ خطأ:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 500); // ⬅️ تأخير نصف ثانية لتقليل الطلبات

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const headers = ["#", "اسم المادة", "نوع المادة", "رقم المادة", "الكمية"];

  // ===== عرض المواد المحدودة حسب الـ limit =====
  const displayedItems = items.slice(0, limit);

  if (error) {
    return (
      <div className="container">
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            backgroundColor: "#fee",
            color: "#c33",
            borderRadius: "10px",
            margin: "20px",
          }}
        >
          ❌ خطأ أثناء جلب البيانات: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="top-storge">
        <p>قائمة المواد</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="serch-storge">
            <input
              type="search"
              placeholder="🔍 بحث بالاسم أو النوع أو الرقم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "10px",
                border: "2px solid #255aeb",
                borderRadius: "5px",
                fontSize: "14px",
                width: "100%",
              }}
            />
          </div>
          <div className="count">
            <label>إظهار</label>
            <select 
              name="limit" 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                padding: "8px",
                border: "2px solid #255aeb",
                borderRadius: "5px",
                fontSize: "14px",
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </form>
      </div>

      {loading ? (
        <div
          style={{
            padding: "50px",
            textAlign: "center",
            fontSize: "18px",
            color: "#666",
          }}
        >
          ⏳ جاري تحميل البيانات...
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="my-table" dir="rtl">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {displayedItems.length > 0 ? (
                displayedItems.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.itemName}</td>
                    <td>{item.itemType}</td>
                    <td>{item.itemNumber}</td>
                    <td>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          backgroundColor:
                            item.qin > 50 ? "#e8f5e9" : item.qin > 10 ? "#fff3e0" : "#ffebee",
                          color: item.qin > 50 ? "#2e7d32" : item.qin > 10 ? "#e65100" : "#c62828",
                          fontWeight: "bold",
                        }}
                      >
                        {item.qin}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headers.length}
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#888",
                      fontSize: "16px",
                    }}
                  >
                    {searchQuery
                      ? "🚫 لا يوجد مواد مطابقة للبحث"
                      : "📦 لا يوجد مواد في المخزن"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

      
        </div>
      )}
    </div>
  );
};

export default Page;