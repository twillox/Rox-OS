'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Share2,
  ExternalLink,
  Sparkles,
  BarChart2,
  Info,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function LinkedInManagementPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  // Composer state
  const [postText, setPostText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; url?: string; message?: string } | null>(null);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStatus, resInsights] = await Promise.all([
        fetch('/api/integrations/linkedin/status', { cache: 'no-store' }),
        fetch('/api/integrations/linkedin/analytics/insights', { cache: 'no-store' }),
      ]);

      if (resStatus.ok) {
        const dataStatus = await resStatus.json();
        setStatus(dataStatus);
      }
      if (resInsights.ok) {
        const dataInsights = await resInsights.json();
        setInsights(dataInsights);
      }
    } catch (e: any) {
      console.error('Failed to load LinkedIn dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    try {
      setPublishing(true);
      setPostResult(null);

      const res = await fetch('/api/integrations/linkedin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postText.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPostResult({
          success: true,
          url: data.url,
          message: 'Post successfully published to your LinkedIn feed!',
        });
        setPostText('');
        setToastMessage('Published to LinkedIn!');
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setPostResult({
          success: false,
          message: data.message || 'Failed to publish post.',
        });
      }
    } catch (err: any) {
      setPostResult({
        success: false,
        message: err.message || 'Network error publishing post.',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm('Are you sure you want to disconnect LinkedIn?');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/integrations/linkedin/disconnect', { method: 'POST' });
      if (res.ok) {
        setToastMessage('LinkedIn disconnected.');
        await loadData();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error('Failed to disconnect LinkedIn:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0f17] text-white">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          Loading LinkedIn Workspace...
        </div>
      </div>
    );
  }

  const isConnected = status?.connected === true;
  const capabilities = status?.capabilities || {
    profile: false,
    publish: false,
    followerAnalytics: false,
    postAnalytics: false,
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c14] text-gray-100 font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-800 bg-[#0d101d] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/integrations')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png"
              alt="LinkedIn"
              className="w-7 h-7 object-contain rounded"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">LinkedIn</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 font-medium">
                  Official OAuth 2.0
                </span>
              </div>
              <p className="text-xs text-gray-400">Share on LinkedIn & Community REST APIs</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Connected ✓
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-400 hover:bg-red-900/30 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Disconnect
              </button>
            </>
          ) : (
            <a
              href="/api/integrations/linkedin/connect"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <ShieldCheck className="w-4 h-4" /> Connect with LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl w-full mx-auto">
        {/* Connection & Member Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900/90 to-blue-950/30 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            {status?.member?.avatarUrl ? (
              <img
                src={status.member.avatarUrl}
                alt="Avatar"
                className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-900/40 border border-blue-700/60 flex items-center justify-center text-blue-300 font-bold text-xl">
                in
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {status?.member?.name || (isConnected ? 'Connected Member' : 'Not Connected')}
                </h2>
                {isConnected && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                    Active Session
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {status?.member?.email ? `Email: ${status.member.email}` : 'Authorize to enable agent automated posting'}
              </p>
            </div>
          </div>

          {/* Capabilities Badge Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${capabilities.profile ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' : 'bg-gray-800/40 border-gray-700/40 text-gray-400'}`}>
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Identity (OpenID)</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${capabilities.publish ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' : 'bg-gray-800/40 border-gray-700/40 text-gray-400'}`}>
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Publishing (w_member_social)</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${capabilities.followerAnalytics ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' : 'bg-gray-800/30 border-gray-800 text-gray-500'}`}>
              {capabilities.followerAnalytics ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <Info className="w-3.5 h-3.5 shrink-0" />}
              <span>Follower Analytics: {capabilities.followerAnalytics ? 'Active' : 'Unavailable'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${capabilities.postAnalytics ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' : 'bg-gray-800/30 border-gray-800 text-gray-500'}`}>
              {capabilities.postAnalytics ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <Info className="w-3.5 h-3.5 shrink-0" />}
              <span>Post Analytics: {capabilities.postAnalytics ? 'Active' : 'Unavailable'}</span>
            </div>
          </div>
        </div>

        {/* Status / Alert Banner if analytics unavailable */}
        {isConnected && !capabilities.followerAnalytics && (
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Connected ✓ — Analytics Unavailable</span>
              <p className="mt-0.5 text-gray-300">
                Identity and feed publishing (<code>w_member_social</code>) are operational. Follower and impression metrics require LinkedIn Community Management API approval (<code>r_member_profileAnalytics</code>). ROXTEN OS strictly presents genuine metrics and never mocks analytics numbers.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Post Composer Panel */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-sm">Post to LinkedIn</h3>
                </div>
                <span className="text-[11px] text-gray-500">Official REST API (v202401)</span>
              </div>

              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                disabled={!isConnected || publishing}
                placeholder={isConnected ? "What's on your mind? Share industry insights with your professional network..." : "Connect LinkedIn first to write and publish updates directly."}
                className="w-full h-36 bg-gray-950/80 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition resize-none disabled:opacity-50"
              />

              {postResult && (
                <div className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between ${postResult.success ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300' : 'bg-red-950/40 border border-red-800/40 text-red-300'}`}>
                  <span>{postResult.message}</span>
                  {postResult.url && (
                    <a
                      href={postResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold underline hover:text-emerald-100"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs text-gray-500">{postText.length} characters</span>
              <button
                onClick={handlePublish}
                disabled={!isConnected || publishing || !postText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Publish Update
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Growth Analyst Panel */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">AI Growth Analyst</h3>
                </div>
                {insights && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                    Score: {insights.overallHealthScore}/100
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                {insights?.summary || 'Connect LinkedIn to activate AI agent content analysis.'}
              </p>

              <div className="space-y-2.5">
                {(insights?.insights || []).map((ins: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80 text-xs flex items-start gap-2.5"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-200">{ins.title}</div>
                      <div className="text-gray-400 mt-0.5">{ins.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
              <span>Automated by ROXTEN Marketing Brain</span>
              <span className="text-purple-400 font-medium">Syncs Daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-950 border border-emerald-800 text-emerald-200 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
