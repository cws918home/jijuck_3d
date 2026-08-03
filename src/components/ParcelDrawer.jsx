import React, { useState } from 'react';

export default function ParcelDrawer({ activeParcels, onToggleParcel, onElevateAll, onFlattenAll }) {
  const [collapsed, setCollapsed] = useState(true);
  const selectedCount = activeParcels.size;

  return (
    <div className={`parcel-drawer-container ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="btn-parcel-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed(!collapsed);
        }}
      >
        <span className="toggle-label">🏷️ 필지 목록 (1번 ~ 31번)</span>
        {selectedCount > 0 && (
          <span className="selected-count-badge">{selectedCount}개 선택됨</span>
        )}
        <span className="parcel-toggle-icon">
          {collapsed ? '▲ 목록 펼치기' : '▼ 목록 접기'}
        </span>
      </button>

      <div className="parcel-drawer-body">
        <div className="parcel-drawer-header">
          <button className="parcel-action-btn elevate-all" onClick={onElevateAll}>
            ⚡ 전체 솟아오르기 (31개)
          </button>
          <button className="parcel-action-btn flatten-all" onClick={onFlattenAll}>
            🔄 전체 평평하게
          </button>
        </div>

        <div className="parcel-grid">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((seqNo) => {
            const isActive = activeParcels.has(seqNo);
            return (
              <button
                key={seqNo}
                className={`parcel-btn ${isActive ? 'active' : ''}`}
                onClick={() => onToggleParcel(seqNo)}
              >
                {seqNo}번
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
