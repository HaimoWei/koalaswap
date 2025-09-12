import { useNavigate } from "react-router-dom";

const CATS: { label: string; id: string }[] = [
  { label: "手机", id: "1001" },
  { label: "数码", id: "1002" },
  { label: "电脑", id: "1003" },
  { label: "服饰", id: "1004" },
  { label: "运动", id: "1005" },
  { label: "家居", id: "1006" },
  { label: "美妆", id: "1007" },
  { label: "母婴", id: "1008" },
  { label: "家电", id: "1009" },
  { label: "个护", id: "1010" },
];

export function CategoryChips() {
  const nav = useNavigate();
  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-auto no-scrollbar py-1">
        {CATS.map((c) => (
          <button
            key={c.id}
            className="chip chip-secondary hover:brightness-95 shrink-0"
            onClick={() => nav(`/search?catId=${encodeURIComponent(c.id)}`)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

