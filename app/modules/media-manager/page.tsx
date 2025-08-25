"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/media-manager/SearchBar";
import { ResultsGrid } from "@/components/media-manager/ResultsGrid";
import { EmptyState } from "@/components/media-manager/EmptyState";
import { searchMedia } from "@/lib/media";
import { SkeletonLoader } from "@/components/media-manager/SkeletonLoader";

export default function MediaManagerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [quality, setQuality] = useState("all");
  const [provider, setProvider] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mediaSearch", searchTerm, quality, provider],
    queryFn: () => searchMedia(searchTerm, quality, provider),
    enabled: searchTerm.length > 2,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Media Manager</h1>
      <SearchBar
        onSearch={setSearchTerm}
        onQualityChange={setQuality}
        onProviderChange={setProvider}
      />
      {isLoading && <SkeletonLoader />}
      {isError && <p>Error searching for media.</p>}
      {!isLoading && !isError && data?.length === 0 && searchTerm.length > 2 && <EmptyState />}
      {data && data.length > 0 && <ResultsGrid results={data} />}
    </div>
  );
}

