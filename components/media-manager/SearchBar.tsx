"use client";

import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onQualityChange: (quality: string) => void;
  onProviderChange: (provider: string) => void;
}

export function SearchBar({ onSearch, onQualityChange, onProviderChange }: SearchBarProps) {
  const [term, setTerm] = useState('');

  useEffect(() => {
    const debounce = setTimeout(() => {
      onSearch(term);
    }, 500);

    return () => {
      clearTimeout(debounce);
    };
  }, [term, onSearch]);

  return (
    <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search for movies, shows..."
          className="flex-grow p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-white/50 transition-colors"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <select 
          className="p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-white/50 transition-colors"
          onChange={(e) => onQualityChange(e.target.value)}
        >
          <option value="all">All Qualities</option>
          <option value="4k">4K</option>
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
        </select>
        <select 
          className="p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-white/50 transition-colors"
          onChange={(e) => onProviderChange(e.target.value)}
        >
          <option value="all">All Providers</option>
          {/* Add provider options here */}
        </select>
      </div>
    </div>
  );
}