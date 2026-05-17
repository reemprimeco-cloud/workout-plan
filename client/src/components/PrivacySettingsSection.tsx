/**
 * PrivacySettingsSection — Community privacy & notification preferences
 * Controls: DM, follow, mention, private account, notification types
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Lock, MessageCircle, UserPlus, AtSign, Bell,
  Heart, Repeat2, ChevronDown, ChevronUp, Shield,
} from "lucide-react";

const NAVY = "#1B2E5E";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? NAVY : "#D1D5DB",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function SettingRow({ icon, label, sublabel, checked, onChange }: RowProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid #F3F4F6",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "#F0F4F8",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "#111827", fontSize: 14, fontWeight: 600 }}>{label}</p>
        {sublabel && (
          <p style={{ margin: 0, color: "#9CA3AF", fontSize: 11, marginTop: 1 }}>{sublabel}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function PrivacySettingsSection({ lang = "en" }: { lang?: string }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = trpc.community.getPrivacySettings.useQuery(undefined, {
    enabled: open,
  });

  const update = trpc.community.updatePrivacySettings.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const utils = trpc.useUtils();

  function handleChange(field: string, value: boolean) {
    if (!settings) return;
    const updated = { ...settings, [field]: value };
    utils.community.getPrivacySettings.setData(undefined, updated as any);
    update.mutate({ [field]: value });
  }

  const s = settings as any;

  return (
    <div style={{
      background: "white", borderRadius: 16,
      boxShadow: "0 2px 8px rgba(27,46,94,0.07)",
      overflow: "hidden",
      marginBottom: 8,
    }}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none",
          cursor: "pointer", padding: "14px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield style={{ width: 18, height: 18, color: NAVY }} />
          <span style={{ color: "#111827", fontWeight: 700, fontSize: 15 }}>
            {lang === "ar" ? "الخصوصية والإشعارات" : "Privacy & Notifications"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saved && (
            <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600 }}>
              {lang === "ar" ? "✅ تم الحفظ" : "✅ Saved"}
            </span>
          )}
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: "#9CA3AF" }} />
            : <ChevronDown style={{ width: 16, height: 16, color: "#9CA3AF" }} />
          }
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 18px 14px", borderTop: "1px solid #F3F4F6" }}>
          {isLoading ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Loading...
            </div>
          ) : !s ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              {lang === "ar" ? "تعذّر تحميل الإعدادات" : "Could not load settings"}
            </div>
          ) : (
            <>
              {/* Account Privacy */}
              <p style={{ margin: "12px 0 4px", color: "#6B7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ar" ? "الحساب" : "Account"}
              </p>
              <SettingRow
                icon={<Lock style={{ width: 16, height: 16, color: NAVY }} />}
                label={lang === "ar" ? "حساب خاص" : "Private Account"}
                sublabel={lang === "ar" ? "فقط المتابعون يرون منشوراتك" : "Only followers can see your posts"}
                checked={!!s.isPrivate}
                onChange={v => handleChange("isPrivate", v)}
              />
              <SettingRow
                icon={<UserPlus style={{ width: 16, height: 16, color: "#10B981" }} />}
                label={lang === "ar" ? "السماح بالمتابعة" : "Allow Follows"}
                sublabel={lang === "ar" ? "يمكن للأعضاء متابعتك" : "Members can follow your profile"}
                checked={!!s.allowFollows}
                onChange={v => handleChange("allowFollows", v)}
              />
              <SettingRow
                icon={<MessageCircle style={{ width: 16, height: 16, color: "#3B82F6" }} />}
                label={lang === "ar" ? "السماح بالرسائل الخاصة" : "Allow Direct Messages"}
                sublabel={lang === "ar" ? "يمكن للأعضاء مراسلتك" : "Members can send you DMs"}
                checked={!!s.allowDms}
                onChange={v => handleChange("allowDms", v)}
              />
              <SettingRow
                icon={<AtSign style={{ width: 16, height: 16, color: "#06B6D4" }} />}
                label={lang === "ar" ? "السماح بالإشارة إليك" : "Allow Mentions"}
                sublabel={lang === "ar" ? "يمكن للأعضاء الإشارة إليك في المنشورات" : "Members can @mention you in posts"}
                checked={!!s.allowMentions}
                onChange={v => handleChange("allowMentions", v)}
              />

              {/* Notification Preferences */}
              <p style={{ margin: "16px 0 4px", color: "#6B7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ar" ? "الإشعارات" : "Notifications"}
              </p>
              <SettingRow
                icon={<Heart style={{ width: 16, height: 16, color: "#EF4444" }} />}
                label={lang === "ar" ? "إشعارات الإعجاب" : "Like Notifications"}
                sublabel={lang === "ar" ? "عند إعجاب أحدهم بمنشورك" : "When someone likes your post"}
                checked={!!s.notifyLikes}
                onChange={v => handleChange("notifyLikes", v)}
              />
              <SettingRow
                icon={<MessageCircle style={{ width: 16, height: 16, color: "#3B82F6" }} />}
                label={lang === "ar" ? "إشعارات التعليقات" : "Comment Notifications"}
                sublabel={lang === "ar" ? "عند تعليق أحدهم على منشورك" : "When someone comments on your post"}
                checked={!!s.notifyComments}
                onChange={v => handleChange("notifyComments", v)}
              />
              <SettingRow
                icon={<UserPlus style={{ width: 16, height: 16, color: "#10B981" }} />}
                label={lang === "ar" ? "إشعارات المتابعة" : "Follow Notifications"}
                sublabel={lang === "ar" ? "عند متابعة أحدهم لك" : "When someone follows you"}
                checked={!!s.notifyFollows}
                onChange={v => handleChange("notifyFollows", v)}
              />
              <SettingRow
                icon={<AtSign style={{ width: 16, height: 16, color: "#06B6D4" }} />}
                label={lang === "ar" ? "إشعارات الإشارة" : "Mention Notifications"}
                sublabel={lang === "ar" ? "عند الإشارة إليك في منشور" : "When someone mentions you"}
                checked={!!s.notifyMentions}
                onChange={v => handleChange("notifyMentions", v)}
              />
              <SettingRow
                icon={<MessageCircle style={{ width: 16, height: 16, color: NAVY }} />}
                label={lang === "ar" ? "إشعارات الرسائل" : "Message Notifications"}
                sublabel={lang === "ar" ? "عند استلام رسالة خاصة" : "When you receive a DM"}
                checked={!!s.notifyMessages}
                onChange={v => handleChange("notifyMessages", v)}
              />
              <div style={{ borderBottom: "none" }}>
                <SettingRow
                  icon={<Repeat2 style={{ width: 16, height: 16, color: "#8B5CF6" }} />}
                  label={lang === "ar" ? "إشعارات الردود" : "Reply Notifications"}
                  sublabel={lang === "ar" ? "عند الرد على تعليقك" : "When someone replies to your comment"}
                  checked={!!s.notifyReplies}
                  onChange={v => handleChange("notifyReplies", v)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
