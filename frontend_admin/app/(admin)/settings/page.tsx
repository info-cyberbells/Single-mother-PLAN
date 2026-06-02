"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Globe, Key, Save, Server, Loader2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  );

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsPending(true);
    try {
      await api.put("/api/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.error?.message || "Failed to change password. Please try again."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <TopBar title="Settings" subtitle="Admin portal configuration" />
      <main className="flex-1 p-6 space-y-6 min-h-0 max-w-4xl">
        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            Account Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input type="text" defaultValue={user?.full_name} className="input" readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
              <input type="email" defaultValue={user?.email} className="input" readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
              <input type="text" defaultValue={user?.role} className="input" readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</label>
              <input type="text" defaultValue={user?.id} className="input font-mono text-xs" readOnly />
            </div>
          </div>
        </motion.div>

        {/* Backend Config */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-400" />
            Backend Configuration
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API URL</label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="input font-mono"
              />
              <p className="text-xs text-slate-600">
                The shared backend URL. Both frontend and frontend_admin point to this.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-xs text-emerald-400 font-medium">Backend connected and responding</span>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-6"
        >
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-400" />
            Admin Notifications
          </h3>
          <div className="space-y-4">
            {[
              { label: "New user registrations", desc: "Get notified when new users sign up" },
              { label: "Application submissions", desc: "Alert when new applications are submitted" },
              { label: "Application reviews due", desc: "Daily digest of applications needing review" },
              { label: "System alerts", desc: "Critical platform errors and warnings" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-slate-200">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                </label>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            Security
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div>
                <div className="text-sm font-medium text-slate-200">Two-Factor Authentication</div>
                <div className="text-xs text-slate-500 mt-0.5">Add an extra layer of security</div>
              </div>
              <button className="btn-secondary text-xs py-2">Enable 2FA</button>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-200">Change Password</div>
                  <div className="text-xs text-slate-500 mt-0.5">Update your admin account password</div>
                </div>
                <button 
                  onClick={() => setIsChangingPassword(!isChangingPassword)} 
                  className="btn-secondary text-xs py-2"
                >
                  {isChangingPassword ? "Cancel" : "Change"}
                </button>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {passwordError}
                </div>
              )}

              {isChangingPassword && (
                <form onSubmit={handlePasswordChange} className="space-y-3 pt-3 border-t border-slate-700/30">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className="input" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="input" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="input" 
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save New Password
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
