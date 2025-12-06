// app/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // التحويل مباشرة للصفحة login
  }, [router]);

  return null; // لا شيء يُعرض أثناء التحويل
}
