import { ArrowUpRight } from "lucide-react";

type CaseStudyCardProps = {
  name: string;
  result: string;
  description: string;
  tags: string[];
};

export function CaseStudyCard({ name, result, description, tags }: CaseStudyCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-6 shadow-2xl shadow-black/30 backdrop-blur transition hover:-translate-y-1 hover:border-monova-orange/45 hover:shadow-orange">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-monova-orange/15 blur-2xl transition group-hover:bg-monova-cyan/18" />
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_24%,rgba(105,200,255,0.28),transparent_16rem),linear-gradient(135deg,#091727,#03050a)]">
        <div className="absolute inset-5 rounded-2xl border border-monova-cyan/20 bg-black/25" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <span className="font-display text-3xl font-black tracking-[-0.04em]">{name}</span>
          <strong className="rounded-full border border-monova-orange/45 bg-monova-orange/15 px-4 py-2 font-display text-2xl text-monova-orange">
            {result}
          </strong>
        </div>
      </div>
      <div className="relative mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-black">{name}</h3>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-monova-cyan transition group-hover:border-monova-orange/50 group-hover:text-monova-orange">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/55"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
