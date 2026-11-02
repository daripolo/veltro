'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/src/lib/auth-client';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import RiIcon from '@/components/ui/RiIcon';
import { CustomAvatar } from '@/components/ui/CustomAvatar';
import LanguageSelect from '@/components/ui/LanguageSelect';

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-slate-400';

const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2';

const langDisplay = (code: string) =>
  code === 'en'
    ? 'English'
    : code === 'es'
      ? 'Spanish'
      : code === 'fr'
        ? 'French'
        : code === 'de'
          ? 'German'
          : code;

const statusLabel = (status?: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Uploaded';

type SettingsRowProps = {
  icon: string;
  iconClass: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onClick?: () => void;
  open?: boolean;
  disabled?: boolean;
};

function SettingsRow({ icon, iconClass, title, subtitle, value, right, onClick, open, disabled }: SettingsRowProps) {
  const isButton = !!onClick && !disabled;
  return (
    <div
      onClick={isButton ? onClick : undefined}
      aria-expanded={isButton ? !!open : undefined}
      className={[
        'flex w-full min-w-0 items-center',
        'gap-3 px-4 py-3.5',
        'sm:gap-4 sm:px-5 sm:py-4',
        'text-left transition-colors duration-200',
        isButton ? 'cursor-pointer hover:bg-slate-50/60 active:bg-slate-100' : '',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className={['flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10', iconClass].join(' ')}>
        <RiIcon className={`${icon} text-lg sm:text-xl`} />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="truncate text-sm font-medium text-slate-900 sm:text-[15px]">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">{subtitle}</div>}
      </div>

      <div className="flex min-w-0 max-w-[50%] shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        {value && (
          <span className="max-w-22.5 truncate text-right text-xs text-slate-500 sm:max-w-45 sm:text-sm">
            {value}
          </span>
        )}
        {right ? (
          <div className="shrink-0">{right}</div>
        ) : isButton ? (
          <RiIcon
            className={[
              'ri-arrow-right-s-line shrink-0',
              'text-xl text-slate-400',
              'transition-transform duration-200',
              open ? 'rotate-90' : '',
            ].join(' ')}
          />
        ) : null}
      </div>
    </div>
  );
}

function SettingsPanel({ isOpen, children, className = '' }: { isOpen: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.25, ease: 'easeOut' },
            opacity: { duration: 0.2 },
          }}
          className="overflow-hidden border-t border-slate-200"
        >
          <div className={['px-4 py-5 sm:px-5 sm:py-6', className].join(' ')}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="w-full">
      <h2 className="px-4 pb-2 pt-6 text-xs font-medium uppercase tracking-wide text-slate-400 sm:px-5 sm:pb-3 sm:pt-8">
        {title}
      </h2>
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white sm:rounded-3xl">
        <div className="divide-y divide-slate-100">{children}</div>
      </div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  checkedColor = "peer-checked:bg-primary",
}: {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  checkedColor?: string;
}) {
  return (
    <label
      className="
        relative inline-flex
        h-5 w-10
        shrink-0
        cursor-pointer
        items-center
      "
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />

      {/* Track */}
      <span
        className={`
          absolute inset-0
          rounded-full
          bg-slate-200
          transition-colors
          duration-200
          ease-out
          ${checkedColor}
        `}
      />

      {/* Thumb */}
      <span
        className="
          pointer-events-none
          absolute left-0.5
          size-4
          rounded-full
          bg-white
          shadow-sm
          transition-transform
          duration-200
          ease-out
          peer-checked:translate-x-4
        "
      />
    </label>
  );
}


export default function SettingsPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const identity = useQuery(api.auth.getCurrentUser);
  const user = useQuery(api.user.user);
  const router = useRouter();
  const updateUser = useMutation(api.user.updateUser);
  const updateVerification = useMutation(api.user.updateVerificationStatus);
  const generateUploadUrl = useMutation(api.user.generateUploadUrl);
  const toggle2FA = useMutation(api.user.toggle2FA);
  const toggleFreeze = useMutation(api.user.toggleFreeze);
  const deleteAccount = useMutation(api.user.deleteAccount);
  const setCardFreeze = useMutation(api.creditCards.setCardFreeze);
  const cards = useQuery(api.creditCards.getCreditCards);
  const updateUserPassword = useMutation(api.user.updateUserPassword);
  const updateProfileImage = useMutation(api.user.updateProfileImage);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phonenumber: '',
    dob: '',
    country: '',
    city: '',
    zipCode: '',
    occupation: '',
    bio: '',
    currency: 'usd',
    language: 'en',
    governmentIdNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phonenumber: user.phonenumber ? user.phonenumber.toString() : '',
        dob: user.dob || '',
        country: user.country || '',
        city: user.city || '',
        zipCode: user.zipCode || '',
        occupation: user.occupation || '',
        bio: user.bio || '',
        currency: user.currency || 'usd',
        language: langDisplay(user.language || 'en'),
        governmentIdNumber: user.governmentIdNumber || '',
      });
    }
  }, [user]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      formData.firstName !== (user.firstName || '') ||
      formData.lastName !== (user.lastName || '') ||
      formData.phonenumber !== (user.phonenumber ? user.phonenumber.toString() : '') ||
      formData.dob !== (user.dob || '') ||
      formData.country !== (user.country || '') ||
      formData.city !== (user.city || '') ||
      formData.zipCode !== (user.zipCode || '') ||
      formData.occupation !== (user.occupation || '') ||
      formData.bio !== (user.bio || '') ||
      formData.governmentIdNumber !== (user.governmentIdNumber || '') ||
      formData.language !== langDisplay(user.language || 'en') ||
      formData.currency !== (user.currency || 'usd')
    );
  }, [formData, user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phonenumber: Number(formData.phonenumber) || undefined,
        dob: formData.dob,
        country: formData.country,
        city: formData.city,
        zipCode: formData.zipCode,
        occupation: formData.occupation,
        bio: formData.bio,
        currency: formData.currency,
        language: formData.language,
        governmentIdNumber: formData.governmentIdNumber,
      });
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    try {
      await updateUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPasswordStatus({ type: 'error', message: 'Failed to update password.' });
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      alert('No email found for this user.');
      return;
    }

    try {
      const { error } = await authClient.requestPasswordReset({
        email: user.email,
        redirectTo: '/reset-password',
      });

      if (error) {
        alert('Failed to send reset email: ' + error.message);
      } else {
        alert('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    }
  };

  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await updateProfileImage({ storageId });
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getUserLevel = () => {
    if (!user) return 0;
    let level = 0;
    if (identity?.emailVerified == true) {
      level = 1;
    }
    if (level === 1 && user.nationalIdStatus === 'approved' && user.driversLicenseStatus === 'approved') {
      level = 2;
    }
    if (level === 2 && user.governmentIdStatus === 'approved' && user.proofOfAddressStatus === 'approved') {
      level = 3;
    }
    return level;
  };

  const userLevel = getUserLevel();

  const handleFileSelect = (type: string) => {
    setUploadingType(type);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingType) return;

    try {
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await updateVerification({
        type: uploadingType as 'nationalIdFront' | 'nationalIdBack' | 'driversLicenseFront' | 'driversLicenseBack' | 'proofOfAddress',
        status: 'pending',
        storageId: storageId as Id<'_storage'>,
      });

      setUploadingType(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getUploadBoxStyle = (isUploaded: boolean, isApproved: boolean) => {
    if (isApproved) return 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300';
    if (isUploaded) return 'border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300';
    return 'border-slate-200 bg-slate-50 text-slate-500 hover:border-primary/50 group';
  };

  const getUploadIcon = (isUploaded: boolean, isApproved: boolean) => {
    if (isApproved) return 'ri-checkbox-circle-line text-emerald-600';
    if (isUploaded) return 'ri-time-line text-amber-600';
    return 'ri-image-add-line text-slate-400 group-hover:text-primary';
  };

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const kycStatusText = (type: string, storageId: string | undefined, approved: boolean) => {
    if (approved) return 'Verified';
    if (uploadingType === type) return 'Uploading...';
    if (storageId) return 'Pending Review';
    return 'Click to upload';
  };

  const renderUploadBox = (type: string, label: string, storageId: string | undefined, status: string | undefined) => {
    const approved = status === 'approved';
    return (
      <div
        onClick={() => handleFileSelect(type)}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${getUploadBoxStyle(!!storageId, approved)}`}
      >
        <RiIcon className={`${getUploadIcon(!!storageId, approved)} mb-2 text-3xl transition-colors`} />
        <p className={`text-sm font-bold ${approved ? 'text-emerald-600' : !!storageId ? 'text-amber-600' : 'text-slate-900'}`}>{label}</p>
        <p className="mt-1 text-xs opacity-70">{kycStatusText(type, storageId, approved)}</p>
      </div>
    );
  };

  if (!user || !identity || cards === undefined) {
    return (
      <div className="mx-auto w-full lg:max-w-7xl animate-pulse px-0 py-8">
        <div className="mb-8">
          <div className="mb-3 h-10 w-40 rounded bg-slate-100" />
          <div className="h-4 w-full rounded bg-slate-100" />
        </div>
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 pb-3 pt-5">
                <div className="h-3 w-24 rounded bg-slate-100" />
              </div>
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4 px-5 py-4">
                    <div className="size-10 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-slate-100" />
                      <div className="h-3 w-2/3 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || user.email || 'User';

  return (
    <div className="mx-auto w-full max-w-7xl px-0 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account settings and preferences</p>
      </motion.div>

      <div className="space-y-4">
        {/* Account */}
        <SettingsGroup title="Account">
          <SettingsRow
            icon="ri-user-3-line"
            iconClass="bg-primary/10 text-primary"
            title="Profile"
            subtitle={fullName}
            open={openSection === 'profile'}
            onClick={() => toggleSection('profile')}
          />
          <SettingsPanel isOpen={openSection === 'profile'}>
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div
                  className="group relative cursor-pointer"
                  onClick={() => document.getElementById('settings-profile-image-input')?.click()}
                >
                  <input
                    id="settings-profile-image-input"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                  />
                  <div className="size-20 overflow-hidden rounded-2xl border-2 border-slate-200 transition-colors group-hover:border-primary">
                    <CustomAvatar
                      src={user.image}
                      name={fullName}
                      size={80}
                      className="h-full w-full"
                      rounded="rounded-none"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex size-6 lg:size-8 items-center justify-center rounded-lg bg-primary text-white transition-transform group-hover:scale-105">
                    <RiIcon className="ri-camera-line text-sm" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">Profile photo</p>
                  <p className="mt-0.5 text-sm text-slate-500">PNG or JPG</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="First name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Email Address</label>
                  <p className="py-3.5 text-slate-900">{user.email}</p>
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phonenumber}
                    onChange={(e) => handleInputChange('phonenumber', e.target.value)}
                    placeholder="Phone number"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    placeholder="Occupation"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Bio</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us a little about yourself"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>
          </SettingsPanel>

          <SettingsRow
            icon="ri-map-pin-line"
            iconClass="bg-primary/10 text-primary"
            title="Address"
            subtitle={[formData.city, formData.country].filter(Boolean).join(', ') || 'Add your address'}
            open={openSection === 'address'}
            onClick={() => toggleSection('address')}
          />
          <SettingsPanel isOpen={openSection === 'address'}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Country</label>
                <div className="relative">
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    {['United States', 'United Kingdom', 'Canada', 'Germany', 'France'].map((opt) => (
                      <option key={opt} value={opt} className="bg-white text-slate-900">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <RiIcon className="ri-arrow-down-s-line" />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Postal Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Postal code"
                  className={inputClass}
                />
              </div>
            </div>
          </SettingsPanel>
        </SettingsGroup>

        {/* Security */}
        <SettingsGroup title="Security">
          <SettingsRow
            icon="ri-lock-password-line"
            iconClass="bg-primary/10 text-primary"
            title="Change password"
            subtitle="Update your login password"
            open={openSection === 'password'}
            onClick={() => toggleSection('password')}
          />
          <SettingsPanel isOpen={openSection === 'password'}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={inputClass}
                />
              </div>

              {passwordStatus && (
                <div className={`text-sm font-bold ${passwordStatus.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {passwordStatus.message}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={handleForgotPassword}
                  className="text-left text-sm font-bold text-primary transition-colors hover:text-orange-700"
                >
                  Forgot your password? Reset it here
                </button>
                <button
                  onClick={handleChangePassword}
                  className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors active:scale-[0.98] sm:w-auto"
                >
                  Update Password
                </button>
              </div>
            </div>
          </SettingsPanel>

          <SettingsRow
            icon="ri-shield-check-line"
            iconClass="bg-primary/10 text-primary"
            title="Two-factor authentication"
            subtitle={user.is2FAEnabled ? 'Enabled' : 'Disabled'}
            right={
              <Toggle
                checked={!!user.is2FAEnabled}
                onChange={(e) => toggle2FA({ enabled: e.target.checked })}
              />
            }
          />

          <SettingsRow
            icon="ri-bank-card-line"
            iconClass="bg-blue-50 text-blue-600"
            title="Freeze card"
            subtitle="Temporarily disable your main card"
            right={
              <Toggle
                checked={cards.length > 0 && !!cards[0].freeze}
                checkedColor="peer-checked:bg-blue-600"
                onChange={(e) => {
                  if (cards.length > 0) {
                    setCardFreeze({ id: cards[0]._id, freeze: e.target.checked });
                  } else {
                    alert('No card found to freeze.');
                  }
                }}
              />
            }
          />

          <SettingsRow
            icon="ri-user-unfollow-line"
            iconClass="bg-orange-50 text-orange-600"
            title="Freeze account"
            subtitle="Temporarily disable all account activity"
            right={
              <Toggle
                checked={!!user.isFrozen}
                checkedColor="peer-checked:bg-orange-600"
                onChange={(e) => toggleFreeze({ frozen: e.target.checked })}
              />
            }
          />

          <SettingsRow
            icon="ri-delete-bin-line"
            iconClass="bg-red-50 text-red-500"
            title="Delete account"
            subtitle="Permanently remove your account and data"
            open={openSection === 'delete'}
            onClick={() => toggleSection('delete')}
          />
          <SettingsPanel isOpen={openSection === 'delete'} className="bg-red-50/40">
            <div className="space-y-4">
              <p className="text-sm font-medium text-red-500">
                Permanently removes your account, cards, and transaction history. This action cannot be undone.
              </p>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    await deleteAccount({});
                    router.push('/');
                  }
                }}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white active:scale-[0.98] sm:w-auto"
              >
                Delete my account
              </button>
            </div>
          </SettingsPanel>
        </SettingsGroup>

        {/* Verification */}
        <SettingsGroup title="Verification">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-slate-900">Identity level</p>
              <span className="text-sm font-bold text-primary">Level {userLevel} of 3</span>
            </div>
            <div className="mb-4 flex items-center gap-1.5">
              {[1, 2, 3].map((l) => (
                <div
                  key={l}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${userLevel >= l ? 'bg-primary' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { level: 1, title: 'Starter', desc: 'Email verified' },
                { level: 2, title: 'Verified', desc: '$50k daily limit' },
                { level: 3, title: 'Business', desc: 'Unlimited' },
              ].map((item) => {
                const done = userLevel >= item.level;
                const current = userLevel === item.level;
                return (
                  <div
                    key={item.level}
                    className={`rounded-xl border px-4 py-3 transition-colors ${
                      current
                        ? 'border-primary bg-primary/10'
                        : done
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 opacity-50'
                    }`}
                  >
                    <p className={`text-xs font-bold ${current ? 'text-primary' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                      Level {item.level}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
          />

          <SettingsRow
            icon="ri-id-card-line"
            iconClass="bg-primary/10 text-primary"
            title="National ID"
            subtitle="Front and back of your ID card"
            value={statusLabel(user.nationalIdStatus)}
            open={openSection === 'nationalId'}
            onClick={() => toggleSection('nationalId')}
          />
          <SettingsPanel isOpen={openSection === 'nationalId'}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderUploadBox('nationalIdFront', 'Front Side', user.nationalIdFrontStorageId, user.nationalIdStatus)}
              {renderUploadBox('nationalIdBack', 'Back Side', user.nationalIdBackStorageId, user.nationalIdStatus)}
            </div>
          </SettingsPanel>

          <SettingsRow
            icon="ri-steering-2-line"
            iconClass="bg-blue-50 text-blue-600"
            title="Driver&apos;s License"
            subtitle="Valid government-issued license"
            value={statusLabel(user.driversLicenseStatus)}
            open={openSection === 'license'}
            onClick={() => toggleSection('license')}
          />
          <SettingsPanel isOpen={openSection === 'license'}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderUploadBox('driversLicenseFront', 'Front Side', user.driversLicenseFrontStorageId, user.driversLicenseStatus)}
              {renderUploadBox('driversLicenseBack', 'Back Side', user.driversLicenseBackStorageId, user.driversLicenseStatus)}
            </div>
          </SettingsPanel>

          <SettingsRow
            icon="ri-vip-crown-line"
            iconClass="bg-slate-100 text-slate-600"
            title="Government ID number"
            subtitle="Saved with your profile"
            value={statusLabel(user.governmentIdStatus)}
            open={openSection === 'governmentId'}
            onClick={() => toggleSection('governmentId')}
          />
          <SettingsPanel isOpen={openSection === 'governmentId'}>
            <div>
              <label className={labelClass}>Government ID Number</label>
              <input
                type="text"
                value={formData.governmentIdNumber}
                onChange={(e) => handleInputChange('governmentIdNumber', e.target.value)}
                placeholder="Enter your ID number"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">Saved with your profile details.</p>
            </div>
          </SettingsPanel>

          <SettingsRow
            icon="ri-file-text-line"
            iconClass="bg-slate-100 text-slate-600"
            title="Proof of address"
            subtitle="Utility bill or bank statement"
            value={statusLabel(user.proofOfAddressStatus)}
            open={openSection === 'addressProof'}
            onClick={() => toggleSection('addressProof')}
          />
          <SettingsPanel isOpen={openSection === 'addressProof'}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Utility bill or bank statement</p>
                <p className="mt-0.5 text-xs text-slate-500">Accepted formats: JPG, PNG or PDF</p>
              </div>
              <button
                onClick={() => handleFileSelect('proofOfAddress')}
                disabled={uploadingType === 'proofOfAddress'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-900 transition-colors active:scale-[0.98] disabled:opacity-50 sm:w-auto"
              >
                {uploadingType === 'proofOfAddress' ? 'Uploading...' : 'Upload document'}
              </button>
            </div>
          </SettingsPanel>
        </SettingsGroup>

        {/* Preferences */}
        <SettingsGroup title="Preferences">
          <SettingsRow
            icon="ri-global-line"
            iconClass="bg-primary/10 text-primary"
            title="Language"
            subtitle="App language and format"
            value={formData.language}
            open={openSection === 'language'}
            onClick={() => toggleSection('language')}
          />
          <SettingsPanel isOpen={openSection === 'language'}>
            <LanguageSelect
              value={formData.language}
              onChange={(val) => handleInputChange('language', val)}
            />
          </SettingsPanel>

          <SettingsRow
            icon="ri-money-dollar-circle-line"
            iconClass="bg-slate-100 text-slate-600"
            title="Currency"
            subtitle="Coming soon"
            value={formData.currency.toUpperCase()}
            disabled
          />

          <SettingsRow
            icon="ri-palette-line"
            iconClass="bg-primary/10 text-primary"
            title="Card theme"
            subtitle="Choose how your card looks"
            value="Gold"
            open={openSection === 'theme'}
            onClick={() => toggleSection('theme')}
          />
          <SettingsPanel isOpen={openSection === 'theme'}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative cursor-pointer rounded-xl border-2 border-primary bg-white p-4">
                <div className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                  <RiIcon className="ri-check-line text-xs" />
                </div>
                <div className="mb-3 h-24 rounded-lg border border-slate-200 bg-linear-to-br from-primary/10 to-primary/5"></div>
                <p className="text-center font-bold text-slate-900">Gold</p>
                <p className="mt-1 text-center text-xs text-primary">Active</p>
              </div>
              <div className="cursor-not-allowed rounded-xl border border-slate-200 bg-white p-4 opacity-50">
                <div className="mb-3 h-24 rounded-lg bg-slate-100"></div>
                <p className="text-center font-bold text-slate-500">Light</p>
                <p className="mt-1 text-center text-xs text-slate-400">Coming Soon</p>
              </div>
            </div>
          </SettingsPanel>
        </SettingsGroup>
      </div>

      {/* Global Save */}
      {isDirty && (
        <div className="mt-10 flex justify-end border-t border-slate-200 pt-8">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isLoading ? (
              <>
                <RiIcon className="ri-loader-4-line animate-spin text-xl" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <RiIcon className="ri-save-line text-xl" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
