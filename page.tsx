"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function HomeFeed() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postList = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp); // เรียงล่าสุดขึ้นก่อน
        setPosts(postList);
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-4">
      <div className="p-4 sticky top-0 bg-white/90 dark:bg-green-900/90 backdrop-blur z-10 border-b dark:border-green-800">
        <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 font-serif">ibung</h1>
      </div>

      <div className="space-y-6 pt-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-green-800/50 rounded-xl mx-2 overflow-hidden shadow-sm border dark:border-green-800">
            <div className="px-4 py-3 flex items-center gap-3 font-bold text-sm text-gray-800 dark:text-green-100">
              <img src={post.authorPhoto || "https://via.placeholder.com/40"} className="w-8 h-8 rounded-full" alt="profile" />
              {post.authorName}
            </div>

            {post.imageUrl && (
              <img src={post.imageUrl} className="w-full object-cover max-h-[500px]" alt="post" />
            )}

            <div className="p-4 text-sm text-gray-800 dark:text-gray-200">
              <span className="font-bold mr-2 text-green-700 dark:text-green-300">{post.authorName}</span>
              {post.caption}
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center text-gray-500 mt-10">ยังไม่มีโพสต์เลย ลองกดปุ่ม ➕ ดูสิ!</p>}
      </div>
    </div>
  );
}