"use client";

import React, { useState } from "react";
import { SocketProvider } from "./SocketContext.client";
import ChatList from "./ChatList.client";
import ChatWindow from "./ChatWindow.client";
import GroupModal from "./GroupModal.client";
import "./ChatPage.css";

export default function ChatPage({ userId }) {
  const [activeRoom, setActiveRoom] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  return (
    <SocketProvider userId={userId}>
      <div className={`chat-page${activeRoom ? " chat-active" : ""}`}>
        <ChatList
          onSelect={(room) => {
            setActiveRoom(room);
            if (room.isNew && room.isGroup) {
              setShowGroupModal(true);
            }
          }}
        />

        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            userId={userId}
            onBack={() => setActiveRoom(null)}
          />
        ) : (
          <div className="chat-placeholder">Select or create a chat</div>
        )}

        {showGroupModal && (
          <GroupModal
            onCreate={() => {
              setShowGroupModal(false);
              setActiveRoom((r) => ({ ...r, isNew: false }));
            }}
            onClose={() => setShowGroupModal(false)}
          />
        )}
      </div>
    </SocketProvider>
  );
}
