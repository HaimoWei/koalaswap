export function EmptyChatPlaceholder() {
    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
                {/* 聊天图标 */}
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
                
                {/* 主标题 */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    开始聊天
                </h3>
                
                {/* 副标题 */}
                <p className="text-gray-600 text-base mb-6 max-w-sm">
                    选择左侧的会话开始与买家或卖家聊天，<br />
                    沟通商品详情和交易信息
                </p>
                
                {/* 提示信息 */}
                <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>实时消息推送</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span>支持图片和文字</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        <span>订单状态同步</span>
                    </div>
                </div>
            </div>
        </div>
    );
}