"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, isAuthenticated } from '@/utils/api';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ✅ إذا كان مسجل دخول مسبقاً، انتقل للصفحة الرئيسية
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("⚠️ يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({ 
        email: email.trim(), 
        password 
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert(`✅ مرحباً ${data.user.username}!`);

        // ✅ تحويل تلقائي
        router.replace("/");
      } else {
        setError(data.message || "❌ خطأ في تسجيل الدخول");
      }
    } catch (err) {
      console.error("❌ خطأ:", err);
      setError("❌ حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          padding: "40px 30px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#255aeb",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          🔐 تسجيل الدخول
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: "#fee",
              color: "#c33",
              padding: "12px",
              borderRadius: "5px",
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "14px",
              border: "1px solid #fcc",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #ddd",
                borderRadius: "5px",
                fontSize: "14px",
                boxSizing: "border-box",
                transition: "border-color 0.3s",
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#255aeb")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              كلمة المرور
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  paddingLeft: "45px",
                  border: "2px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  transition: "border-color 0.3s",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#255aeb")}
                onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "18px",
                  opacity: loading ? 0.4 : 0.7,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? "#ccc" : "#255aeb",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = "#1a47c7";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = "#255aeb";
            }}
          >
            {loading ? "⏳ جاري تسجيل الدخول..." : "🚀 تسجيل الدخول"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "12px",
            color: "#888",
          }}
        >
          نظام إدارة المخزون © 2024
        </div>
      </div>
    </div>
  );
};

export default LoginPage;