export default function SectionTitle({ children, as: Tag = 'h2' }) {
  return (
    <Tag className="relative border-b border-border pb-2.5 text-xl font-bold text-slate-900 after:absolute after:-bottom-px after:left-0 after:h-0.5 after:w-14 after:bg-action">
      {children}
    </Tag>
  );
}
