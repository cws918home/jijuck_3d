import React from 'react';

export default function CameraToolbar({ onSetView, autoRotate, onToggleRotate }) {
  return (
    <div className="camera-floating-toolbar">
      <button className="cam-dock-btn" onClick={() => onSetView('overview')} title="전체보기">
        <span className="btn-icon">🌐</span>
        <span className="btn-text">전체보기</span>
      </button>
      <button className="cam-dock-btn" onClick={() => onSetView('front')} title="정면 뷰">
        <span className="btn-icon">📐</span>
        <span className="btn-text">정면 뷰</span>
      </button>
      <button className="cam-dock-btn" onClick={() => onSetView('drone')} title="드론 뷰">
        <span className="btn-icon">🚁</span>
        <span className="btn-text">드론 뷰</span>
      </button>
      <button
        className={`cam-dock-btn ${autoRotate ? 'active' : ''}`}
        onClick={onToggleRotate}
        title="360° 회전"
      >
        <span className="btn-icon">🔄</span>
        <span className="btn-text">360° 회전</span>
      </button>
    </div>
  );
}
