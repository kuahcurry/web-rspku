import React from 'react';
import styles from './Skeleton.module.css';

export const SkeletonLine = ({ width = '100%', height = '16px', className = '' }) => (
  <div 
    className={`${styles.skeleton} ${styles.line} ${className}`}
    style={{ width, height }}
  />
);

export const SkeletonCircle = ({ size = '40px', className = '' }) => (
  <div 
    className={`${styles.skeleton} ${styles.circle} ${className}`}
    style={{ width: size, height: size }}
  />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`${styles.skeletonCard} ${className}`}>
    <SkeletonLine width="60%" height="20px" />
    <SkeletonLine width="100%" height="16px" />
    <SkeletonLine width="80%" height="16px" />
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className={styles.skeletonTable}>
    <div className={styles.skeletonTableHeader}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonLine key={`header-${i}`} width="90%" height="18px" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className={styles.skeletonTableRow}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLine key={`cell-${rowIndex}-${colIndex}`} width="80%" height="14px" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonProfile = () => (
  <div className={styles.skeletonProfile}>
    <SkeletonCircle size="80px" />
    <div className={styles.skeletonProfileInfo}>
      <SkeletonLine width="200px" height="24px" />
      <SkeletonLine width="150px" height="16px" />
      <SkeletonLine width="180px" height="16px" />
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className={styles.skeletonList}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={`list-item-${i}`} className={styles.skeletonListItem}>
        <SkeletonCircle size="48px" />
        <div className={styles.skeletonListContent}>
          <SkeletonLine width="70%" height="18px" />
          <SkeletonLine width="50%" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className={styles.skeletonDashboard}>
    <div className={styles.skeletonStats}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`stat-${i}`} className={styles.skeletonStatCard}>
          <SkeletonLine width="60%" height="14px" />
          <SkeletonLine width="40%" height="32px" />
        </div>
      ))}
    </div>
    <div className={styles.skeletonCharts}>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

const Skeleton = {
  Line: SkeletonLine,
  Circle: SkeletonCircle,
  Card: SkeletonCard,
  Table: SkeletonTable,
  Profile: SkeletonProfile,
  List: SkeletonList,
  Dashboard: SkeletonDashboard,
};

export default Skeleton;
