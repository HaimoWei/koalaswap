export function EmptyChatPlaceholder() {
    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
                {/* Chat icon */}
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Start chatting
                </h3>

                {/* Subtitle */}
                <p className="text-gray-600 text-base mb-6 max-w-sm">
                    Select a conversation on the left to start chatting with a buyer or seller.
                    <br />
                    Discuss item details and transaction information.
                </p>

                {/* Feature hints */}
                <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        <span>Real-time messaging</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span>Supports images and text</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full" />
                        <span>Order status synced</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
