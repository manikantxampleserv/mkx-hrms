import { Button, Checkbox, Chip, Switch } from "@mui/material";
import { useTheme } from "context/ThemeContext/useTheme";
import { useAuth } from "contexts/AuthContext";
import { useFontContext } from "contexts/FontContext";
import {
  Bell,
  ExternalLink,
  Key,
  Link2,
  Mail,
  RefreshCw,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useGetSettings, useUpdateProfile } from "services/settings";
import { FontSwitcherModal } from "shared/FontSwitcherModal";
import { ImagePicker } from "shared/ImagePicker";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import { SettingsPanel, SettingsRow } from "shared/SettingsPanel";
import { cn } from "utils";

/**
 * Settings tab configuration
 */
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

/**
 * Notification channel definition
 */
interface NotificationChannel {
  id: string;
  label: string;
  icon: React.ElementType;
  default_checked: boolean;
}

/**
 * Password field configuration
 */
interface PasswordFieldConfig {
  name: string;
  label: string;
  placeholder: string;
}

/**
 * Available tab configurations
 */
const tabs: TabItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "security", label: "Security", icon: Shield },
];



/**
 * Delivery channels for system alerts
 */
const notificationChannels: NotificationChannel[] = [
  { id: "email", label: "Email", icon: Mail, default_checked: true },
  { id: "push", label: "Push Notification", icon: Smartphone, default_checked: false },
];

/**
 * Fields for password update form
 */
const passwordFields: PasswordFieldConfig[] = [
  { name: "current_password", label: "Current Password", placeholder: "Enter current password" },
  { name: "new_password", label: "New Password", placeholder: "Enter at least 8 characters" },
  {
    name: "confirm_password",
    label: "Confirm New Password",
    placeholder: "Re-enter new password to confirm",
  },
];

/**
 * Settings Page Component
 *
 * Provides a modular interface for managing user profile, display preferences,
 * event notification subscriptions, third-party integrations, and authentication security.
 *
 * @returns The rendered Settings page
 */
export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useTheme();

  const { user } = useAuth();
  const { data: settingsResponse, refetch } = useGetSettings();

  const updateProfileMutation = useUpdateProfile(() => {
    refetch();
  });

  /**
   * Dynamic roles fetched from PostgreSQL database with initial fallback for current user role
   */
  const roleOptions: SelectOption[] = useMemo(() => {
    const fetchedRoles = settingsResponse?.data?.roles || [];
    const currentRole = user?.role || "";
    if (currentRole && !fetchedRoles.some((r: SelectOption) => r.value === currentRole)) {
      return [{ label: currentRole, value: currentRole }, ...fetchedRoles];
    }
    return fetchedRoles;
  }, [settingsResponse, user?.role]);

  /**
   * Dynamic integrations fetched from PostgreSQL database
   */
  const integrationsList = useMemo(() => {
    return settingsResponse?.data?.integrations || [];
  }, [settingsResponse]);

  /**
   * Dynamic notification preferences fetched from PostgreSQL database
   */
  const notificationPreferences = useMemo(() => {
    return settingsResponse?.data?.notification_preferences || [];
  }, [settingsResponse]);

  const { font } = useFontContext();
  const [fontModalOpen, setFontModalOpen] = useState(false);

  /**
   * Controlled form state for Profile bound to real authenticated user
   */
  const [profileForm, setProfileForm] = useState({
    avatar: user?.avatar || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    role: user?.role || "",
  });

  useEffect(() => {
    if (settingsResponse?.data?.profile) {
      const p = settingsResponse.data.profile;
      setProfileForm({
        avatar: p.avatar || user?.avatar || "",
        first_name: p.first_name || user?.first_name || "",
        last_name: p.last_name || user?.last_name || "",
        email: p.email || user?.email || "",
        role: p.role || user?.role || "",
      });
    } else if (user) {
      setProfileForm({
        avatar: user.avatar || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        role: user.role || "",
      });
    }
  }, [settingsResponse, user]);

  /**
   * Controlled state for password change
   */
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  /**
   * Determine whether dark mode is currently active
   */
  const isDarkMode = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  }, [theme]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage your account preferences, system notifications, and third-party integrations
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border w-fit mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <SettingsPanel
            title="Personal Information"
            description="Update your personal details and company preferences"
          >
            {/* Avatar Image Picker */}
            <div className="mb-4">
              <ImagePicker
                name="avatar"
                label="Profile Picture"
                value={profileForm.avatar}
                onChange={(base64Data) =>
                  setProfileForm((prev) => ({ ...prev, avatar: base64Data }))
                }
                initials={
                  `${profileForm.first_name.charAt(0)}${profileForm.last_name.charAt(0)}`.toUpperCase() ||
                  "JD"
                }
              />
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Input
                name="first_name"
                label="First Name"
                value={profileForm.first_name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
              />
              <Input
                name="last_name"
                label="Last Name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, last_name: e.target.value }))}
              />
              <Input
                name="email"
                type="email"
                label="Email Address"
                value={profileForm.email}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Select
                name="role"
                label="Assigned Role"
                value={profileForm.role}
                options={roleOptions}
                onValueChange={(val) => setProfileForm((prev) => ({ ...prev, role: String(val) }))}
              />
            </div>



            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                variant="contained"
                size="small"
                onClick={() => updateProfileMutation.mutate(profileForm)}
              >
                Save Profile Changes
              </Button>
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Display Preferences"
            description="Customize appearance and typography"
          >
            <SettingsRow
              label="Dark Mode"
              description="Switch between light and OLED dark mode across the entire dashboard"
            >
              <Switch
                checked={isDarkMode}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              />
            </SettingsRow>
            <SettingsRow
              label="Global Typography"
              description={`Active font: "${font === "Default" ? "Normal (Default)" : font}". Choose from Google Fonts catalog or type any custom font.`}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFontModalOpen(true)}
                className="!normal-case !text-xs !rounded-[5px] !border-border !text-foreground"
              >
                Change Font ({font === "Default" ? "Normal" : font})
              </Button>
            </SettingsRow>
          </SettingsPanel>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="space-y-8">
          <SettingsPanel
            title="Notification Preferences"
            description="Choose how and when you want to receive system updates"
          >
            {/* Delivery Channels Mapped */}
            <SettingsRow
              label="Active Channels"
              description="Select which communication endpoints receive alerts"
            >
              <div className="flex flex-col gap-2 min-w-[150px]">
                {notificationChannels.map((channel) => {
                  const ChannelIcon = channel.icon;
                  return (
                    <label
                      key={channel.id}
                      className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <Checkbox defaultChecked={channel.default_checked} className="!p-1" />
                      <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{channel.label}</span>
                    </label>
                  );
                })}
              </div>
            </SettingsRow>

            {/* Event Preferences Mapped */}
            {notificationPreferences.map((pref) => (
              <SettingsRow key={pref.key} label={pref.label} description={pref.description}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Email</span>
                    <Switch defaultChecked={pref.default_email} size="small" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Push</span>
                    <Switch defaultChecked={pref.default_push} size="small" />
                  </div>
                </div>
              </SettingsRow>
            ))}
          </SettingsPanel>
        </div>
      )}

      {/* INTEGRATIONS TAB */}
      {activeTab === "integrations" && (
        <div className="space-y-8">
          <SettingsPanel
            title="Connected Services"
            description="Manage your third-party integrations and synchronized enterprise tools"
            className="border-0 bg-transparent px-0 py-0"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {integrationsList.map((item) => (
                <div
                  key={item.key}
                  className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-xs"
                >
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                        <span className="text-foreground font-bold font-mono text-sm">
                          {item.short_code}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <Chip
                      label={item.connected ? "Connected" : "Not connected"}
                      size="small"
                      color={item.connected ? "success" : "default"}
                      variant="outlined"
                      className={
                        item.connected
                          ? "!bg-success/10"
                          : "!bg-secondary/40 !text-muted-foreground"
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {item.connected ? `Last sync: ${item.last_sync}` : "Status: Not configured"}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.connected ? (
                        <>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            className="!text-foreground hover:!bg-secondary"
                          >
                            Sync
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            className="hover:!bg-destructive/10"
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          endIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SettingsPanel>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <div className="space-y-8">
          <SettingsPanel
            title="Password & Authentication"
            description="Manage your account login credentials and security parameters"
          >
            <div className="flex flex-col gap-4 max-w-md">
              {passwordFields.map((field) => (
                <Input
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type="password"
                  value={passwords[field.name as keyof typeof passwords]}
                  onChange={(e) =>
                    setPasswords((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                />
              ))}
              <div className="pt-2">
                <Button variant="contained" size="small">
                  Update Password
                </Button>
              </div>
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your organizational account"
          >
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Use Google Authenticator or 1Password for secure 2FA verification codes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Chip
                  label="Enabled"
                  size="small"
                  color="success"
                  variant="outlined"
                  className="!bg-success/10"
                />
                <Button variant="outlined" size="small">
                  Manage
                </Button>
              </div>
            </div>
          </SettingsPanel>
        </div>
      )}

      <FontSwitcherModal open={fontModalOpen} onClose={() => setFontModalOpen(false)} />
    </div>
  );
}
