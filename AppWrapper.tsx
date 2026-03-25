"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AuthForm from "@/components/AuthForm";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // เช็คสถานะการล็อกอิน
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // หน้าจอโหลด
  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-white dark:bg-green-950 text-green-500 font-bold">กำลังโหลด ibung...</div>;
  }

  // 🎯 ถ้ายังไม่ล็อกอิน ให้แสดงหน้า AuthForm (Login/Register)
  if (!user) {
    return <AuthForm />;
  }

  // โครงสร้างแอปหลักเมื่อล็อกอินแล้ว (มีแถบเมนู)
  return (
    <div className="max-w-md mx-auto bg-white dark:bg-green-900 min-h-screen relative shadow-2xl pb-16 transition-colors duration-300">
      
      <main className="h-full">{children}</main>

      {/* แถบเมนูด้านล่าง (Bottom Navigation) */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-green-950 border-t border-gray-200 dark:border-green-800 flex justify-around py-3 z-50">
        <Link href="/" className={`text-2xl transition ${pathname === '/' ? 'text-green-500 font-bold' : 'text-gray-400 dark:text-green-200'}`}>🏠</Link>
        <Link href="/post" className={`text-2xl transition ${pathname === '/post' ? 'text-green-500 font-bold' : 'text-gray-400 dark:text-green-200'}`}>➕</Link>
        <Link href="/chat" className={`text-2xl transition ${pathname === '/chat' ? 'text-green-500 font-bold' : 'text-gray-400 dark:text-green-200'}`}>💬</Link>
        <Link href={`/profile/${user.uid}`} className={`text-2xl transition ${pathname.startsWith('/profile') ? 'text-green-500 font-bold' : 'text-gray-400 dark:text-green-200'}`}>👤</Link>
      </nav>
      
    </div>
  );
}