// src/pages/TeamChatPage.tsx
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import { Send, MessageSquare, PlusCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import AddChatRoomModal from '@/components/chat/AddChatRoomModal';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

// --- INTERFACES ---
interface ChatRoom {
  id: string;
  topic: string;
  createdBy: { id: string; name: string; role: string; };
  createdAt: any;
  lastMessage: string;
  lastMessageAt: any;
}

interface ChatMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: any;
  userId: string;
  userName: string;
  userRole: string;
}

interface GroupedMessages {
  [date: string]: ChatMessage[];
}


// --- COMPONENT ---
const TeamChatPage: React.FC = () => {
  const { user, userProfile } = useUser();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages>({});
  const [newMessage, setNewMessage] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [groupedMessages]);

  // --- DATA FETCHING ---
  // Fetch chat rooms
  useEffect(() => {
    const q = query(collection(db, 'chat_rooms'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const roomList: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        roomList.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
      setRooms(roomList);
      setLoadingRooms(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch messages for the selected room
  useEffect(() => {
    if (!selectedRoomId) {
      setGroupedMessages({});
      return;
    }
    setLoadingMessages(true);
    const q = query(
      collection(db, 'team_chat_messages'),
      where('roomId', '==', selectedRoomId),
      orderBy('createdAt')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      const grouped = msgs.reduce((acc: GroupedMessages, msg) => {
        const msgDate = dayjs(msg.createdAt?.toDate()).format('YYYY-MM-DD');
        if (!acc[msgDate]) acc[msgDate] = [];
        acc[msgDate].push(msg);
        return acc;
      }, {});
      setGroupedMessages(grouped);
      setLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [selectedRoomId]);


  // --- HANDLERS ---
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedRoomId || !userProfile || !user) return;

    try {
      // 1. Add new message
      await addDoc(collection(db, 'team_chat_messages'), {
        roomId: selectedRoomId,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        userId: user.id,
        userName: userProfile.name,
        userRole: userProfile.role || 'Member',
      });

      // 2. Update the room's last message
      const roomRef = doc(db, 'chat_rooms', selectedRoomId);
      await updateDoc(roomRef, {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const formatDateSeparator = (dateStr: string) => dayjs(dateStr).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'dddd, D MMM',
    sameElse: 'dddd, D MMMM YYYY'
  });

  // --- RENDER ---
  return (
    <>
      <AddChatRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-zinc-900 border-t">

        {/* Left Panel: Chat Rooms List */}
        <aside className="w-1/3 min-w-[300px] max-w-[400px] flex flex-col border-r dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="p-4 border-b dark:border-zinc-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Chat Rooms</h2>
            <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700" title="Start new chat">
              <PlusCircle className="w-6 h-6 text-primary-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? <p className="p-4 text-center">Loading rooms...</p> : rooms.map(room => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-4 border-b dark:border-zinc-700 cursor-pointer ${selectedRoomId === room.id ? 'bg-primary-50 dark:bg-primary-900/50' : 'hover:bg-gray-100 dark:hover:bg-zinc-700/50'}`}
              >
                <h3 className="font-semibold text-gray-800 dark:text-white truncate">{room.topic}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{room.lastMessage}</p>
                <p className="text-xs text-gray-400 mt-1">{dayjs(room.lastMessageAt?.toDate()).fromNow()}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel: Messages Area */}
        <main className="flex-1 flex flex-col">
          {!selectedRoomId ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-zinc-600" />
              <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Select a room to start chatting</h2>
              <p className="text-gray-500">Choose from the list on the left or create a new chat room.</p>
            </div>
          ) : (
            <>
              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingMessages ? <p className="text-center">Loading messages...</p> : Object.keys(groupedMessages).sort().map(date => (
                  <div key={date}>
                    <div className="relative my-5 text-center">
                      <hr className="absolute top-1/2 left-0 w-full border-t border-gray-200 dark:border-gray-700" />
                      <span className="relative inline-block px-3 bg-gray-50 dark:bg-zinc-900 text-sm font-medium text-gray-500 rounded-full">{formatDateSeparator(date)}</span>
                    </div>
                    <div className="space-y-4">
                    {groupedMessages[date].map(msg => {
                      const isCurrentUser = msg.userId === user?.id;
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${isCurrentUser ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-white dark:bg-zinc-700 dark:text-gray-200 rounded-bl-lg'}`}>
                            {!isCurrentUser && (<p className={`text-xs font-bold mb-1 ${msg.userRole === 'Owner' ? 'text-red-400' : msg.userRole === 'Manager' ? 'text-blue-400' : 'text-green-400'}`}>{msg.userName} ({msg.userRole})</p>)}
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">{dayjs(msg.createdAt?.toDate()).format('h:mm A')}</p>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <footer className="p-4 bg-white dark:bg-zinc-800 border-t dark:border-zinc-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-zinc-700 border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50" disabled={!newMessage.trim()}>
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                <p className="text-xs text-gray-400 mt-2 ml-1">Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-900">Enter</kbd> to send.</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default TeamChatPage;
