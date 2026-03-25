import "./globals.css";
import AppWrapper from "./AppWrapper";

// 🎯 ตรงนี้คือหัวใจของการทำ SEO (ทำให้เสิร์จเจอใน Google)
export const metadata = {
  title: "ibung - แอพแชทและแชร์รูปภาพสไตล์ IG",
  description: "เข้าร่วม ibung เพื่อเชื่อมต่อกับเพื่อนๆ แชร์รูปภาพสุดประทับใจ และแชทกันแบบ Real-time",
  keywords: "ibung, แอพแชท, โซเชียลมีเดีย, แชร์รูปภาพ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {/* เราแยกโค้ดที่เกี่ยวกับ State และ UI ไปไว้ใน AppWrapper */}
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}