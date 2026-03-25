"use client";
import { useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { ref as dbRef, push, serverTimestamp } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const currentUser = auth.currentUser;

  const handlePost = async () => {
    if (!file && !caption.trim()) return;
    setIsUploading(true);

    try {
      let imageUrl = null;
      if (file) {
        const fileRef = storageRef(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
      }

      await push(dbRef(db, 'posts'), {
        caption,
        imageUrl,
        authorId: currentUser?.uid,
        authorName: currentUser?.displayName,
        authorPhoto: currentUser?.photoURL,
        timestamp: Date.now() // ใช้ Date.now() เพื่อง่ายต่อการเรียงลำดับฝั่ง Client
      });

      router.push("/"); // โพสต์เสร็จเด้งกลับหน้าหลัก
    } catch (error) {
      console.error("Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการโพสต์");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col bg-white dark:bg-green-950">
      <h2 className="text-2xl font-bold mb-6 text-green-600 dark:text-green-400 text-center">สร้างโพสต์ใหม่</h2>
      
      <div className="flex-1 flex flex-col gap-4">
        {file && (
          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-64 object-cover rounded-xl border dark:border-green-700" />
        )}

        <label className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-8 text-center cursor-pointer hover:bg-green-50 dark:hover:bg-green-900 transition flex flex-col items-center">
          <span className="text-4xl mb-2">📸</span>
          <span className="text-green-600 dark:text-green-400 font-bold">เลือกรูปภาพ</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>

        <textarea 
          placeholder="เขียนคำบรรยาย..." 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-4 border dark:border-green-800 rounded-xl bg-gray-50 dark:bg-green-900 dark:text-white outline-none focus:ring-2 focus:ring-green-400 min-h-[120px]"
        />
      </div>

      <button 
        onClick={handlePost} 
        disabled={isUploading}
        className="mt-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition w-full shadow-lg"
      >
        {isUploading ? "กำลังโพสต์..." : "แชร์โพสต์"}
      </button>
    </div>
  );
}