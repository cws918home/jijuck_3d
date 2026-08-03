import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CameraToolbar from './components/CameraToolbar';
import ParcelDrawer from './components/ParcelDrawer';
import MapCanvas from './components/MapCanvas';
import cadastralData from './data/cadastralData.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('video'); // Default or tab selection
  const [activeParcels, setActiveParcels] = useState(new Set());
  const [cameraPreset, setCameraPreset] = useState('overview');
  const [autoRotate, setAutoRotate] = useState(false);

  const handleToggleParcel = (seqNo) => {
    setActiveParcels((prev) => {
      const next = new Set(prev);
      if (next.has(seqNo)) {
        next.delete(seqNo);
      } else {
        next.add(seqNo);
      }
      return next;
    });
  };

  const handleElevateAll = () => {
    const all = new Set(Array.from({ length: 31 }, (_, i) => i + 1));
    setActiveParcels(all);
  };

  const handleFlattenAll = () => {
    setActiveParcels(new Set());
  };

  const handleSetView = (mode) => {
    setCameraPreset(mode);
  };

  const handleToggleRotate = () => {
    setAutoRotate(!autoRotate);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Camera Toolbar (3D Map mode only) */}
      {activeTab === 'map' && (
        <CameraToolbar
          onSetView={handleSetView}
          autoRotate={autoRotate}
          onToggleRotate={handleToggleRotate}
        />
      )}

      {/* Collapsible Parcel Drawer (3D Map mode only) */}
      {activeTab === 'map' && (
        <ParcelDrawer
          activeParcels={activeParcels}
          onToggleParcel={handleToggleParcel}
          onElevateAll={handleElevateAll}
          onFlattenAll={handleFlattenAll}
        />
      )}

      {/* The CITADEL Video Player View */}
      {activeTab === 'video' && (
        <div className="citadel-video-container">
          <div className="video-card-frame">
            <div className="video-header-bar">
              <div className="video-title-group">
                <span className="live-badge">OFFICIAL PRESENTATION</span>
                <h2 className="video-title">The CITADEL 소개 영상</h2>
              </div>
            </div>
            <div className="video-player-wrapper">
              <video
                controls
                autoPlay
                loop
                playsInline
                className="citadel-video-element"
                onEnded={(e) => {
                  e.target.currentTime = 0;
                  e.target.play();
                }}
              >
                <source src="The_Citadel.mp4" type="video/mp4" />
                <source src="The_Citadel.mov" type="video/quicktime" />
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Main 3D Canvas (map & vr modes) */}
      {activeTab !== '3dgs' && activeTab !== 'video' && (
        <div className="canvas-container">
          <MapCanvas
            activeTab={activeTab}
            activeParcels={activeParcels}
            onToggleParcel={handleToggleParcel}
            cameraPreset={cameraPreset}
            autoRotate={autoRotate}
            cadastralData={cadastralData}
          />
        </div>
      )}

      {/* 3DGS Viewer (iframe) */}
      {activeTab === '3dgs' && (
        <iframe
          src="model.html"
          title="3DGS Viewer"
          className="threeDgs-iframe"
        />
      )}
    </div>
  );
}
