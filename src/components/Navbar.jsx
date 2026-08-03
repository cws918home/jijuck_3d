import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="top-navbar-dock">
      {/* Brand Logo */}
      <div className="brand-logo-badge">
        <img src="logo.png" alt="로고" />
      </div>

      {/* Main Tab Switcher */}
      <div className="nav-tab-group">
        <button
          className={`nav-tab-pill ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <span className="tab-icon">🎬</span>
          <span className="tab-label">The CITADEL 소개 영상</span>
        </button>
        <button
          className={`nav-tab-pill ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <span className="tab-icon">🗺️</span>
          <span className="tab-label">3D 지적도 뷰</span>
        </button>
        <button
          className={`nav-tab-pill ${activeTab === 'vr' ? 'active' : ''}`}
          onClick={() => setActiveTab('vr')}
        >
          <span className="tab-icon">🚁</span>
          <span className="tab-label">360° 항공 VR</span>
        </button>
        <button
          className={`nav-tab-pill ${activeTab === '3dgs' ? 'active' : ''}`}
          onClick={() => setActiveTab('3dgs')}
        >
          <span className="tab-icon">✨</span>
          <span className="tab-label">3DGS</span>
        </button>
      </div>

      {/* Mode Status Pill */}
      <div className="mode-status-badge">
        <span className="status-text">
          {activeTab === 'video'
            ? '소개 영상 재생'
            : activeTab === 'map'
            ? '3D 입체 조작'
            : activeTab === 'vr'
            ? '360° 파노라마'
            : '3D Gaussian Splatting'}
        </span>
      </div>
    </header>
  );
}
