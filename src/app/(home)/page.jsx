"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/utils/api";
import "./home.css";

const Page = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  /* ================== جلب البيانات ================== */
  const fetchData = async () => {
    try {
      setLoading(true);

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

  useEffect(() => {
    const t = setTimeout(fetchData, 500);
    return () => clearTimeout(t);
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

  /* ================== العرض ================== */
  return (
    <div className="container">
      {/* ======= الأعلى ======= */}
      <div className="top">
        <p>الصفحة الرئيسة</p>

        <div className="topTols">
          <div className="serch">
            <input
              type="search"
              placeholder="ابحث بالاسم أو الرقم..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button>🔍</button>
          </div>

          <div className="count">
            <label>إظهار</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======= المحتوى ======= */}
      {loading ? (
        <div className="loading">⏳ جاري التحميل...</div>
      ) : data.length === 0 ? (
        <div className="empty">📭 لا توجد بيانات</div>
      ) : (
        <>
          <div className="info">
            إجمالي الأشخاص: <strong>{total}</strong> | الصفحة{" "}
            <strong>{page}</strong> من <strong>{totalPages}</strong>
          </div>

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
                {data.map((person, index) => (
                  <tr key={index}>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{person.rank}</td>
                    <td>{person.name}</td>
                    <td>{person.number}</td>

                    {/* المواد المستلمة */}
                    <td>
                      {person.receivedItems.map((it, i) => (
                        <div key={i}>
                          • {it.name} ({it.type}) – كمية:{" "}
                          <strong>{it.quantity}</strong>
                        </div>
                      ))}
                    </td>

                    {/* المواد في العهدة */}
                    <td>
                      {person.itemsInCustody.length ? (
                        person.itemsInCustody.map((it, i) => (
                          <div key={i}>🔒 {it.name} – {it.quantity}</div>
                        ))
                      ) : (
                        <span className="ok">✅ تم التسليم</span>
                      )}
                    </td>

                    {/* ✅ سندات الاستلام - التعديل هنا */}
                    <td>
                      {person.receiptReceipts.length ? (
                        person.receiptReceipts.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              // ✅ تحقق من وجود pdfUrl وصحته
                              if (r.pdfUrl && r.pdfUrl.startsWith('http')) {
                                window.open(r.pdfUrl, "_blank", "noopener");
                              } else {
                                alert('رابط الملف غير صحيح');
                                console.error('❌ رابط خاطئ:', r);
                              }
                            }}
                          >
                            📄 سند {i + 1}
                          </button>
                        ))
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* ✅ سندات التسليم - التعديل هنا */}
                    <td>
                      {person.deliveryReceipts.length ? (
                        person.deliveryReceipts.map((d, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              // ✅ تحقق من وجود pdfUrl وصحته
                              if (d.pdfUrl && d.pdfUrl.startsWith('http')) {
                                window.open(d.pdfUrl, "_blank", "noopener");
                              } else {
                                alert('رابط الملف غير صحيح');
                                console.error('❌ رابط خاطئ:', d);
                              }
                            }}
                          >
                            📄 سند {i + 1}
                          </button>
                        ))
                      ) : (
                        <span className="lock">🔒 في العهدة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ======= Pagination ======= */}
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              السابق
            </button>

            <span>
              صفحة {page} من {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              التالي
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
