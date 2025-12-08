import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { ActionButton } from "./ActionButton";
import { CustomerServiceModal } from "./CustomerServiceModal";

export default function FabDock() {
    const [showCustomerService, setShowCustomerService] = useState(false);
    const nav = useNavigate();
    const loc = useLocation();
    const token = useAuthStore((s) => s.token);

    const next = encodeURIComponent(`${loc.pathname}${loc.search || ""}`);
    const goLogin = () => nav(`/login?next=${next}`);

    const handlePublish = () => {
        if (token) {
            window.open("/publish", "_blank", "noopener");
        } else {
            goLogin();
        }
    };

    const handleChat = () => {
        if (token) {
            window.open("/chat", "_blank", "noopener");
        } else {
            goLogin();
        }
    };

    const handleSupport = () => {
        setShowCustomerService(true);
    };

    return (
        <>
            <div className="fixed right-4 sm:right-6 bottom-24 z-[999] flex flex-col gap-3" aria-label="Quick actions">
                <ActionButton
                    icon="plus"
                    label="List item"
                    variant="primary"
                    onClick={handlePublish}
                />
                <ActionButton
                    icon="chat"
                    label="Messages"
                    variant="secondary"
                    onClick={handleChat}
                />
                <ActionButton
                    icon="support"
                    label="Support"
                    variant="secondary"
                    onClick={handleSupport}
                />
            </div>

            <CustomerServiceModal
                isOpen={showCustomerService}
                onClose={() => setShowCustomerService(false)}
            />
        </>
    );
}
