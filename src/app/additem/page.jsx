"use client";

import React, { useState, useEffect } from "react";
import { api, isAuthenticated } from '@/utils/api';
import { useRouter } from "next/navigation";
import "./additem.css";

const Page = () => {
  const router = useRouter();
  const [materials, setMaterials] = useState([
    { materialName: "", type: "", materialNumber: "", quantity: "" },
  ]);
  const [loading, setLoading] = useState(false);

  // ===== التحقق من تسجيل الدخول =====
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("❌ يجب تسجيل الدخول كمسؤول للوصول لهذه الصفحة");
      router.push("/login");
    }
  }, [router]);

  const handleMaterialChange = (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = value;
    setMaterials(updated);
  };

  const addMaterial = () => {
    setMaterials([
      ...materials,
      { materialName: "", type: "", materialNumber: "", quantity: "" },
    ]);
  };

  const removeMaterial = (index) => {
    if (materials.length === 1) {
      alert("⚠️ يجب أن يكون هناك مادة واحدة على الأقل");
      return;
    }
    const updated = materials.filter((_, i) => i !== index);
    setMaterials(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ التحقق من البيانات
    const invalidMaterial = materials.find(
      mat => !mat.materialName || !mat.type || !mat.materialNumber || !mat.quantity
    );
    
    if (invalidMaterial) {
      alert("⚠️ يرجى ملء جميع حقول المواد");
      return;
    }

    setLoading(true);

    try {
      // ✅ إرسال المواد واحدة تلو الأخرى
      for (const mat of materials) {
        const response = await api.addItem({
          itemName: mat.materialName,
          itemType: mat.type,
          itemNumber: mat.materialNumber,
          qin: Number(mat.quantity),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "فشل إضافة المادة");
        }
      }

      alert("✅ تم إضافة جميع المواد بنجاح!");
      setMaterials([{ materialName: "", type: "", materialNumber: "", quantity: "" }]);
    } catch (err) {
      console.error("❌ خطأ:", err);
      alert("❌ حدث خطأ أثناء الإضافة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-item-container">
      <form onSubmit={handleSubmit}>
        {/* المواد */}
        {materials.map((mat, index) => (
          <div
            key={index}
            className="material-row"
            style={{
              padding: "15px",
              borderRadius: "5px",
              border: "2px solid #255aeb",
              backgroundColor: "#eff5ff",
              marginBottom: "15px",
              position: "relative",
            }}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <p style={{ margin: 0, fontWeight: "bold", color: "#255aeb" }}>
                بيانات المادة {index + 1}
              </p>
              {materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  style={{
                    backgroundColor: "#e25454",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                  title="حذف المادة"
                >
                  ×
                </button>
              )}
            </div>

            <div className="item">
              <div className="item2">
                <input
                  type="text"
                  placeholder="اسم المادة *"
                  value={mat.materialName}
                  onChange={(e) =>
                    handleMaterialChange(index, "materialName", e.target.value)
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="نوع المادة *"
                  value={mat.type}
                  onChange={(e) => handleMaterialChange(index, "type", e.target.value)}
                  required
                />
              </div>

              <div className="item2">
                <input
                  type="text"
                  placeholder="رقم المادة *"
                  value={mat.materialNumber}
                  onChange={(e) =>
                    handleMaterialChange(index, "materialNumber", e.target.value)
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="الكمية *"
                  value={mat.quantity}
                  onChange={(e) =>
                    handleMaterialChange(index, "quantity", e.target.value)
                  }
                  min="1"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="add-material"
          onClick={addMaterial}
          disabled={loading}
          style={{
            marginBottom: "20px",
            backgroundColor: "#255aeb",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "bold",
            width: "100%",
            opacity: loading ? 0.6 : 1,
          }}
        >
          ➕ إضافة مادة
        </button>

        <div className="buttons-addORcansle">
          <button
            type="submit"
            disabled={loading}
            style={{
              marginRight: "10px",
              backgroundColor: "#255aeb",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "⏳ جاري الإضافة..." : "✅ تأكيد"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("هل أنت متأكد من إلغاء جميع التعديلات؟")) {
                setMaterials([{ materialName: "", type: "", materialNumber: "", quantity: "" }]);
              }
            }}
            disabled={loading}
            style={{
              backgroundColor: "#e25454ff",
              color: "#ffffffff",
              border: "none",
              padding: "12px 24px",
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
      </form>
    </div>
  );
};

export default Page;