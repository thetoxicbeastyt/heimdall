export function HistoryList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <ul>
        {items.map(item => (
          <li key={item.id} className="py-1">{item.title || item.query}</li>
        ))}
      </ul>
    </div>
  );
}