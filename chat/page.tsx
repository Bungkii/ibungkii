"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, onValue, push, serverTimestamp } from "firebase/database";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const messagesRef = ref(db, 'messages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMessages(msgList);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;
    try {
      await push(ref(db, 'messages'), {
        text: inputText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: serverTimestamp()
      });
      setInputText("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      <div className="p-4 bg-white dark:bg-green-900 border-b dark:border-green-800 sticky top-0 font-bold text-center text-green-600 dark:text-green-400">
        ห้องแชทรวม
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-green-950">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-xs text-gray-500 dark:text-green-300 mb-1">{msg.senderName}</span>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${
                isMe ? "bg-green-500 text-white rounded-br-none" : "bg-white dark:bg-green-800 text-gray-800 dark:text-gray-100 rounded-bl-none border dark:border-green-700"
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-green-900 border-t dark:border-green-800 flex gap-2 items-center">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="พิมพ์ข้อความ..." 
          className="flex-1 px-4 py-2 border dark:border-green-700 dark:bg-green-950 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-green-400 transition"
        />
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center transition">
          ➤
        </button>
      </form>
    </div>
  );
}