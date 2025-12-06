"use client";

import React, { useState, useRef, useEffect } from "react";
import { api, isAuthenticated, getFileUrl } from '@/utils/api';
import { useRouter } from "next/navigation";
import "./page.css";

const DeliveryPage = () => {
  const router = useRouter();

  // ===== بيانات المستلم =====
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [number, setNumber] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ===== المواد =====
  const [materials, setMaterials] = useState(() => {
    if (typeof window !== "undefined") {
      const savedMaterials = localStorage.getItem("deliveryMaterials");
      return savedMaterials ? JSON.parse(savedMaterials) : [
        { materialName: "", type: "", materialNumber: "", quantity: "" }
      ];
    }
    return [{ materialName: "", type: "", materialNumber: "", quantity: "" }];
  });

  const [availableItems, setAvailableItems] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(null);

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

  // ===== تهيئة الـ canvas =====
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

  const stopDrawing = () => {
    setDrawing(false);
    if (ctx && canvasRef.current) {
      setCanvasData(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCanvasData(null);
  };

  // ===== البحث عن الأشخاص =====
  useEffect(() => {
    if (!name || name.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.searchDelivery(name.trim());

        if (!res.ok) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("❌ خطأ في البحث:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [name]);

  // ===== عند اختيار شخص من الاقتراحات =====
  const handleSelectSuggestion = async (receiver) => {
    setName(receiver.name);
    setRank(receiver.rank);
    setNumber(receiver.number);
    setShowSuggestions(false);
    setSuggestions([]);
    await fetchAvailableItems(receiver.name, receiver.rank, receiver.number);
  };

  // ===== جلب المواد المتاحة للتسليم =====
  const fetchAvailableItems = async (personName, personRank, personNumber) => {
    try {
      const res = await api.getPersonItems({
        name: personName,
        rank: personRank,
        number: personNumber
      });

      if (!res.ok) {
        setAvailableItems([]);
        return;
      }

      const data = await res.json();
      setAvailableItems(data);
    } catch (err) {
      console.error("❌ خطأ:", err);
      setAvailableItems([]);
    }
  };

  // ===== إدارة المواد =====
  const addMaterial = () => {
    setMaterials([
      ...materials,
      { materialName: "", type: "", materialNumber: "", quantity: "" },
    ]);
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = value;
    setMaterials(updated);
  };

  const selectItemSuggestion = (index, item) => {
    const updated = [...materials];
    updated[index] = {
      materialName: item.itemName,
      type: item.itemType,
      materialNumber: item.itemNumber,
      quantity: "",
    };
    setMaterials(updated);
    setActiveItemIndex(null);
  };

  // ===== حفظ المواد في localStorage =====
  useEffect(() => {
    localStorage.setItem("deliveryMaterials", JSON.stringify(materials));
  }, [materials]);

  // ===== إرسال البيانات =====
  const handleSubmit = async () => {
    if (!name || !rank || !number) {
      alert("⚠️ يرجى ملء بيانات المستلم كاملة");
      return;
    }

    if (materials.length === 0 || materials.some((m) => !m.materialName || !m.quantity)) {
      alert("⚠️ يرجى إضافة مادة واحدة على الأقل مع الكمية");
      return;
    }

    // التحقق من الكميات المتاحة
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      const availableItem = availableItems.find(
        (item) => item.itemName === mat.materialName && item.itemNumber === mat.materialNumber
      );

      if (availableItem && Number(mat.quantity) > availableItem.quantity) {
        alert(
          `❌ الكمية المطلوبة للمادة "${mat.materialName}" (${mat.quantity}) أكبر من الكمية المتاحة (${availableItem.quantity})`
        );
        return;
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some((channel) => channel !== 0);

    if (!hasSignature) {
      alert("⚠️ يرجى توقيع المستلم");
      return;
    }

    setLoading(true);

    try {
      const receiverSignature = canvas.toDataURL("image/png");

      const dataToSend = {
        receiver: { name, rank, number },
        items: materials,
        receiverSignature,
        managerSign,
      };

      const res = await api.addDelivery(dataToSend);
      const result = await res.json();

      if (res.ok) {
        alert("✅ تم التسليم بنجاح!");
        if (result.pdfUrl) {
          const downloadLink = getFileUrl(result.pdfUrl);
          if (confirm("📄 هل تريد تحميل سند التسليم؟")) {
            window.open(downloadLink, "_blank");
          }
        }

        // إعادة تعيين الحقول
        setName("");
        setRank("");
        setNumber("");
        setMaterials([{ materialName: "", type: "", materialNumber: "", quantity: "" }]);
        setAvailableItems([]);
        clearCanvas();
        setManagerSign(false);
        localStorage.removeItem("deliveryMaterials");
      } else {
        alert("❌ " + (result.message || "حدث خطأ أثناء التسليم"));
      }
    } catch (err) {
      console.error("❌ خطأ:", err);
      alert("❌ حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // ===== الصفحة =====
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
      {/* بيانات المستلم */}
      <div
        className="top"
        style={{
          backgroundColor: "#c7a7a2",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#fff" }}>بيانات التسليم</h3>
        <div className="topTols" style={{ display: "flex", gap: "10px", position: "relative" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 ابحث عن اسم المستلم..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #255aeb",
                borderRadius: "5px",
                fontSize: "14px",
              }}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: "2px solid #255aeb",
                  borderRadius: "5px",
                  maxHeight: "250px",
                  overflowY: "auto",
                  zIndex: 9999,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  marginTop: "5px",
                }}
              >
                {suggestions.map((item) => (
                  <div
                    key={item.receiver.number}
                    onMouseDown={() => handleSelectSuggestion(item.receiver)}
                    style={{
                      padding: "12px 15px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f7ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <div style={{ fontWeight: "bold", color: "#255aeb", marginBottom: "3px" }}>
                      {item.receiver.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {item.receiver.rank} - {item.receiver.number}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            style={{
              padding: "12px",
              border: "2px solid #255aeb",
              borderRadius: "5px",
              fontSize: "14px",
              minWidth: "150px",
            }}
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
            placeholder="الرقم"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            style={{
              padding: "12px",
              border: "2px solid #255aeb",
              borderRadius: "5px",
              fontSize: "14px",
              minWidth: "150px",
            }}
          />
        </div>
      </div>

      {/* المواد المتاحة */}
      {availableItems.length > 0 && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            borderRadius: "5px",
            marginBottom: "15px",
            textAlign: "center",
            color: "#2e7d32",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          📦 تم العثور على {availableItems.length} مادة متاحة للتسليم
        </div>
      )}

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
          <h4 style={{ margin: "0 0 12px 0", color: "#255aeb" }}>بيانات المادة {index + 1}</h4>

          <div className="itemTols" style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="اسم المادة"
                value={mat.materialName}
                onChange={(e) => handleMaterialChange(index, "materialName", e.target.value)}
                onFocus={() => {
                  if (availableItems.length > 0) setActiveItemIndex(index);
                }}
                onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              />

              {activeItemIndex === index && availableItems.length > 0 && (
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
                  {availableItems.map((item) => (
                    <div
                      key={item.itemNumber}
                      onMouseDown={() => selectItemSuggestion(index, item)}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f7ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <div style={{ fontWeight: "bold", color: "#255aeb" }}>{item.itemName}</div>
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                        {item.itemType} - {item.itemNumber}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#2e7d32",
                          marginTop: "2px",
                          fontWeight: "bold",
                        }}
                      >
                        الكمية المتاحة: {item.quantity}
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
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="رقم المادة"
              value={mat.materialNumber}
              onChange={(e) => handleMaterialChange(index, "materialNumber", e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
              }}
            />
            <input
              type="number"
              placeholder="الكمية"
              value={mat.quantity}
              min="1"
              onChange={(e) => handleMaterialChange(index, "quantity", e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: "border-box",
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
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

      {/* التوقيع */}
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

      {/* الأزرار */}
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
          {loading ? "⏳ جاري التسليم..." : "✅ تأكيد التسليم"}
        </button>
        <button
          onClick={() => {
            if (confirm("هل أنت متأكد من الإلغاء؟")) {
              setName("");
              setRank("");
              setNumber("");
              setMaterials([{ materialName: "", type: "", materialNumber: "", quantity: "" }]);
              setAvailableItems([]);
              clearCanvas();
              setManagerSign(false);
              localStorage.removeItem("deliveryMaterials");
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

export default DeliveryPage;