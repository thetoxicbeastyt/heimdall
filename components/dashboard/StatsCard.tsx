import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCard({ title, value, unit }: { title: string; value: number; unit: string }) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value} {unit}</p>
      </CardContent>
    </Card>
  );
}