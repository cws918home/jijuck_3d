import React, { useState, useEffect } from 'react';

export default function ParcelEditorModal({
  selectedParcel,
  onClose,
  onSaveParcelData,
  onExportJson,
}) {
  if (!selectedParcel) return null;

  const { polyIndex, currentSeqNo, currentAreaStr } = selectedParcel;

  // Extract initial pyung and m2 from currentAreaStr (e.g., "405.0m²<br>122.5평")
  const initialM2Match = currentAreaStr ? currentAreaStr.match(/([0-9.]+)m²/) : null;
  const initialPyungMatch = currentAreaStr ? currentAreaStr.match(/([0-9.]+)평/) : null;

  const [seqNo, setSeqNo] = useState(currentSeqNo || 1);
  const [pyung, setPyung] = useState(initialPyungMatch ? initialPyungMatch[1] : '120.0');
  const [m2, setM2] = useState(initialM2Match ? initialM2Match[1] : '396.7');

  useEffect(() => {
    if (currentSeqNo) setSeqNo(currentSeqNo);
    if (initialPyungMatch) setPyung(initialPyungMatch[1]);
    if (initialM2Match) setM2(initialM2Match[1]);
  }, [selectedParcel]);

  // Handle Pyung Change -> Auto Calculate m² (m² = pyung * 3.305785)
  const handlePyungChange = (val) => {
    setPyung(val);
    const numPyung = parseFloat(val);
    if (!isNaN(numPyung)) {
      setM2((numPyung * 3.305785).toFixed(1));
    }
  };

  // Handle m² Change -> Auto Calculate Pyung (pyung = m² / 3.305785)
  const handleM2Change = (val) => {
    setM2(val);
    const numM2 = parseFloat(val);
    if (!isNaN(numM2)) {
      setPyung((numM2 / 3.305785).toFixed(1));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formattedAreaStr = `${m2}m²<br>${pyung}평`;
    onSaveParcelData({
      polyIndex,
      seqNo: parseInt(seqNo, 10),
      areaStr: formattedAreaStr,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ 땅 정보 직접 수정 (Polygon #{polyIndex})</h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form-body">
          <div className="form-group">
            <label>📌 순서 번호 (1번 ~ 31번):</label>
            <input
              type="number"
              min="1"
              max="99"
              value={seqNo}
              onChange={(e) => setSeqNo(e.target.value)}
              required
              className="modal-input"
            />
          </div>

          <div className="form-group">
            <label>📐 평수 (평):</label>
            <input
              type="number"
              step="0.1"
              value={pyung}
              onChange={(e) => handlePyungChange(e.target.value)}
              placeholder="예: 122.5"
              required
              className="modal-input highlight-input"
            />
            <span className="input-hint">💡 평수를 입력하면 면적(m²)이 자동으로 계산됩니다!</span>
          </div>

          <div className="form-group">
            <label>📏 면적 (m² - 자동 계산됨):</label>
            <input
              type="number"
              step="0.1"
              value={m2}
              onChange={(e) => handleM2Change(e.target.value)}
              placeholder="예: 405.0"
              required
              className="modal-input"
            />
          </div>

          <div className="modal-preview-badge">
            <div className="preview-label">미리보기:</div>
            <div className="preview-content">
              <strong>{seqNo}번</strong> ({m2}m² / {pyung}평)
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-modal-save">
              💾 이 땅 정보 적용하기
            </button>
            <button type="button" className="btn-modal-export" onClick={onExportJson}>
              📥 전체 JSON 코드 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
