"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, onValue, update, query, orderByChild, equalTo } from "firebase/database";
import { useParams, useRouter } from "next/navigation";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string; // ไอดีของเจ้าของโปรไฟล์ที่กำลังดูอยู่
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // 1. โหลดข้อมูลโปรไฟล์และสถานะการติดตาม
  useEffect(() => {
    if (!uid) return;

    // โหลดข้อมูล User
    const userRef = ref(db, `users/${uid}`);
    const unsubscribeUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfile(data);
        // นับจำนวน Followers / Following
        const followers = data.followers ? Object.keys(data.followers).length : 0;
        const following = data.following ? Object.keys(data.following).length : 0;
        setFollowersCount(followers);
        setFollowingCount(following);

        // เช็คว่าเรา Follow เขาอยู่ไหม
        if (currentUser && data.followers && data.followers[currentUser.uid]) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      }
    });

    // 2. โหลดโพสต์ของคนๆ นี้ (ดึงเฉพาะโพสต์ที่ authorId ตรงกับ uid)
    const postsRef = query(ref(db, 'posts'), orderByChild('authorId'), equalTo(uid));
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // แปลงเป็น Array และสลับให้โพสต์ใหม่สุดอยู่บนสุด
        const postList = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setUserPosts(postList);
      } else {
        setUserPosts([]);
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [uid, currentUser]);

  // ระบบ Follow / Unfollow (อัปเดตฐานข้อมูล 2 จุดพร้อมกัน)
  const toggleFollow = async () => {
    if (!currentUser) {
      alert("กรุณาล็อกอินก่อน");
      return;
    }

    const updates: any = {};
    if (isFollowing) {
      // เลิกติดตาม: ลบข้อมูลออก (ตั้งค่าเป็น null)
      updates[`users/${uid}/followers/${currentUser.uid}`] = null;
      updates[`users/${currentUser.uid}/following/${uid}`] = null;
    } else {
      // ติดตาม: เพิ่มข้อมูลเข้าไป (ตั้งค่าเป็น true)
      updates[`users/${uid}/followers/${currentUser.uid}`] = true;
      updates[`users/${currentUser.uid}/following/${uid}`] = true;
    }

    try {
      // อัปเดตฐานข้อมูล (Realtime DB)
      await update(ref(db), updates);
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const isMe = currentUser?.uid === uid;

  return (
    <div className="min-h-screen bg-white dark:bg-green-950 pb-20">
      {/* Header (Top Bar) */}
      <div className="p-4 border-b dark:border-green-800 sticky top-0 bg-white/90 dark:bg-green-900/90 backdrop-blur z-10 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-2xl text-green-600 dark:text-green-400">←</button>
        <h1 className="font-bold text-lg text-gray-800 dark:text-green-100">
          {profile?.displayName || "กำลังโหลด..."}
        </h1>
        <div className="w-8"></div> {/* ตัวดันให้ตรงกลาง */}
      </div>

      {/* Profile Info */}
      <div className="p-6 border-b dark:border-green-800 bg-green-50/50 dark:bg-green-900/30">
        <div className="flex items-center gap-6">
          <img 
            src={profile?.photoURL || "https://via.placeholder.com/150"} 
            className="w-24 h-24 rounded-full border-4 border-green-500 dark:border-green-400 shadow-lg object-cover" 
            alt="profile" 
          />
          <div className="flex-1 flex justify-around text-center">
            <div>
              <div className="font-bold text-xl text-gray-800 dark:text-white">{userPosts.length}</div>
              <div className="text-xs text-gray-500 dark:text-green-300">โพสต์</div>
            </div>
            <div>
              <div className="font-bold text-xl text-gray-800 dark:text-white">{followersCount}</div>
              <div className="text-xs text-gray-500 dark:text-green-300">ผู้ติดตาม</div>
            </div>
            <div>
              <div className="font-bold text-xl text-gray-800 dark:text-white">{followingCount}</div>
              <div className="text-xs text-gray-500 dark:text-green-300">กำลังติดตาม</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-bold text-gray-800 dark:text-green-100">{profile?.displayName}</p>
          <p className="text-sm text-gray-600 dark:text-green-200 mt-1">{profile?.bio || "ยังไม่มีคำอธิบายโปรไฟล์"}</p>
        </div>

        {/* ปุ่ม Follow / Edit Profile */}
        <div className="mt-6">
          {isMe ? (
            <button className="w-full py-2 bg-gray-100 dark:bg-green-800 text-gray-800 dark:text-green-100 font-bold rounded-lg border dark:border-green-700 hover:bg-gray-200 dark:hover:bg-green-700 transition">
              แก้ไขโปรไฟล์
            </button>
          ) : (
            <button 
              onClick={toggleFollow}
              className={`w-full py-2 font-bold rounded-lg transition ${
                isFollowing 
                  ? "bg-gray-200 dark:bg-green-800 text-gray-800 dark:text-green-100 border dark:border-green-700" 
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {isFollowing ? "เลิกติดตาม" : "ติดตาม"}
            </button>
          )}
        </div>
      </div>

      {/* Grid ของรูปภาพโพสต์แบบ IG */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {userPosts.map(post => (
          <div key={post.id} className="aspect-square bg-gray-200 dark:bg-green-800 cursor-pointer hover:opacity-80 transition relative">
            {post.imageUrl ? (
              <img src={post.imageUrl} className="w-full h-full object-cover" alt="post" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-green-500 text-xs text-center p-2">
                {post.caption?.substring(0, 20)}...
              </div>
            )}
          </div>
        ))}
      </div>
      
      {userPosts.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-green-600">
          ยังไม่มีโพสต์
        </div>
      )}
    </div>
  );
}