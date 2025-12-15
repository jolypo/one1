"use client";

import React, { useState, useEffect } from 'react';
import { api, getFileUrl } from '@/utils/api';
import "./home.css";

const Page = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ✅ جلب البيانات باستخدام api.js
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ✅ استخدام api.getAllReceipts
      const res = await api.getAllReceipts({ search, limit, page });

      if (!res.ok) {
        setData([]);
        return;
      }

      const result = await res.json();
      setData(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
      
    } catch (err) {
      console.error("❌ خطأ:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // تحديث البيانات عند التغيير
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, limit, page]);

  const headers = [
    "عدد",
    "الرتبة",
    "الاسم",
    "الرقم",
    "المواد المستلمة",
    "المواد في العهدة",
    "سند استلام",
    "سند تسليم",
  ];

  return (
    <div>
      <div className='container'> 
        <div className='top'>
          <p>الصفحة الرئيسة</p>

          <div className='topTols'>
            <div className='serch'>
              <input 
                type="search" 
                placeholder="ابحث بالاسم أو الرقم..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <button type="button">🔍</button>
            </div> 

            <div className='count'>
              <label>إظهار</label> 
              <select 
                name="limit" 
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value);
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div> 
          </div>
        </div>  

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", fontSize: "18px", color: "#666" }}>
            ⏳ جاري التحميل...
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", fontSize: "16px", color: "#999" }}>
            📭 لا توجد بيانات
          </div>
        ) : (
          <>
            <div style={{ textAlign: "right", padding: "10px", color: "#666", fontSize: "14px" }}>
              إجمالي الأشخاص: <strong>{total}</strong> | الصفحة: <strong>{page}</strong> من <strong>{totalPages}</strong>
            </div>

            <div className="table-wrapper">
              <table className="my-table" dir="rtl">
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((person, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td>{(page - 1) * limit + rowIndex + 1}</td>
                      <td>{person.rank}</td>
                      <td>{person.name}</td>
                      <td>{person.number}</td>
                      
                      {/* المواد المستلمة */}
                      <td>
                        <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                          {person.receivedItems.map((item, idx) => (
                            <div key={idx} style={{ marginBottom: "4px" }}>
                              • {item.name} ({item.type}) - رقم: {item.number} - كمية: <strong>{item.quantity}</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* المواد في العهدة */}
                      <td>
                        {person.itemsInCustody.length > 0 ? (
                          <div style={{ 
                            fontSize: "11px", 
                            lineHeight: "1.6",
                            backgroundColor: "#fff3cd",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ffc107"
                          }}>
                            {person.itemsInCustody.map((item, idx) => (
                              <div key={idx} style={{ marginBottom: "4px", color: "#856404", fontWeight: "bold" }}>
                                🔒 {item.name} - كمية: {item.quantity}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#28a745", 
                            fontWeight: "bold",
                            backgroundColor: "#d4edda",
                            padding: "6px",
                            borderRadius: "4px",
                            textAlign: "center"
                          }}>
                            ✅ تم التسليم الكامل
                          </div>
                        )}
                      </td>

                      {/* سندات الاستلام */}
                      <td>
                        {person.receiptReceipts.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {person.receiptReceipts.map((receipt, idx) => (
                              <button
                                key={idx}
                                onClick={() => window.open(receipt.pdfUrl, "_blank", "noopener,noreferrer")
                                style={{
                                  backgroundColor: "#255aeb",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 10px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                📄 سند {idx + 1} ({new Date(receipt.date).toLocaleDateString("ar-SA")})
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#999", fontSize: "12px" }}>-</span>
                        )}
                      </td>

                      {/* سندات التسليم */}
                      <td>
                        {person.deliveryReceipts.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {person.deliveryReceipts.map((delivery, idx) => (
                              <button
                                key={idx}
                                onClick={() => window.open(getFileUrl(`/delivery/${delivery.fileName}`), "_blank")}
                                style={{
                                  backgroundColor: "#4caf50",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 10px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                📄 سند {idx + 1} ({new Date(delivery.date).toLocaleDateString("ar-SA")})
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#856404",
                            backgroundColor: "#fff3cd",
                            padding: "6px",
                            borderRadius: "4px",
                            textAlign: "center",
                            border: "1px solid #ffc107"
                          }}>
                            🔒 في العهدة
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              marginTop: "20px",
              padding: "20px"
            }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  backgroundColor: page === 1 ? "#ccc" : "#255aeb",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: page === 1 ? "not-allowed" : "pointer"
                }}
              >
                السابق
              </button>

              <span style={{ fontSize: "14px", color: "#666" }}>
                صفحة {page} من {totalPages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                style={{
                  backgroundColor: page === totalPages ? "#ccc" : "#255aeb",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: page === totalPages ? "not-allowed" : "pointer"
                }}
              >
                التالي
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Page;
