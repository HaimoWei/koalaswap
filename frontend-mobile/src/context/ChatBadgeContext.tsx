import React, { createContext, useContext, useState } from "react";

type Ctx = { totalUnread: number; setTotalUnread: (n: number) => void; };
const ChatBadgeContext = createContext<Ctx>({ totalUnread: 0, setTotalUnread: () => {} });

export const ChatBadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [totalUnread, setTotalUnread] = useState(0);
    return (
        <ChatBadgeContext.Provider value={{ totalUnread, setTotalUnread }}>
            {children}
        </ChatBadgeContext.Provider>
    );
};

export const useChatBadge = () => useContext(ChatBadgeContext);
