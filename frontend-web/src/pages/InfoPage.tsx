import { useParams, Link } from "react-router-dom";

type Section = { heading?: string; body?: string; items?: string[] };
type InfoContent = { title: string; intro?: string; sections?: Section[] };

const CONTENT: Record<string, InfoContent> = {
  // About us
  brand: {
    title: "Our story",
    intro: "KoalaSwap is committed to building a more trustworthy and easy-to-use marketplace for pre-owned items. We believe in making the most of every item and promoting sustainable consumption.",
    sections: [
      { heading: "Our vision", body: "Make the circulation of idle items more efficient and let great items be seen by more people." },
      { heading: "Core values", items: ["Trust and authenticity", "Safe transactions", "Great user experience"] },
    ],
  },
  join: {
    title: "Join us",
    intro: "We are hiring product managers, frontend engineers, backend engineers, and operations specialists. Please send your resume to hr@koalaswap.com (example).",
    sections: [
      { heading: "Open roles", items: ["Product Manager", "Frontend Engineer", "Backend Engineer", "QA Engineer", "Operations Specialist"] },
      { heading: "What we offer", items: ["Flexible working", "Room to grow", "Competitive compensation"] },
    ],
  },
  press: {
    title: "Press & media",
    intro: "For press inquiries or interviews, please contact pr@koalaswap.com (example).",
    sections: [
      { heading: "Latest updates", body: "Use this section to showcase press releases, milestones, and community event recaps." },
    ],
  },

  // Help center
  guide: {
    title: "Getting started",
    intro: "Get started with KoalaSwap in a few steps: sign up, complete your profile, list your items, chat online, and complete your trade.",
    sections: [
      { heading: "Tips & suggestions", items: ["More detailed listings lead to higher conversion", "Use in-app chat to discuss details", "Beware of phishing links and avoid off-platform payments"] },
    ],
  },
  safety: {
    title: "Safety & protection",
    intro: "We use risk controls, review systems, and reporting channels to help keep your trades safe.",
    sections: [
      { heading: "Safety guidelines", items: ["Never share sensitive information", "Stay aware of your surroundings when meeting in person", "Complete communication and payments within the platform"] },
    ],
  },
  support: {
    title: "Contact support",
    intro: "If you have any issues, submit a ticket via “My > Help & Feedback” or email support@koalaswap.com (example).",
  },

  // Policies & terms
  terms: {
    title: "User agreement",
    intro: "This page is placeholder content for demonstration purposes. The official agreement is subject to the platform’s published terms.",
    sections: [
      { heading: "General", body: "By using this service, you agree to comply with the platform’s rules and policies." },
      { heading: "User obligations", items: ["Publish and trade in accordance with the law", "Respect the rights of others", "Follow community guidelines"] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "We value your privacy and only collect and use your information where legally allowed and necessary for business operations.",
    sections: [
      { heading: "Use of information", items: ["To provide and improve our services", "To enhance security and risk control"] },
    ],
  },
  rules: {
    title: "Platform rules",
    intro: "To maintain a healthy trading ecosystem, we have clear policies for handling violations.",
    sections: [
      { heading: "Common violations", items: ["Selling prohibited items", "Fraud and phishing", "Abusive reviews and harassment"] },
    ],
  },

  // Contact & follow
  wechat: {
    title: "WeChat official account",
    intro: "Scan the QR code to follow our official WeChat account and get the latest updates (placeholder).",
  },
  weibo: {
    title: "Weibo",
    intro: "Follow our official Weibo account to learn about platform news and community stories (example).",
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
          <h1 className="text-xl font-semibold mb-2">Page under construction</h1>
          <p className="text-gray-600 mb-4">We are preparing more detailed content. Please stay tuned.</p>
          <img src="https://placehold.co/800x240?text=Coming+Soon" alt="coming soon" className="rounded border mx-auto" />
          <div className="mt-6">
            <Link to="/" className="btn btn-secondary text-sm">Back to home</Link>
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

        {data.title === "WeChat official account" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <img src="https://placehold.co/280x280?text=QR" alt="QR" className="mx-auto rounded border" />
            <div className="text-sm text-gray-700">
              <p>Scan with WeChat to follow our official account (mockup).</p>
              <p className="mt-2">This can be replaced with a real QR code and introduction later.</p>
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
            <p>The above is demo content. Use this section to place links to official accounts and campaign information.</p>
          </section>
        )}

        <footer className="pt-2 border-t border-gray-100 text-sm text-gray-500">
          For more information, please contact us via “Contact support”.
        </footer>
      </article>
    </main>
  );
}

