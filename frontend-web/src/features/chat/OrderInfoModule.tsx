import type { ConversationDetailResponse } from "../../api/chat";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { confirmOrder } from "../../api/orders";
import { getOrderReviews } from "../../api/reviews";
import { useEffect } from "react";
import { getStomp, subscribeConversationMessages } from "../../ws/stomp";
import { confirm } from "../../store/overlay";

interface OrderInfoModuleProps {
    conversation: ConversationDetailResponse;
}

export function OrderInfoModule({ conversation }: OrderInfoModuleProps) {
    const myId = useAuthStore((s) => s.profile?.id);
    const isBuyer = myId === conversation.buyerId;
    const isSeller = myId === conversation.sellerId;
    const nav = useNavigate();
    const qc = useQueryClient();

    // 从多个数据源提取订单ID的辅助函数
    const getOrderId = () => {
        // 优先使用 orderDetail 中的 orderId
        if (conversation.orderDetail?.orderId) {
            return conversation.orderDetail.orderId;
        }

        // 其次检查 conversation 直接字段中的 orderId（如果后端添加了的话）
        if (conversation.orderId) {
            return conversation.orderId;
        }

        // 如果都没有，但有 orderStatus，这是一个问题，需要后端修复
        if (conversation.orderStatus && conversation.orderStatus !== 'CANCELLED') {
            console.warn('[OrderInfoModule] 有订单状态但没有订单ID，这是数据同步问题');
        }

        return null;
    };

    // 查询订单评价状态
    const orderId = getOrderId();
    const { data: orderReviews, refetch: refetchOrderReviews, error: reviewsError } = useQuery({
        queryKey: ["orderReviews", orderId],
        queryFn: () => getOrderReviews(orderId!),
        enabled: !!orderId, // 简化条件，只要有orderId就查询
        staleTime: 300000, // 5分钟缓存，因为现在通过WebSocket实时更新
        refetchOnWindowFocus: false, // 不需要窗口聚焦刷新
    });

    // 调试查询状态
    console.log('[OrderInfoModule] 查询状态:', {
        orderId,
        hasOrderId: !!orderId,
        orderReviews,
        reviewsError: reviewsError?.message,
        orderStatus: conversation.orderDetail?.status || conversation.orderStatus
    });

    // 检查当前用户是否已经评价过这个订单
    const checkIfUserHasReviewed = () => {
        if (!orderReviews || !myId) {
            console.log('[OrderInfoModule] checkIfUserHasReviewed - 无数据:', { orderReviews, myId });
            return false;
        }

        console.log('[OrderInfoModule] 完整评价数据:', orderReviews);

        const hasReviewed = orderReviews.some(review => {
            console.log('[OrderInfoModule] 检查评价完整数据:', {
                review: review,
                reviewerId: review.reviewer?.id,
                reviewerRole: review.reviewerRole,
                myId: myId,
                isBuyer,
                isSeller,
                buyerId: conversation.buyerId,
                sellerId: conversation.sellerId
            });

            // 修复匹配逻辑：主要按角色匹配，ID匹配作为备选
            const matchByRole = (isBuyer && review.reviewerRole === 'BUYER') ||
                               (isSeller && review.reviewerRole === 'SELLER');
            const matchById = review.reviewer?.id === myId;

            console.log('[OrderInfoModule] 匹配结果:', {
                matchById,
                matchByRole,
                finalMatch: matchByRole || matchById // 优先按角色匹配
            });

            return matchByRole || matchById; // 优先按角色匹配
        });

        console.log('[OrderInfoModule] 用户是否已评价:', hasReviewed);
        return hasReviewed;
    };

    // 监听WebSocket消息，当收到评价系统消息时刷新评价状态
    useEffect(() => {
        if (!orderId) return;

        console.log('[OrderInfoModule] 开始监听评价系统消息');
        getStomp().activate();

        const subscription = subscribeConversationMessages(conversation.id, (msg) => {
            try {
                let messageData;
                if (typeof msg.body === 'string') {
                    messageData = JSON.parse(msg.body);
                } else {
                    messageData = msg.body;
                }

                // 检查是否是评价系统消息
                console.log('[OrderInfoModule] WebSocket消息详情:', {
                    type: messageData.type,
                    systemEvent: messageData.systemEvent,
                    body: messageData.body,
                    全部数据: messageData
                });

                if (messageData.type === 'SYSTEM' &&
                    (messageData.systemEvent === 'BUYER_REVIEWED' || messageData.systemEvent === 'SELLER_REVIEWED')) {
                    console.log('[OrderInfoModule] 🎯 收到评价系统消息，立即刷新评价状态!', messageData);
                    refetchOrderReviews().then(() => {
                        console.log('[OrderInfoModule] ✅ 评价数据刷新完成');
                    }).catch(err => {
                        console.error('[OrderInfoModule] ❌ 评价数据刷新失败:', err);
                    });
                } else if (messageData.type === 'SYSTEM') {
                    console.log('[OrderInfoModule] 收到其他系统消息:', messageData.systemEvent);
                }
            } catch (error) {
                console.error('[OrderInfoModule] 解析WebSocket消息失败:', error);
            }
        });

        return () => {
            console.log('[OrderInfoModule] 清理评价消息订阅');
            subscription?.unsubscribe();
        };
    }, [conversation.id, orderId, refetchOrderReviews]);
    
    // 临时调试日志
    console.log('[OrderInfoModule] conversation data:', {
        productTitle: conversation.productTitle,
        productPrice: conversation.productPrice,
        orderStatus: conversation.orderStatus,
        orderDetail: conversation.orderDetail,
        peerNickname: conversation.peerNickname,
        // 更多调试信息
        conversationId: conversation.id,
        productId: conversation.productId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        isBuyer,
        isSeller,
        fullConversation: conversation,
    });
    
    // 格式化价格显示
    const formatPrice = (price?: number | null) => {
        if (price == null) return "--"; // 允许 0 被正常显示
        return `¥${price.toFixed(2)}`;
    };
    
    // 格式化订单状态显示
    const getOrderStatusDisplay = (status?: string | null, hasOrder?: boolean) => {
        if (!hasOrder) {
            return { text: '未购买', color: 'tag tag-warning' };
        }
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
    const getActionButtons = () => {
        // 使用统一的订单状态
        const currentOrderStatus = conversation.orderDetail?.status || conversation.orderStatus;
        const hasOrder = !!(conversation.orderDetail?.orderId || conversation.orderStatus);
        const buttons = [];

        if (isBuyer) {
            // 买家还没有购买
            if (!hasOrder) {
                buttons.push({
                    text: '去购买',
                    color: 'bg-orange-500 hover:bg-orange-600 text-white',
                    action: 'buy'
                });
            } else {
                switch (currentOrderStatus) {
                    case 'PENDING':
                        buttons.push({
                            text: '立即付款',
                            color: 'bg-blue-500 hover:bg-blue-600 text-white',
                            action: 'pay'
                        });
                        break;
                    case 'SHIPPED':
                        buttons.push({
                            text: '查看订单',
                            color: 'bg-gray-500 hover:bg-gray-600 text-white',
                            action: 'viewOrder'
                        });
                        buttons.push({
                            text: '确认收货',
                            color: 'bg-green-500 hover:bg-green-600 text-white',
                            action: 'confirm'
                        });
                        break;
                    case 'COMPLETED':
                        // 检查用户是否已经评价，显示相应的按钮
                        if (checkIfUserHasReviewed()) {
                            buttons.push({
                                text: '写追评',
                                color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                                action: 'additionalReview'
                            });
                        } else {
                            buttons.push({
                                text: '去评价',
                                color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                                action: 'review'
                            });
                        }
                        break;
                    case 'CANCELLED':
                        // 订单已取消，买家可以再次购买
                        buttons.push({
                            text: '再次购买',
                            color: 'bg-orange-500 hover:bg-orange-600 text-white',
                            action: 'buy'
                        });
                        break;
                }
            }
        } else if (isSeller) {
            // 卖家视角：如果没有订单，不显示任何操作
            if (hasOrder) {
                switch (currentOrderStatus) {
                    case 'PAID':
                        buttons.push({
                            text: '去发货',
                            color: 'bg-purple-500 hover:bg-purple-600 text-white',
                            action: 'ship'
                        });
                        break;
                    case 'COMPLETED':
                        // 检查用户是否已经评价，显示相应的按钮
                        if (checkIfUserHasReviewed()) {
                            buttons.push({
                                text: '写追评',
                                color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                                action: 'additionalReview'
                            });
                        } else {
                            buttons.push({
                                text: '去评价',
                                color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                                action: 'review'
                            });
                        }
                        break;
                    default:
                        // 对于其他状态，显示查看订单按钮
                        if (currentOrderStatus !== 'CANCELLED') {
                            buttons.push({
                                text: '查看订单',
                                color: 'bg-gray-500 hover:bg-gray-600 text-white',
                                action: 'viewOrder'
                            });
                        }
                        break;
                }
            }
        }

        return buttons;
    };

    // 优先使用orderDetail中的状态，如果没有则使用conversation的orderStatus
    const orderStatus = conversation.orderDetail?.status || conversation.orderStatus;
    const hasOrder = !!(conversation.orderDetail?.orderId || conversation.orderStatus);
    const orderStatusDisplay = getOrderStatusDisplay(orderStatus, hasOrder);
    const actionButtons = getActionButtons();
    
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
                <div className="flex space-x-2">
                    {actionButtons.map((button, index) => (
                        <button
                            key={`${button.action}-${index}`}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${button.color}`}
                            onClick={async () => {
                                try {
                                    const orderId = getOrderId();

                                    switch (button.action) {
                                        case 'buy':
                                            // 跳转到商品详情页购买
                                            nav(`/products/${conversation.productId}`);
                                            break;
                                        case 'pay':
                                            // 跳转到支付页面
                                            if (orderId) {
                                                nav(`/pay/${orderId}`);
                                            } else {
                                                console.warn('没有找到订单ID，无法跳转到支付页面');
                                                alert('订单信息异常，请刷新页面重试');
                                            }
                                            break;
                                        case 'ship':
                                            // 跳转到订单详情页，方便卖家进行发货操作
                                            if (orderId) {
                                                nav(`/orders/${orderId}`);
                                            } else {
                                                console.warn('没有找到订单ID');
                                                alert('订单信息异常，请刷新页面重试');
                                            }
                                            break;
                                        case 'viewOrder':
                                            // 跳转到订单详情页查看
                                            if (orderId) {
                                                nav(`/orders/${orderId}`);
                                            } else {
                                                console.warn('没有找到订单ID');
                                                alert('订单信息异常，请刷新页面重试');
                                            }
                                            break;
                                        case 'confirm':
                                            // 确认收货 - 直接在聊天页面确认，无需跳转
                                            if (orderId) {
                                                const ok = await confirm('确认收货', '确认已收到商品？确认后将无法撤销');
                                                if (!ok) return;
                                                await confirmOrder(orderId);
                                                await qc.invalidateQueries({ queryKey: ["conv", conversation.id] });
                                                await qc.invalidateQueries({ queryKey: ["conversations"] });
                                            } else {
                                                console.warn('没有找到订单ID');
                                                alert('订单信息异常，请刷新页面重试');
                                            }
                                            break;
                                        case 'review':
                                            // 根据用户角色跳转到相应的待评价页面
                                            if (isBuyer) {
                                                // 买家跳转到买家待评页面
                                                nav('/me/center/reviews?tab=buyer');
                                            } else if (isSeller) {
                                                // 卖家跳转到卖家待评页面
                                                nav('/me/center/reviews?tab=seller');
                                            } else {
                                                console.warn('用户角色不明确');
                                                nav('/me/center/reviews');
                                            }
                                            break;
                                        case 'additionalReview':
                                            // 跳转到已评价页面写追评
                                            nav('/me/center/reviews?tab=commented');
                                            break;
                                        default:
                                            console.warn('未知的操作类型:', button.action);
                                            break;
                                    }
                                } catch (e: any) {
                                    alert(e?.message || '操作失败，请稍后再试');
                                }
                            }}
                        >
                            {button.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
