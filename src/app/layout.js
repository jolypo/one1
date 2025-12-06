"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthenticated } from '@/utils/api';
import "./globals.css";
import Header from "../components/header/page";
import Footer from "../components/footer/page";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideLayout = pathname === "/login" || pathname === "/register";

  // ✅ التحقق من تسجيل الدخول (من الكود الأول)
  useEffect(() => {
    if (!hideLayout && !isAuthenticated()) {
      router.push("/login");
    }
  }, [pathname, hideLayout, router]);

  // ✅ صفحات Login/Register بدون Header/Footer
  if (hideLayout) {
    return (
      <html lang="ar" dir="rtl">
        <body>{children}</body>
      </html>
    );
  }

  // ✅ بقية الصفحات بتنسيق الكود الثاني
  return (
    <html lang="ar" >
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
