'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { CustomAvatar } from '@/components/ui/CustomAvatar';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

import RiIcon from '@/components/ui/RiIcon';

export default function ProfilePage() {
  const router = useRouter();
  const user = useQuery(api.user.user);
  const identity = useQuery(api.auth.getCurrentUser);
  const { data: session } = authClient.useSession();
  const resolveIpLocation = useAction(api.user.resolveIpLocation);
  const recordLoginActivity = useMutation(api.user.recordLoginActivity);
  const deleteLoginSessionAndActivity = useMutation(api.user.deleteLoginSessionAndActivity);
  const recentLoginActivity = useQuery(api.user.getRecentLoginActivity, { limit: 3 });
  const [deletingSessionToken, setDeletingSessionToken] = useState<string | null>(null);

  const getCurrentPlan = () => {
    let level = 0;
    if (identity?.emailVerified) level = 1;
    if (level === 1 && user?.nationalIdStatus === 'approved' && user?.driversLicenseStatus === 'approved') level = 2;
    if (level === 2 && user?.governmentIdStatus === 'approved' && user?.proofOfAddressStatus === 'approved') level = 3;

    const displayLevel = level;

    switch (displayLevel) {
      case 3:
        return {
          name: 'Premium Member',
          gradient: 'from-purple-500/20 to-white',
          border: 'border-purple-500/30',
          accent: 'text-purple-600',
          glow: 'bg-purple-500/20',
          icon: 'ri-vip-diamond-fill',
          buttonBg: 'bg-purple-500',
          features: ['Unlimited Transfers', 'Concierge Service', '0% FX Fees', 'Metal Card']
        };
      case 2:
        return {
          name: 'Gold Member',
          gradient: 'from-primary/20 to-white',
          border: 'border-primary/30',
          accent: 'text-primary',
          glow: 'bg-primary/20',
          icon: 'ri-vip-crown-fill',
          buttonBg: 'bg-primary',
          features: ['High Limits', 'Priority Support', '1% Cashback', 'Travel Insurance']
        };
      case 1:
        return {
          name: 'Member',
          gradient: 'from-blue-500/20 to-white',
          border: 'border-blue-500/30',
          accent: 'text-blue-600',
          glow: 'bg-blue-500/20',
          icon: 'ri-shield-check-fill',
          buttonBg: 'bg-blue-500',
          features: ['Standard Limits', 'In-App Support', 'Virtual Cards', 'Bill Payments']
        };
      default:
        return {
          name: 'Standard Member',
          gradient: 'from-gray-700/20 to-white',
          border: 'border-slate-200',
          accent: 'text-slate-500',
          glow: 'bg-slate-50',
          icon: 'ri-user-3-fill',
          buttonBg: 'bg-slate-900 text-white',
          features: ['Basic Transfers', 'Standard Support', 'Mobile Banking']
        };
    }
  };

  const getNextPlan = () => {
    let level = 0;
    if (identity?.emailVerified) level = 1;
    if (level === 1 && user?.nationalIdStatus === 'approved' && user?.driversLicenseStatus === 'approved') level = 2;
    if (level === 2 && user?.governmentIdStatus === 'approved' && user?.proofOfAddressStatus === 'approved') level = 3;

    if (level >= 3) return null;
    const nextLevel = level + 1;

    switch (nextLevel) {
      case 3:
        return {
          name: 'Premium Member',
          gradient: 'from-purple-500/20 to-white',
          border: 'border-purple-500/30',
          accent: 'text-purple-600',
          glow: 'bg-purple-500/20',
          icon: 'ri-vip-diamond-fill',
          buttonBg: 'bg-purple-500',
          features: ['Unlimited Transfers', 'Concierge Service', '0% FX Fees', 'Metal Card']
        };
      case 2:
        return {
          name: 'Gold Member',
          gradient: 'from-primary/20 to-white',
          border: 'border-primary/30',
          accent: 'text-primary',
          glow: 'bg-primary/20',
          icon: 'ri-vip-crown-fill',
          buttonBg: 'bg-primary',
          features: ['High Limits', 'Priority Support', '1% Cashback', 'Travel Insurance']
        };
      case 1:
        return {
          name: 'Member',
          gradient: 'from-blue-500/20 to-white',
          border: 'border-blue-500/30',
          accent: 'text-blue-600',
          glow: 'bg-blue-500/20',
          icon: 'ri-shield-check-fill',
          buttonBg: 'bg-blue-500',
          features: ['Standard Limits', 'In-App Support', 'Virtual Cards', 'Bill Payments']
        };
      default:
        return null;
    }
  };

  const currentPlan = getCurrentPlan();
  const nextPlan = getNextPlan();
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const fullName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.lastName || identity?.name || 'User';

  const email = user?.email || identity?.email || '';


  const location = [user?.city, user?.country].filter(Boolean).join(', ') || 'Not set';

  const dob = user?.dob ? new Date(user.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set';

  useEffect(() => {
    if (!identity) return;

    const sessionAny = session as any;
    const ipAddress =
      (sessionAny?.session?.ipAddress as string | undefined) ??
      (sessionAny?.data?.session?.ipAddress as string | undefined) ??
      (sessionAny?.ipAddress as string | undefined) ??
      '';
    const sessionToken =
      (sessionAny?.session?.token as string | undefined) ??
      (sessionAny?.data?.session?.token as string | undefined) ??
      (sessionAny?.token as string | undefined) ??
      '';

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const uaLower = ua.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(uaLower);
    const os = /windows/.test(uaLower)
      ? 'Windows'
      : /macintosh|mac os/.test(uaLower)
        ? 'macOS'
        : /linux/.test(uaLower)
          ? 'Linux'
          : isMobile
            ? 'Mobile'
            : 'Unknown';
    const browser = /edg\//.test(uaLower)
      ? 'Edge'
      : /chrome\//.test(uaLower) && !/edg\//.test(uaLower)
        ? 'Chrome'
        : /safari\//.test(uaLower) && !/chrome\//.test(uaLower)
          ? 'Safari'
          : /firefox\//.test(uaLower)
            ? 'Firefox'
            : 'Browser';

    const device = isMobile ? `${os} Phone` : `${os} • ${browser}`;
    const icon = isMobile ? 'ri-smartphone-line' : os === 'macOS' ? 'ri-macbook-line' : 'ri-computer-line';
    const fingerprint = `${os}|${browser}|${isMobile ? 'mobile' : 'desktop'}`;

    void (async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const resolved = ipAddress ? await resolveIpLocation({ ipAddress }) : null;
      const activityLocation = resolved?.location || tz;

      await recordLoginActivity({
        fingerprint,
        device,
        icon,
        sessionToken: sessionToken || undefined,
        location: activityLocation,
        userAgent: ua,
      });
    })().catch(() => { });
  }, [identity, recordLoginActivity, resolveIpLocation, session]);

  const formatRelativeTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    if (diffMs < 60 * 1000) return 'Just now';
    if (diffMs < 60 * 60 * 1000) {
      const mins = Math.floor(diffMs / (60 * 1000));
      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }
    if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const userStats = [
    { label: 'Account Status', value: user?.isFrozen ? 'Frozen' : 'Active', icon: 'ri-checkbox-circle-line', color: user?.isFrozen ? 'text-red-500' : 'text-green-600' },
    { label: 'Security Level', value: user?.is2FAEnabled ? 'High' : 'Medium', icon: 'ri-shield-check-line', color: 'text-primary' }
  ];

  if (user === undefined || identity === undefined || recentLoginActivity === undefined) {
    return (
      <div className="w-full selection:bg-primary/15">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 mb-8">
              <div className="h-48 md:h-64 bg-slate-100" />
              <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 gap-6">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-100 border-4 border-white" />
                  <div className="flex-1 mb-2 w-full md:w-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4">
                      <div className="w-full">
                        <div className="h-8 w-64 max-w-full bg-slate-100 rounded mb-3 mx-auto md:mx-0" />
                        <div className="h-4 w-80 max-w-full bg-slate-100 rounded mx-auto md:mx-0" />
                      </div>
                      <div className="flex gap-3">
                        <div className="h-11 w-28 bg-slate-100 rounded-xl" />
                        <div className="h-11 w-32 bg-slate-100 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-slate-100" />
                      <div className="flex-1">
                        <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
                        <div className="h-4 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-8">
                  <div className="h-6 w-56 bg-slate-100 rounded mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
                        <div className="h-5 w-48 max-w-full bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-8">
                  <div className="h-6 w-44 bg-slate-100 rounded mb-6" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 w-full bg-slate-100 rounded-2xl" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-8">
                  <div className="h-6 w-40 bg-slate-100 rounded mb-6" />
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 w-full bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
      <div className="w-full selection:bg-primary/15">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header Section */}
          <motion.div
            
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 mb-8"
          >
            {/* Cover Image */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 via-white to-primary/10 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent"></div>
            </div>

            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-slate-50 overflow-hidden relative z-10 shadow-lg shadow-slate-900/15">
                    <CustomAvatar
                      src={user?.image}
                      name={fullName}
                      size={160}
                      className="w-full! h-full! transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <button
                    onClick={() => router.push('/settings')}
                    className="absolute bottom-2 right-2 z-20 bg-primary text-black p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-white"
                  >
                    <RiIcon className="ri-camera-line" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1 mb-2 w-full md:w-auto text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{fullName}</h1>
                      <div className="flex min-w-0 items-center justify-center md:justify-start gap-3 text-slate-500">
                        <span className="flex min-w-0 items-center gap-1">
                          <RiIcon className="ri-mail-line text-primary" />
                          <span className="max-w-36 truncate  md:max-w-none">{email}</span>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className={`flex items-center gap-1 ${currentPlan.accent} ${currentPlan.glow} px-2 py-0.5 rounded-full text-xs font-bold border ${currentPlan.border}`}>
                          <RiIcon className={currentPlan.icon} />
                          {currentPlan.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push('/settings')}
                        className="px-6 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition-all flex items-center gap-2"
                      >
                        <RiIcon className="ri-settings-4-line" />
                        Settings
                      </button>
                      <button
                        onClick={() => router.push('/settings')}
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary text-black font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                      >
                        <RiIcon className="ri-edit-line" />
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200">
                {userStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg ${stat.color || 'text-slate-500'}`}>
                      <RiIcon className={stat.icon} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
                      <div className="text-slate-900 font-bold">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Personal Info */}
            <motion.div
              
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* About Me */}
              <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <RiIcon className="ri-user-smile-line text-primary" />
                    Personal Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <p className="text-slate-900 font-medium text-lg">{fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                    <p className="text-slate-900 font-medium text-lg">{dob}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <p className="text-slate-900 font-medium text-lg">{user?.phonenumber || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                    <p className="text-slate-900 font-medium text-lg">{location}</p>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio</label>
                    <p className="text-slate-600 leading-relaxed">
                      {user?.bio || 'No bio provided yet.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity/History */}
              <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <RiIcon className="ri-history-line text-primary" />
                  Recent Login Activity
                </h2>
                <div className="space-y-4">
                  {!recentLoginActivity && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">
                      Loading activity...
                    </div>
                  )}
                  {recentLoginActivity?.length === 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">
                      No recent activity yet.
                    </div>
                  )}
                  {recentLoginActivity?.map((login: any) => (
                    <div key={login._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xl text-slate-500">
                          <RiIcon className={login.icon} />
                        </div>
                        <div>
                          <div className="text-slate-900 font-medium flex items-center gap-2">
                            {login.device}
                            {login.active && <span className="text-[10px] bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Active</span>}
                          </div>
                          <div className="text-sm text-slate-500">{login.location || 'Unknown'} • {formatRelativeTime(login.lastSeenAt)}</div>
                        </div>
                      </div>
                      <button
                        disabled={!login.sessionToken || deletingSessionToken === login.sessionToken}
                        onClick={() => {
                          if (!login.sessionToken) return;
                          setDeletingSessionToken(login.sessionToken);
                          void deleteLoginSessionAndActivity({ sessionToken: login.sessionToken })
                            .finally(() => setDeletingSessionToken(null));
                        }}
                        className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:hover:text-slate-500"
                      >
                        <RiIcon className={deletingSessionToken === login.sessionToken ? "ri-loader-4-line animate-spin" : "ri-logout-box-r-line"} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Account Status & Quick Actions */}
            <motion.div
              
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              {/* Membership Card - Only show if there is a next plan */}
              {nextPlan && (
                <div className={`bg-gradient-to-br ${nextPlan.gradient} border ${nextPlan.border} rounded-3xl p-8 relative overflow-hidden transition-all duration-500`}>
                  <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 ${nextPlan.glow} rounded-full blur-3xl`}></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className={`${nextPlan.accent} font-bold uppercase tracking-widest text-xs mb-1`}>Next Level</div>
                        <div className="text-2xl font-bold text-slate-900 font-serif italic">{nextPlan.name}</div>
                      </div>
                      <RiIcon className={`${nextPlan.icon} text-4xl ${nextPlan.accent} opacity-80`} />
                    </div>

                    <div className="space-y-4 mb-8">
                      {nextPlan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                          <RiIcon className={`ri-check-line ${nextPlan.name === 'Standard Member' ? 'text-slate-500' : 'text-green-600'}`} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <button onClick={() => router.push("/settings?")} className={`w-full py-3 rounded-xl ${nextPlan.buttonBg} ${nextPlan.name === 'Gold Member' ? 'text-black' : 'text-white'} font-bold hover:brightness-110 transition-colors shadow-lg shadow-slate-900/10`}>
                      Unlock Membership
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Security', icon: 'ri-shield-key-line', href: '/settings?tab=security' },
                    { label: 'Cards', icon: 'ri-bank-card-line', href: '/cards' },
                    { label: 'Statements', icon: 'ri-file-list-3-line', href: '/documents' },
                    { label: 'Help', icon: 'ri-customer-service-2-line', href: '/support' },
                  ].map((action, i) => (
                    <Link
                      key={i}
                      href={action.href}
                      className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-primary/30 transition-all group"
                    >
                      <RiIcon className={`${action.icon} text-2xl text-slate-500 group-hover:text-primary transition-colors`} />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

    </div>
  );
}
