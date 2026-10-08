'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function WorkforceAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/workforce/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-400 font-medium tracking-widest uppercase text-sm">Aggregating Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 overflow-auto pb-24">
      <div className="p-12 pb-8 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
          <Link href="/dashboard/workforce" className="hover:text-gray-900 transition-colors">Workforce</Link>
          <span>/</span>
          <span className="text-purple-400">Analytics</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-4">
          <BarChart3 className="w-10 h-10 text-purple-400" />
          Performance Analytics
        </h1>
        <p className="text-gray-500 max-w-2xl text-lg">
          Monitor your workforce's overall productivity, operational cost, and mission success trends.
        </p>
      </div>

      <div className="p-12 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Global Success Rate</h3>
            <div className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              {data?.summary?.globalSuccessRate}%
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Missions</h3>
            <div className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              {data?.summary?.totalConversations || 0}
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Successful Goals</h3>
            <div className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              {data?.summary?.successfulGoals || 0}
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Agent Breakdown</h3>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Agent Name</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Role</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Total Missions</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Successes</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {data?.analytics?.map((stat: any) => {
                const rate = stat.totalConversations > 0 ? ((stat.successfulGoals / stat.totalConversations) * 100).toFixed(1) : 100;
                return (
                  <tr key={stat.id} className="border-b border-gray-100 hover:bg-white">
                    <td className="p-4 font-medium">{stat.employee.name}</td>
                    <td className="p-4 text-gray-500">{stat.employee.role}</td>
                    <td className="p-4 text-right font-mono">{stat.totalConversations}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">{stat.successfulGoals}</td>
                    <td className="p-4 text-right font-bold text-gray-900">{rate}%</td>
                  </tr>
                );
              })}
              {(!data?.analytics || data.analytics.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No agent analytics recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
