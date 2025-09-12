import type { ConversationDetailResponse } from "../../api/chat";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { confirmOrder } from "../../api/orders";

interface OrderInfoModuleProps {
    conversation: ConversationDetailResponse;
}

export function OrderInfoModule({ conversation }: OrderInfoModuleProps) {
    const myId = useAuthStore((s) => s.profile?.id);
    const isBuyer = myId === conversation.buyerId;
    const isSeller = myId === conversation.sellerId;
    const nav = useNavigate();
    const qc = useQueryClient();
    
    // 临时调试日志
    console.log('[OrderInfoModule] conversation data:', {
        productTitle: conversation.productTitle,
        productPrice: conversation.productPrice,
        orderStatus: conversation.orderStatus,
        orderDetail: conversation.orderDetail,
        peerNickname: conversation.peerNickname,
    });
    
    // 格式化价格显示
    const formatPrice = (price?: number | null) => {
        if (price == null) return "--"; // 允许 0 被正常显示
        return `¥${price.toFixed(2)}`;
    };
    
    // 格式化订单状态显示
    const getOrderStatusDisplay = (status?: string | null) => {
        switch (status) {
            case 'PENDING': return { text: '待付款', color: 'tag tag-warning' };
            case 'PAID': return { text: '已付款', color: 'tag tag-info' };
            case 'SHIPPED': return { text: '已发货', color: 'tag tag-info' };
            case 'COMPLETED': return { text: '已完成', color: 'tag tag-success' };
            case 'CANCELLED': return { text: '已取消', color: 'tag tag-neutral' };
            default: return { text: '未知状态', color: 'tag tag-neutral' };
        }
    };
    
    // 根据当前用户角色和订单状态决定要显示的操作按钮
    const getActionButton = () => {
        // 使用统一的订单状态
        const currentOrderStatus = conversation.orderDetail?.status || conversation.orderStatus;

        if (isBuyer) {
            switch (currentOrderStatus) {
                case 'PENDING':
                    return { text: '立即付款', color: 'bg-blue-500 hover:bg-blue-600 text-white' };
                case 'SHIPPED':
                    return { text: '确认收货', color: 'bg-green-500 hover:bg-green-600 text-white' };
                default:
                    return null;
            }
        } else if (isSeller) {
            switch (currentOrderStatus) {
                case 'PAID':
                    return { text: '立即发货', color: 'bg-purple-500 hover:bg-purple-600 text-white' };
                default:
                    return null;
            }
        }

        return null;
    };

    // 优先使用orderDetail中的状态，如果没有则使用conversation的orderStatus
    const orderStatus = conversation.orderDetail?.status || conversation.orderStatus;
    const orderStatusDisplay = getOrderStatusDisplay(orderStatus);
    const actionButton = getActionButton();
    
    return (
        <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4">
            <div className="flex items-center space-x-4">
                {/* 商品图片 */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[var(--color-muted)] overflow-hidden">
                    {conversation.productFirstImage ? (
                        <img 
                            src={conversation.productFirstImage}
                            alt={conversation.productTitle || "商品图片"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>
                
                {/* 商品和订单信息 */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                        {conversation.productTitle || "商品标题"}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>商品价格: {formatPrice(conversation.productPrice)}</span>
                        {conversation.orderDetail?.priceSnapshot && (
                            <span>订单价格: {formatPrice(conversation.orderDetail.priceSnapshot)}</span>
                        )}
                        {/* 始终显示订单状态，即使没有数据也显示默认状态 */}
                        <span className={`${orderStatusDisplay.color}`}>
                            {orderStatusDisplay.text}
                        </span>
                    </div>
                    
                    {/* 物流信息 */}
                    {conversation.orderDetail?.trackingNo && (
                        <div className="mt-1 text-xs text-gray-500">
                            物流单号: {conversation.orderDetail.trackingNo}
                            {conversation.orderDetail.carrier && ` (${conversation.orderDetail.carrier})`}
                        </div>
                    )}
                </div>
                
                {/* 操作按钮 */}
                {actionButton && (
                    <button
                        className={`btn ${actionButton.text.includes('确认') ? 'btn-primary' : 'btn-secondary'} text-sm`}
                        onClick={async () => {
                            const orderId = conversation.orderDetail?.orderId;
                            const s = conversation.orderDetail?.status || conversation.orderStatus;
                            if (!orderId || !s) return;
                            try {
                                if (isBuyer && s === 'PENDING') {
                                    nav(`/pay/${orderId}`);
                                } else if (isSeller && s === 'PAID') {
                                    nav(`/orders/${orderId}`);
                                } else if (isBuyer && s === 'SHIPPED') {
                                    const ok = window.confirm('确认已收货吗？');
                                    if (!ok) return;
                                    await confirmOrder(orderId);
                                    await qc.invalidateQueries({ queryKey: ["conv", conversation.id] });
                                    await qc.invalidateQueries({ queryKey: ["conversations"] });
                                }
                            } catch (e: any) {
                                alert(e?.message || '操作失败，请稍后再试');
                            }
                        }}
                    >
                        {actionButton.text}
                    </button>
                )}
            </div>
        </div>
    );
}
