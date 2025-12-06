"use client";

import React, { useState, useRef, useEffect } from "react";
import { api, isAuthenticated, getFileUrl } from '@/utils/api';
import { useRouter } from "next/navigation";
import "./receipt.css";

const Page = () => {
  const router = useRouter();

  // ===== بيانات المستلم =====
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [number, setNumber] = useState("");

  // ===== المواد =====
  const [materials, setMaterials] = useState([
    { materialName: "", type: "", materialNumber: "", quantity: "", itemId: "" },
  ]);

  // ===== اقتراحات البحث =====
  const [suggestions, setSuggestions] = useState([]);
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(null);

  // ===== توقيع المدير =====
  const [managerSign, setManagerSign] = useState(false);

  // ===== Canvas للتوقيع =====
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [canvasData, setCanvasData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ===== التحقق من تسجيل الدخول =====
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("❌ يجب تسجيل الدخول كمسؤول للوصول لهذه الصفحة");
      router.push("/login");
    }
  }, [router]);

  // ===== تهيئة Canvas =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      context.lineWidth = 2;
      context.strokeStyle = "#1149e0";
      context.lineCap = "round";
      setCtx(context);

      if (canvasData) {
        const img = new Image();
        img.src = canvasData;
        img.onload = () => context.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [canvasData]);

  // ===== وظائف الرسم =====
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    if (!ctx) return;
    const { x, y } = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || !ctx) return;
    const { x, y } = getMousePos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setDrawing(false);

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCanvasData(null);
  };

  // ===== إضافة مادة =====
  const addMaterial = () => {
    setMaterials([
      ...materials,
      { materialName: "", type: "", materialNumber: "", quantity: "", itemId: "" },
    ]);
  };

  // ===== تحديث المادة + البحث التلقائي =====
  const handleMaterialChange = async (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = value;
    setMaterials(updated);

    if (["materialName", "type", "materialNumber"].includes(field) && value.trim()) {
      setActiveMaterialIndex(index);

      try {
        const res = await api.searchItems(value.trim());

        if (!res.ok) {
          console.error("❌ فشل البحث:", res.status);
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ خطأ في البحث:", err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setActiveMaterialIndex(null);
    }
  };

  const selectSuggestion = (index, sug) => {
    const updated = [...materials];
    updated[index] = {
      materialName: sug.itemName,
      type: sug.itemType,
      materialNumber: sug.itemNumber,
      quantity: updated[index].quantity,
      itemId: sug._id,
    };
    setMaterials(updated);
    setSuggestions([]);
    setActiveMaterialIndex(null);
  };

  // ===== إرسال البيانات للسيرفر =====
  const handleSubmit = async () => {
    if (!canvasRef.current) return;

    // التحقق من البيانات
    if (!name || !rank || !number) {
      alert("⚠️ يرجى إدخال بيانات المستلم كاملة");
      return;
    }

    if (materials.some((m) => !m.itemId || !m.quantity)) {
      alert("⚠️ يرجى اختيار جميع المواد وإدخال الكميات");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some((channel) => channel !== 0);

    if (!hasSignature) {
      alert("⚠️ يرجى توقيع المستلم");
      return;
    }

    setLoading(true);

    const receiverSignature = canvas.toDataURL("image/png");

    const dataToSend = {
      receiver: { name, rank, number },
      items: materials.map((mat) => ({
        item: mat.itemId,
        quantity: Number(mat.quantity),
      })),
      receiverSignature,
      managerSign,
    };

    try {
      const res = await api.addReceipt(dataToSend);
      const result = await res.json();

      if (res.ok) {
        alert("✅ تم إضافة السند بنجاح!");
        
        if (result.pdfUrl) {
          const downloadLink = getFileUrl(result.pdfUrl);
          if (confirm("📄 هل تريد تحميل سند الاستلام؟")) {
            window.open(downloadLink, "_blank");
          }
        }

        // إعادة تعيين الحقول
        setName("");
        setRank("");
        setNumber("");
        setMaterials([
          { materialName: "", type: "", materialNumber: "", quantity: "", itemId: "" },
        ]);
        clearCanvas();
        setManagerSign(false);
      } else {
        alert("❌ خطأ: " + result.message);
      }
    } catch (err) {
      console.error("❌ خطأ:", err);
      alert("❌ حدث خطأ أثناء إرسال البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        direction: "rtl",
        maxWidth: "900px",
        margin: "20px auto",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* ===== بيانات الاستلام ===== */}
      <div className="receipt-container">
  <h3 className="receipt-title">بيانات الاستلام</h3>
  <div className="top">
    <input
      type="text"
      placeholder="الاسم *"
      value={name}
      onChange={(e) => setName(e.target.value)}
      disabled={loading}
      required
      className="input-field"
    />
    <select
      value={rank}
      onChange={(e) => setRank(e.target.value)}
      disabled={loading}
      required
      className="select-field"
    >
      <option value="">اختر الرتبة</option>
      <option value="جندي">جندي</option>
      <option value="جندي أول">جندي أول</option>
      <option value="عريف">عريف</option>
      <option value="رقيب">رقيب</option>
      <option value="ملازم">ملازم</option>
      <option value="نقيب">نقيب</option>
      <option value="رائد">رائد</option>
    </select>
    <input
      type="text"
      placeholder="الرقم *"
      value={number}
      onChange={(e) => setNumber(e.target.value)}
      disabled={loading}
      required
      className="input-field"
    />
  </div>
</div>

      {/* ===== المواد ===== */}
      {materials.map((mat, index) => (
        <div
          key={index}
          style={{
            padding: "15px",
            borderRadius: "8px",
            border: "2px solid #255aeb",
            backgroundColor: "#eff5ff",
            marginBottom: "15px",
            position: "relative",
          }}
        >
          <h4 style={{ margin: "0 0 12px 0", color: "#255aeb" }}>
            بيانات المادة {index + 1}
          </h4>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="اسم المادة"
                value={mat.materialName}
                onChange={(e) => handleMaterialChange(index, "materialName", e.target.value)}
                onFocus={() => {
                  if (mat.materialName.trim() && suggestions.length > 0)
                    setActiveMaterialIndex(index);
                }}
                onBlur={() => setTimeout(() => setActiveMaterialIndex(null), 200)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  opacity: loading ? 0.6 : 1,
                }}
              />

              {activeMaterialIndex === index && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#fff",
                    border: "2px solid #255aeb",
                    borderRadius: "5px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    marginTop: "5px",
                  }}
                >
                  {suggestions.map((sug) => (
                    <div
                      key={sug._id}
                      onMouseDown={() => selectSuggestion(index, sug)}
                      onTouchStart={() => selectSuggestion(index, sug)}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f0f7ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      <div style={{ fontWeight: "bold", color: "#255aeb" }}>
                        {sug.itemName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                        {sug.itemType} - {sug.itemNumber}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="نوع المادة"
              value={mat.type}
              onChange={(e) => handleMaterialChange(index, "type", e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="رقم المادة"
              value={mat.materialNumber}
              onChange={(e) => handleMaterialChange(index, "materialNumber", e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                opacity: loading ? 0.6 : 1,
              }}
            />
            <input
              type="number"
              placeholder="الكمية"
              value={mat.quantity}
              onChange={(e) => handleMaterialChange(index, "quantity", e.target.value)}
              disabled={loading}
              min="1"
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: "border-box",
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addMaterial}
        disabled={loading}
        style={{
          width: "100%",
          marginBottom: "20px",
          backgroundColor: "#255aeb",
          color: "white",
          border: "none",
          padding: "12px",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: "bold",
          opacity: loading ? 0.6 : 1,
        }}
      >
        ➕ إضافة مادة
      </button>

      {/* ===== التوقيع ===== */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>توقيع المستلم</h4>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "200px",
            border: "2px solid #255aeb",
            borderRadius: "5px",
            touchAction: "none",
            backgroundColor: "#fff",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button
          onClick={clearCanvas}
          disabled={loading}
          style={{
            display: "flex",
            margin: "10px auto",
            backgroundColor: "#e25454",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          🗑️ مسح التوقيع
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="checkbox"
            checked={managerSign}
            onChange={(e) => setManagerSign(e.target.checked)}
            disabled={loading}
          />
          <span>توقيع مدير</span>
        </label>
      </div>

      {/* ===== الأزرار ===== */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "#255aeb",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "⏳ جاري الاستلام..." : "✅ تأكيد الاستلام"}
        </button>
        <button
          onClick={() => {
            if (confirm("هل أنت متأكد من الإلغاء؟")) {
              setName("");
              setRank("");
              setNumber("");
              setMaterials([
                { materialName: "", type: "", materialNumber: "", quantity: "", itemId: "" },
              ]);
              clearCanvas();
              setManagerSign(false);
            }
          }}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "#e25454",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            opacity: loading ? 0.6 : 1,
          }}
        >
          ❌ إلغاء
        </button>
      </div>
    </div>
  );
};

export default Page;