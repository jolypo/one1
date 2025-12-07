"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from '@/utils/api';
import "./globals.css";
import Header from "../components/header/page";
import Footer from "../components/footer/page";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  const hideLayout = pathname === "/login" || pathname === "/register";

  // ✅ التأكد من أننا في المتصفح
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ التحقق من تسجيل الدخول فقط في المتصفح
  useEffect(() => {
    if (isClient && !hideLayout && !isAuthenticated()) {
      router.push("/login");
    }
  }, [pathname, hideLayout, router, isClient]);

  // ✅ صفحات Login/Register بدون Header/Footer
  if (hideLayout) {
    return (
      <html lang="ar" dir="rtl">
        <body suppressHydrationWarning>{children}</body>
      </html>
    );
  }

  // ✅ بقية الصفحات
  return (
    <html lang="ar" >
      <body suppressHydrationWarning>
        <Header />
        <main style={{ minHeight: "calc(100vh - 120px)", padding: "20px" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
