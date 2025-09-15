import { useParams, Link } from "react-router-dom";

type Section = { heading?: string; body?: string; items?: string[] };
type InfoContent = { title: string; intro?: string; sections?: Section[] };

const CONTENT: Record<string, InfoContent> = {
  // 关于我们
  brand: {
    title: "品牌故事",
    intro: "KoalaSwap 致力于打造更可信赖、易使用的二手交易平台。我们相信物尽其用与可持续消费。",
    sections: [
      { heading: "我们的愿景", body: "让闲置流转更高效，让好物被更多人看见。" },
      { heading: "核心价值", items: ["真实可信", "交易安全", "极致体验"] },
    ],
  },
  join: {
    title: "加入我们",
    intro: "热招产品、前端、后端、运营等岗位，欢迎发送简历至 hr@koalaswap.com（示例）。",
    sections: [
      { heading: "开放职位", items: ["产品经理", "前端工程师", "后端工程师", "测试工程师", "运营专员"] },
      { heading: "我们提供", items: ["弹性办公", "成长空间", "有竞争力的薪酬"] },
    ],
  },
  press: {
    title: "媒体报道",
    intro: "如需媒体合作与采访，请联系 pr@koalaswap.com（示例）。",
    sections: [
      { heading: "最新动态", body: "这里展示公司的新闻稿、里程碑与社区活动回顾。" },
    ],
  },

  // 帮助中心
  guide: {
    title: "新手指南",
    intro: "几步上手 KoalaSwap：注册账号、完善资料、发布商品、在线沟通、完成交易。",
    sections: [
      { heading: "建议与提示", items: ["完善商品详情能提升成交率", "使用站内聊天沟通细节", "谨防钓鱼链接，切勿脱离平台交易"] },
    ],
  },
  safety: {
    title: "交易保障",
    intro: "我们通过风控校验、评价体系与举报通道，尽力保障交易安全。",
    sections: [
      { heading: "安全指南", items: ["不透露敏感信息", "当面交易注意财物安全", "平台内完成沟通与支付流程"] },
    ],
  },
  support: {
    title: "联系客服",
    intro: "如遇问题可在“我的-帮助与反馈”中提交，或发送邮件至 support@koalaswap.com（示例）。",
  },

  // 政策与条款
  terms: {
    title: "用户协议",
    intro: "本页面为演示用的占位内容，正式协议以平台发布为准。",
    sections: [
      { heading: "总则", body: "使用本服务即视为同意遵守平台相关规则与政策。" },
      { heading: "用户义务", items: ["依法发布与交易", "尊重他人权益", "遵守社区规范"] },
    ],
  },
  privacy: {
    title: "隐私政策",
    intro: "我们重视您的隐私，仅在法律允许与业务必要的前提下收集与使用您的信息。",
    sections: [
      { heading: "信息使用", items: ["用于提供与优化服务", "提升安全与风控能力"] },
    ],
  },
  rules: {
    title: "平台规则",
    intro: "为维护健康的交易生态，我们对违规行为有明确的处理机制。",
    sections: [
      { heading: "常见违规", items: ["售卖违禁品", "欺诈与钓鱼", "恶意评价与骚扰"] },
    ],
  },

  // 联系与关注
  wechat: {
    title: "微信公众号",
    intro: "扫码关注我们的官方公众号，获取最新活动与公告（示意图）。",
  },
  weibo: {
    title: "微博",
    intro: "关注我们的官方微博账号，了解平台动态与社区故事（示例）。",
  },
  twitter: {
    title: "Twitter",
    intro: "Follow us on Twitter for updates and release notes (placeholder).",
  },
};

export default function InfoPage() {
  const { slug = "" } = useParams();
  const data = CONTENT[slug];

  if (!data) {
    return (
      <main className="page py-8">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">页面建设中</h1>
          <p className="text-gray-600 mb-4">我们正在准备更详细的内容，敬请期待。</p>
          <img src="https://placehold.co/800x240?text=Coming+Soon" alt="coming soon" className="rounded border mx-auto" />
          <div className="mt-6">
            <Link to="/" className="btn btn-secondary text-sm">返回首页</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page py-8">
      <article className="card p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          {data.intro && <p className="text-gray-600 mt-2">{data.intro}</p>}
        </header>

        {data.title === "微信公众号" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <img src="https://placehold.co/280x280?text=QR" alt="QR" className="mx-auto rounded border" />
            <div className="text-sm text-gray-700">
              <p>使用微信扫描二维码即可关注（示意图）。</p>
              <p className="mt-2">后续可替换为真实二维码与公众号介绍。</p>
            </div>
          </section>
        )}

        {data.sections?.map((s, i) => (
          <section key={i} className="space-y-2">
            {s.heading && <h2 className="text-lg font-medium">{s.heading}</h2>}
            {s.body && <p className="text-gray-700 leading-relaxed">{s.body}</p>}
            {Array.isArray(s.items) && s.items.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {s.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            )}
          </section>
        ))}

        {(slug === "weibo" || slug === "twitter") && (
          <section className="text-sm text-gray-600">
            <p>以上为演示内容，可在此放置官方账号链接与活动信息。</p>
          </section>
        )}

        <footer className="pt-2 border-t border-gray-100 text-sm text-gray-500">
          如需更多信息，请通过“联系客服”与我们取得联系。
        </footer>
      </article>
    </main>
  );
}

