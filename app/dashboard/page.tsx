"use client";

import { useState, useEffect } from 'react';
import { requireAuthentication } from '@/lib/auth';
import { serverDbService } from '@/lib/supabase/client';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AccountCard } from '@/components/dashboard/AccountCard';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // TODO: Fix client-side authentication
      // const { user } = await requireAuthentication();
      const user = null; // Temporary fix
      setUser(user);

      // TODO: Re-enable data fetching after fixing authentication
      /*
      if (user) {
        const { data: accountsData } = await serverDbService.getUserDebridAccounts(user.id);
        setAccounts(accountsData || []);

        const { data: statsData } = await serverDbService.getUserDownloadStats(user.id);
        setStats(statsData);

        const { data: searchHistoryData } = await serverDbService.getUserSearchHistory(user.id);
        setSearchHistory(searchHistoryData || []);

        const { data: downloadHistoryData } = await serverDbService.getUserDownloads(user.id);
        setDownloadHistory(downloadHistoryData || []);
      }
      */
    };

    fetchData();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {accounts.map((account: any) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard title="Total Downloads" value={(stats as any)?.total_downloads ?? 0} unit="" />
        <StatsCard title="Storage Used" value={(stats as any)?.total_size_gb ?? 0} unit="GB" />
        <StatsCard title="Active Torrents" value={(stats as any)?.active_torrents ?? 0} unit="" />
        <StatsCard title="Bandwidth Used (30d)" value={(stats as any)?.bandwidth_used_gb_30d ?? 0} unit="GB" />
      </div>
      <RecentActivity 
        searchHistory={searchHistory} 
        downloadHistory={downloadHistory} 
        watchHistory={[]}
      />
    </div>
  );
}