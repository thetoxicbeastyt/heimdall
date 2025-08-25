import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountCard({ account }: { account: any }) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="capitalize">{account.provider.replace('-', ' ')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Status: {account.is_active ? 'Active' : 'Inactive'}</p>
          <p>Expires: {new Date(account.expires_at).toLocaleDateString()}</p>
          {/* Add usage details here when available in the database */}
        </div>
      </CardContent>
    </Card>
  );
}