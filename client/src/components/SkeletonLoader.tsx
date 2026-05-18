/**
 * SkeletonLoader — Loading skeleton components for Prime Fit
 * Provides shimmer-effect placeholders for content loading states.
 */

import React from 'react';

// Base skeleton block
function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style = {},
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// Home page workout card skeleton
export function WorkoutCardSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '16px',
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(27,46,94,0.06)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <SkeletonBlock width={48} height={48} borderRadius={12} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="60%" height={16} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="40%" height={12} />
        </div>
      </div>
      <SkeletonBlock width="100%" height={40} borderRadius={10} />
    </div>
  );
}

// Home page skeleton (multiple cards)
export function HomePageSkeleton() {
  return (
    <div style={{ padding: '16px' }}>
      {/* Welcome card skeleton */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1B2E5E, #0F1E3D)',
          borderRadius: 20,
          padding: '20px',
          marginBottom: 16,
        }}
      >
        <SkeletonBlock width="50%" height={20} style={{ marginBottom: 8, opacity: 0.3 }} />
        <SkeletonBlock width="30%" height={14} style={{ opacity: 0.2 }} />
      </div>
      {/* Workout cards */}
      {[1, 2, 3].map((i) => (
        <WorkoutCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Community post card skeleton
export function PostCardSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '16px',
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(27,46,94,0.06)',
      }}
    >
      {/* Header: avatar + name */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <SkeletonBlock width={40} height={40} borderRadius={20} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="45%" height={14} style={{ marginBottom: 5 }} />
          <SkeletonBlock width="25%" height={10} />
        </div>
      </div>
      {/* Content */}
      <SkeletonBlock width="100%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="80%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="60%" height={14} style={{ marginBottom: 12 }} />
      {/* Action bar */}
      <div style={{ display: 'flex', gap: 16 }}>
        <SkeletonBlock width={60} height={28} borderRadius={14} />
        <SkeletonBlock width={60} height={28} borderRadius={14} />
        <SkeletonBlock width={60} height={28} borderRadius={14} />
      </div>
    </div>
  );
}

// Community feed skeleton
export function CommunityFeedSkeleton() {
  return (
    <div style={{ padding: '0 16px' }}>
      {[1, 2, 3].map((i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Nutrition dashboard skeleton
export function NutritionSkeleton() {
  return (
    <div style={{ padding: '16px' }}>
      {/* Calorie ring area */}
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '20px',
          marginBottom: 16,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <SkeletonBlock width={100} height={100} borderRadius={50} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="70%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="50%" height={12} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="60%" height={12} />
        </div>
      </div>
      {/* Macro cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{ background: '#fff', borderRadius: 12, padding: 14 }}
          >
            <SkeletonBlock width="60%" height={12} style={{ marginBottom: 6 }} />
            <SkeletonBlock width="40%" height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile panel skeleton
export function ProfileSkeleton() {
  return (
    <div style={{ padding: '16px' }}>
      {/* Avatar + name */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
        }}
      >
        <SkeletonBlock width={80} height={80} borderRadius={40} />
        <SkeletonBlock width="40%" height={18} />
        <SkeletonBlock width="55%" height={12} />
      </div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 12 }}
          >
            <SkeletonBlock width="60%" height={20} style={{ marginBottom: 4 }} />
            <SkeletonBlock width="80%" height={10} />
          </div>
        ))}
      </div>
      {/* Menu items */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <SkeletonBlock width={32} height={32} borderRadius={8} />
          <SkeletonBlock width="50%" height={14} />
        </div>
      ))}
    </div>
  );
}

export { SkeletonBlock };
