/**
 * NotificationSettings — Push notification reminder setup panel
 * Bilingual: Arabic (RTL) + English
 * Integrated into ProfilePanel under a "Reminders" section.
 */

import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

const NAVY = "#1B2E5E";
const SKY = "#7BB8D4";
const SKY_LIGHT = "#A8D4E8";

// Day labels
const DAY_LABELS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Convert VAPID base64 key to Uint8Array for pushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "==".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

/** Register the service worker and return the registration */
async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[SW] Registration failed:", err);
    return null;
  }
}

export default function NotificationSettings() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";

  const { data: settings, refetch } = trpc.notifications.getSettings.useQuery();
  const { data: vapidData } = trpc.notifications.getVapidPublicKey.useQuery();

  const subscribeMutation = trpc.notifications.subscribe.useMutation({
    onSuccess: () => refetch(),
  });
  const unsubscribeMutation = trpc.notifications.unsubscribe.useMutation({
    onSuccess: () => refetch(),
  });
  const updateSettingsMutation = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      refetch();
      setDirty(false);
      setSuccessMsg(ar ? "✅ تم حفظ الإعدادات" : "✅ Settings saved");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });
  const sendTestMutation = trpc.notifications.sendTest.useMutation({
    onSuccess: () => {
      setSuccessMsg(ar ? "✅ تم إرسال إشعار تجريبي!" : "✅ Test notification sent!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
  });

  // Local state
  const [reminderTime, setReminderTime] = useState("09:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dirty, setDirty] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Sync local state from server settings
  useEffect(() => {
    if (settings) {
      setReminderTime(settings.reminderTime);
      const days = settings.days
        .split(",")
        .map(Number)
        .filter((d) => !isNaN(d));
      setSelectedDays(days);
    }
  }, [settings]);

  // Check current notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      setDirty(true);
      return next;
    });
  };

  const handleEnable = async () => {
    setErrorMsg("");
    setIsSubscribing(true);

    try {
      // 1. Request notification permission
      if (!("Notification" in window)) {
        setErrorMsg(ar ? "المتصفح لا يدعم الإشعارات" : "Browser does not support notifications");
        return;
      }

      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        setErrorMsg(
          ar
            ? "يجب السماح بالإشعارات من إعدادات المتصفح"
            : "Please allow notifications in your browser settings",
        );
        return;
      }

      // 2. Register service worker
      const reg = await registerSW();
      if (!reg) {
        setErrorMsg(
          ar ? "فشل تسجيل Service Worker" : "Failed to register service worker",
        );
        return;
      }

      // 3. Subscribe to push
      const vapidKey = vapidData?.publicKey;
      if (!vapidKey) {
        setErrorMsg(ar ? "مفتاح VAPID غير متاح" : "VAPID key not available");
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      const keys = subJson.keys as { p256dh: string; auth: string };

      // 4. Save subscription to server + create cron
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint!,
        p256dh: keys.p256dh,
        auth: keys.auth,
        reminderTime,
        days: selectedDays.sort((a, b) => a - b).join(","),
        language: lang as "ar" | "en",
      });

      setSuccessMsg(
        ar
          ? "✅ تم تفعيل التذكيرات بنجاح!"
          : "✅ Reminders enabled successfully!",
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message ?? (ar ? "حدث خطأ" : "An error occurred"));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDisable = async () => {
    setErrorMsg("");
    try {
      // Unsubscribe from browser push
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        }
      }
      await unsubscribeMutation.mutateAsync();
      setSuccessMsg(ar ? "✅ تم إلغاء التذكيرات" : "✅ Reminders disabled");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message ?? (ar ? "حدث خطأ" : "An error occurred"));
    }
  };

  const handleSaveSettings = async () => {
    setErrorMsg("");
    try {
      await updateSettingsMutation.mutateAsync({
        reminderTime,
        days: selectedDays.sort((a, b) => a - b).join(","),
        language: lang as "ar" | "en",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error?.message ?? (ar ? "حدث خطأ" : "An error occurred"));
    }
  };

  const isEnabled = settings?.enabled ?? false;
  const isBusy =
    isSubscribing ||
    subscribeMutation.isPending ||
    unsubscribeMutation.isPending ||
    updateSettingsMutation.isPending ||
    sendTestMutation.isPending;

  const dayLabels = ar ? DAY_LABELS_AR : DAY_LABELS_EN;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        background: "white",
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: "0 2px 12px rgba(27,46,94,0.08)",
        border: `1px solid ${SKY_LIGHT}55`,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: NAVY,
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            🔔 {ar ? "تذكيرات التمرين" : "Workout Reminders"}
          </h3>
          <p style={{ margin: "3px 0 0", color: "#7A9BB5", fontSize: 12 }}>
            {ar
              ? "احصلي على إشعار يومي لتذكيرك بوقت التمرين"
              : "Get a daily push notification to remind you to work out"}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={isEnabled ? handleDisable : handleEnable}
          disabled={isBusy}
          style={{
            width: 52,
            height: 28,
            borderRadius: 14,
            border: "none",
            background: isEnabled
              ? `linear-gradient(135deg, ${NAVY}, #2a4a8a)`
              : "#D0DFF0",
            cursor: isBusy ? "not-allowed" : "pointer",
            position: "relative",
            transition: "background 0.3s",
            flexShrink: 0,
          }}
          aria-label={isEnabled ? "Disable notifications" : "Enable notifications"}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: isEnabled ? (isRTL ? 3 : 27) : (isRTL ? 27 : 3),
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              transition: "left 0.3s",
            }}
          />
        </button>
      </div>

      {/* Permission warning */}
      {permissionState === "denied" && (
        <div
          style={{
            background: "#FFF3CD",
            border: "1px solid #FBBF24",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            color: "#92400E",
            marginBottom: 12,
          }}
        >
          ⚠️{" "}
          {ar
            ? "تم حظر الإشعارات في إعدادات المتصفح. يرجى السماح بها يدوياً."
            : "Notifications are blocked in your browser settings. Please allow them manually."}
        </div>
      )}

      {/* Settings (shown when enabled) */}
      {isEnabled && (
        <div style={{ marginTop: 4 }}>
          {/* Reminder time */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: NAVY,
                marginBottom: 6,
              }}
            >
              ⏰ {ar ? "وقت التذكير (UTC)" : "Reminder Time (UTC)"}
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => {
                setReminderTime(e.target.value);
                setDirty(true);
              }}
              style={{
                border: `2px solid ${SKY_LIGHT}`,
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 15,
                fontWeight: 700,
                color: NAVY,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "4px 0 0", color: "#7A9BB5", fontSize: 11 }}>
              {ar
                ? "الوقت بتوقيت UTC — الكويت UTC+3، اطرح 3 ساعات من وقتك المحلي"
                : "Time is in UTC — Kuwait is UTC+3, subtract 3 hours from your local time"}
            </p>
          </div>

          {/* Days of week */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: NAVY,
                marginBottom: 8,
              }}
            >
              📅 {ar ? "أيام التذكير" : "Reminder Days"}
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `2px solid ${active ? NAVY : SKY_LIGHT}`,
                      background: active ? NAVY : "white",
                      color: active ? "white" : "#7A9BB5",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {dayLabels[day]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save settings button (shown when dirty) */}
          {dirty && (
            <button
              onClick={handleSaveSettings}
              disabled={isBusy || selectedDays.length === 0}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${NAVY}, #2a4a8a)`,
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: isBusy || selectedDays.length === 0 ? "not-allowed" : "pointer",
                marginBottom: 10,
                opacity: isBusy ? 0.7 : 1,
              }}
            >
              {isBusy
                ? (ar ? "جارٍ الحفظ..." : "Saving...")
                : (ar ? "💾 حفظ الإعدادات" : "💾 Save Settings")}
            </button>
          )}

          {/* Test notification button */}
          <button
            onClick={() => sendTestMutation.mutate()}
            disabled={isBusy}
            style={{
              width: "100%",
              background: "transparent",
              color: NAVY,
              border: `2px solid ${SKY_LIGHT}`,
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.7 : 1,
            }}
          >
            {sendTestMutation.isPending
              ? (ar ? "جارٍ الإرسال..." : "Sending...")
              : (ar ? "🔔 إرسال إشعار تجريبي" : "🔔 Send Test Notification")}
          </button>
        </div>
      )}

      {/* Status messages */}
      {successMsg && (
        <div
          style={{
            marginTop: 10,
            background: "#D1FAE5",
            border: "1px solid #34D399",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            color: "#065F46",
            fontWeight: 600,
          }}
        >
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            marginTop: 10,
            background: "#FEE2E2",
            border: "1px solid #F87171",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            color: "#991B1B",
            fontWeight: 600,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
