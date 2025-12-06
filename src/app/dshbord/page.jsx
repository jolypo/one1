"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, isAuthenticated } from '@/utils/api';
import "./dshbord.css";

const Dashboard = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oprator, setOprator] = useState("user");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editPassword, setEditPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // ✅ التحقق من تسجيل الدخول
  useEffect(() => {
    if (!isAuthenticated()) {
      alert("⚠️ يرجى تسجيل الدخول");
      router.push("/login");
      return;
    }
    fetchUsers();
  }, [router]);

  // ✅ جلب المستخدمين
  const fetchUsers = async () => {
    setFetchLoading(true);
    try {
      const res = await api.getAllUsers();
      
      if (!res.ok) {
        if (res.status === 401) {
          alert("⚠️ انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى");
          router.push("/login");
          return;
        }
        throw new Error("فشل جلب المستخدمين");
      }

      const data = await res.json();
      console.log("✅ المستخدمين:", data);
      if (Array.isArray(data)) setUsers(data);
      else setUsers([]);
    } catch (err) {
      console.error("❌ خطأ:", err);
      alert("❌ حدث خطأ أثناء جلب المستخدمين");
    } finally {
      setFetchLoading(false);
    }
  };

  // ✅ إضافة مستخدم جديد
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("⚠️ يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);

    const newUser = { 
      username: name.trim(), 
      email: email.trim(), 
      password, 
      role: oprator 
    };

    try {
      const res = await api.addUser(newUser);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل إنشاء المستخدم");
      }

      const createdUser = await res.json();
      setUsers([...users, createdUser]);

      // إعادة تعيين الحقول
      setName("");
      setEmail("");
      setPassword("");
      setOprator("user");

      alert("✅ تم إضافة المستخدم بنجاح");
    } catch (err) {
      console.error("❌ خطأ:", err);
      alert("❌ فشل إضافة المستخدم: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ تحديث كلمة المرور
  const handleUpdatePassword = async (id, newPassword, index) => {
    if (!newPassword || newPassword.trim().length < 6) {
      alert("⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      const res = await api.updateUser(id, { password: newPassword });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل تحديث كلمة المرور");
      }

      const updatedUsers = [...users];
      updatedUsers[index].password = newPassword;
      setUsers(updatedUsers);

      setEditIndex(null);
      setEditPassword("");

      alert("✅ تم تحديث كلمة المرور بنجاح");
    } catch (err) {
      console.error("❌ خطأ:", err);
      alert("❌ فشل تحديث كلمة المرور: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: "50px",
        fontSize: "18px",
        color: "#666"
      }}>
        ⏳ جاري تحميل البيانات...
      </div>
    );
  }

  return (
    <div className="container">
      <div className="top-dshbord">
        <p>مستخدم جديد</p>
        <form onSubmit={handleSubmit}>
          <div className="newuser">
            <div className="field">
              <label>الاسم *</label>
              <input
                type="text"
                placeholder="الاسم"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="field">
              <label>الايميل *</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="field count-dshbord">
              <label>نوع صلاحية</label>
              <select
                value={oprator}
                onChange={(e) => setOprator(e.target.value)}
                disabled={loading}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="field">
              <label>كلمة المرور *</label>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    cursor: loading ? "not-allowed" : "pointer",
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
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "⏳ جاري الإضافة..." : "➕ اضافة"}
            </button>
          </div>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="my-table" dir="rtl">
          <thead>
            <tr>
              <th>عدد</th>
              <th>الاسم</th>
              <th>الايميل</th>
              <th>نوع الصلاحية</th>
              <th>كلمة المرور</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                  🚫 لا يوجد مستخدمين
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={user._id || index}
                  className={index % 2 === 0 ? "even-row" : "odd-row"}
                >
                  <td>{index + 1}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      backgroundColor: user.role === "admin" ? "#e3f2fd" : "#f3e5f5",
                      color: user.role === "admin" ? "#1976d2" : "#7b1fa2",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {editIndex === index ? (
                      <input
                        className="input_pass"
                        type="password"
                        placeholder="كلمة المرور الجديدة"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                      />
                    ) : (
                      "••••••••"
                    )}
                  </td>
                  <td>
                    {editIndex === index ? (
                      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                        <button
                          className="confo_btn"
                          onClick={() =>
                            handleUpdatePassword(user._id, editPassword, index)
                          }
                          disabled={loading}
                          style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? "not-allowed" : "pointer"
                          }}
                        >
                          {loading ? "⏳" : "✅"}
                        </button>
                        <button
                          className="update_btn"
                          onClick={() => {
                            setEditIndex(null);
                            setEditPassword("");
                          }}
                          disabled={loading}
                          style={{
                            backgroundColor: "#e25454",
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? "not-allowed" : "pointer"
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    ) : (
                      <button
                        className="update_btn"
                        onClick={() => {
                          setEditIndex(index);
                          setEditPassword("");
                        }}
                        disabled={loading}
                        style={{
                          opacity: loading ? 0.6 : 1,
                          cursor: loading ? "not-allowed" : "pointer"
                        }}
                      >
                        ✏️ تعديل
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;