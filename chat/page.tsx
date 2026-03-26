"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, serverTimestamp, set, onDisconnect, remove } from "firebase/database";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Loader2, Search, Sparkles } from "lucide-react";
import Link from "next/link";

function ChatContent() {
  const searchParams = useSearchParams();
  const targetUid = searchParams.get("id");
  const currentUser = auth.currentUser;
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [myNote, setMyNote] = useState("");
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const filteredUsers = allUsers.filter(user => user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    
    // ตั้งสถานะออนไลน์
    const myStatusRef = ref(db, `status/${currentUser.uid}`);
    set(myStatusRef, "online");
    onDisconnect(myStatusRef).set("offline");

    // ดึงรายชื่อเพื่อน + สถานะออนไลน์
    onValue(ref(db, 'users'), (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        onValue(ref(db, 'status'), (statusSnap) => {
          const statusData = statusSnap.val() || {};
          const usersList = Object.values(usersData)
            .filter((u: any) => u.uid !== currentUser.uid)
            .map((u: any) => ({ ...u, isOnline: statusData[u.uid] === "online" }));
          setAllUsers(usersList);
        });
      }
    });

    // ดึงโน้ต
    onValue(ref(db, 'notes'), s => setAllNotes(s.val() ? Object.values(s.val()) : []));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !targetUid) return;
    setLoading(true);
    onValue(ref(db, `users/${targetUid}`), (snapshot) => setTargetUser(snapshot.val()));
    
    const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
    return onValue(ref(db, `chats/${chatId}`), (snapshot) => {
      const data = snapshot.val();
      setMessages(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
      setLoading(false);
    });
  }, [currentUser, targetUid]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !targetUid) return;
    
    const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
    
    // ส่งแชท
    await push(ref(db, `chats/${chatId}`), { 
      text: newMessage, 
      senderId: currentUser.uid, 
      timestamp: Date.now() 
    });

    // ส่งแจ้งเตือน Noti ให้เพื่อน
    await push(ref(db, `notifications/${targetUid}`), {
      senderName: currentUser.displayName,
      senderPhoto: currentUser.photoURL,
      text: newMessage,
      timestamp: Date.now()
    });

    setNewMessage("");
  };

  const saveNote = async () => {
    if (!currentUser) return;
    await set(ref(db, `notes/${currentUser.uid}`), {
      text: myNote,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userPhoto: currentUser.photoURL,
      timestamp: Date.now()
    });
    setShowNoteModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A]">
      <aside className={`w-full md:w-80 flex-col bg-white dark:bg-[#0D140D] border-r dark:border-green-900/30 ${targetUid ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <Link href="/"><h1 className="text-xl font-bold text-green-600 dark:text-green-500 mb-6 italic flex items-center gap-2"><Sparkles /> ibung chat</h1></Link>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="ค้นหาเพื่อน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A241A] rounded-xl text-sm outline-none" />
          </div>
        </div>

                {/* 🎯 เพิ่ม pt-14 ดันลงมาอีกนิด ให้โน้ตที่ใหญ่ขึ้นมีที่ลอย */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pt-14 pb-4 border-b dark:border-green-900/20">
          
          {/* ปุ่มสร้างกลุ่ม */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 relative cursor-pointer group" onClick={() => setShowGroupModal(true)}>
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center bg-green-50 dark:bg-green-900/10 group-active:scale-90 transition-transform">
              <Plus className="text-green-500" />
            </div>
            <span className="text-[11px] text-green-500 font-bold mt-1">สร้างกลุ่ม</span>
          </div>

          {/* โน้ตของตัวเอง */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 relative cursor-pointer" onClick={() => setShowNoteModal(true)}>
            <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-green-900/30 p-1 relative">
              <img src={currentUser?.photoURL || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" />
              {/* 🎯 ส่วนที่แก้: ปรับกว้างเป็น max-w-[120px], ฟอนต์ text-[11px] font-medium, ดันขึ้น -top-10 */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-green-800 py-1.5 px-4 rounded-2xl text-[11px] font-medium text-gray-800 dark:text-white shadow-lg border border-gray-100 dark:border-green-700 max-w-[120px] truncate z-50">
                {allNotes.find(n => n.userId === currentUser?.uid)?.text || "ทิ้งโน้ต..."}
              </div>
            </div>
            <span className="text-[11px] text-gray-400 font-bold mt-1">คุณ</span>
          </div>

          {/* โน้ตของเพื่อนๆ */}
          {allNotes.filter(n => n.userId !== currentUser?.uid).map((n, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 relative">
              <div className="w-16 h-16 rounded-full p-1 relative">
                <img src={n.userPhoto} className="w-full h-full rounded-full object-cover" alt="" />
                {/* 🎯 ส่วนที่แก้: เหมือนกันเป๊ะ */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-green-900 py-1.5 px-4 rounded-2xl text-[11px] font-medium text-gray-800 dark:text-white shadow-lg border border-green-500/20 max-w-[120px] truncate z-50">
                  {n.text}
                </div>
              </div>
              <span className="text-[11px] text-gray-500 mt-1">{n.userName}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredUsers.map(user => (
            <Link href={`/chat?id=${user.uid}`} key={user.uid} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${user.uid === targetUid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'hover:bg-gray-50 dark:hover:bg-green-900/10'}`}>
              <div className="relative flex-shrink-0">
                <img src={user.photoURL || "/api/placeholder/40/40"} className="w-12 h-12 rounded-full object-cover" alt="" />
                {user.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0D140D] rounded-full" />}
              </div>
              <span className="font-bold text-sm truncate">{user.displayName}</span>
            </Link>
          ))}
        </div>
      </aside>

      {targetUid && (
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0A0F0A] md:m-4 md:rounded-3xl md:border dark:border-green-900/20 overflow-hidden">
          <header className="px-6 py-4 flex items-center gap-3 border-b dark:border-green-900/20 bg-white/80 dark:bg-[#0A0F0A]/80 backdrop-blur-md sticky top-0 z-10">
            <Link href="/chat" className="md:hidden"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
            <img src={targetUser?.photoURL || "/api/placeholder/40/40"} className="w-10 h-10 rounded-full object-cover" alt="" />
            <h2 className="font-bold">{targetUser?.displayName}</h2>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] shadow-sm ${msg.senderId === currentUser?.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-[#1A241A] rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <footer className="p-4 bg-white dark:bg-[#0D140D] border-t dark:border-green-900/20">
            <form onSubmit={sendMessage} className="flex gap-3 bg-gray-50 dark:bg-[#1A241A] rounded-2xl px-4 py-2">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 bg-transparent outline-none text-sm" />
              <button type="submit" className="p-2 bg-green-500 text-white rounded-xl"><Send className="w-4 h-4" /></button>
            </form>
          </footer>
        </main>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1A241A] rounded-[2rem] p-8 w-full max-w-xs shadow-2xl border dark:border-green-500/20">
            <p className="text-sm font-bold mb-4">เขียนโน้ตแชร์ความรู้สึก...</p>
            <input maxLength={60} value={myNote} onChange={e => setMyNote(e.target.value)} placeholder="กำลังทำอะไรอยู่?" className="w-full p-4 bg-gray-100 dark:bg-[#0D140D] rounded-2xl outline-none mb-6 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setShowNoteModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">ยกเลิก</button>
              <button onClick={saveNote} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-bold">แชร์</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-green-500 w-8 h-8" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
