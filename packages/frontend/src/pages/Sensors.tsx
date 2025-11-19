import { useEffect, useState } from 'react';
import { sensorsApi } from '../api/client';
import Modal from '../components/Modal';
import './Sensors.css';

export default function Sensors() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    unit: '',
    description: '',
    mqtt_topic: '',
    sampling_interval: 60,
    min_value: null as number | null,
    max_value: null as number | null,
    alarm_threshold_min: null as number | null,
    alarm_threshold_max: null as number | null,
  });

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      const response = await sensorsApi.getAll();
      setSensors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load sensors:', error);
      setLoading(false);
    }
  };

  const handleOpenModal = (sensor?: any) => {
    if (sensor) {
      setEditingSensor(sensor);
      setFormData({
        name: sensor.name,
        type: sensor.type,
        location: sensor.location || '',
        unit: sensor.unit || '',
        description: sensor.description || '',
        mqtt_topic: sensor.mqtt_topic || '',
        sampling_interval: sensor.sampling_interval || 60,
        min_value: sensor.min_value || null,
        max_value: sensor.max_value || null,
        alarm_threshold_min: sensor.alarm_threshold_min || null,
        alarm_threshold_max: sensor.alarm_threshold_max || null,
      });
    } else {
      setEditingSensor(null);
      setFormData({
        name: '',
        type: '',
        location: '',
        unit: '',
        description: '',
        mqtt_topic: '',
        sampling_interval: 60,
        min_value: null,
        max_value: null,
        alarm_threshold_min: null,
        alarm_threshold_max: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSensor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSensor) {
        await sensorsApi.update(editingSensor.id, formData);
      } else {
        await sensorsApi.create(formData);
      }
      handleCloseModal();
      loadSensors();
    } catch (error) {
      console.error('Failed to save sensor:', error);
      alert('센서 저장에 실패했습니다');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 센서를 삭제하시겠습니까?')) {
      return;
    }
    try {
      await sensorsApi.delete(id);
      loadSensors();
    } catch (error) {
      console.error('Failed to delete sensor:', error);
      alert('센서 삭제에 실패했습니다');
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="sensors-page">
      <div className="page-header">
        <h1>센서</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          센서 추가
        </button>
      </div>

      <div className="sensors-grid">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="sensor-card">
            <div className="sensor-card-header">
              <h3>{sensor.name}</h3>
              <div className="sensor-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleOpenModal(sensor)}
                  title="수정"
                >
                  ◈
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDelete(sensor.id)}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            </div>
            <p className="sensor-type">유형: {sensor.type}</p>
            <p className="sensor-location">위치: {sensor.location || '없음'}</p>
            <p className="sensor-unit">단위: {sensor.unit || '없음'}</p>
          </div>
        ))}
      </div>

      {sensors.length === 0 && (
        <div className="empty-state">
          <p>센서가 없습니다. 첫 번째 센서를 추가해주세요.</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSensor ? '센서 수정' : '센서 추가'}
      >
        <form onSubmit={handleSubmit} className="sensor-form">
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">유형 선택</option>
              <option value="temperature">온도</option>
              <option value="humidity">습도</option>
              <option value="co2">CO₂</option>
              <option value="light">조도</option>
              <option value="soil_moisture">토양 수분</option>
              <option value="soil_ec">토양 EC</option>
            </select>
          </div>
          <div className="form-group">
            <label>위치</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>단위</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="℃, %, ppm 등"
            />
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="센서에 대한 상세 설명을 입력하세요"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>MQTT 토픽</label>
            <input
              type="text"
              value={formData.mqtt_topic}
              onChange={(e) => setFormData({ ...formData, mqtt_topic: e.target.value })}
              placeholder="예: sensors/temperature/1"
            />
          </div>
          <div className="form-group">
            <label>샘플링 주기 (초)</label>
            <input
              type="number"
              value={formData.sampling_interval}
              onChange={(e) => setFormData({ ...formData, sampling_interval: parseInt(e.target.value) || 60 })}
              min="1"
              placeholder="60"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>최소값</label>
              <input
                type="number"
                value={formData.min_value || ''}
                onChange={(e) => setFormData({ ...formData, min_value: e.target.value ? parseFloat(e.target.value) : null })}
                step="0.1"
                placeholder="최소값"
              />
            </div>
            <div className="form-group">
              <label>최대값</label>
              <input
                type="number"
                value={formData.max_value || ''}
                onChange={(e) => setFormData({ ...formData, max_value: e.target.value ? parseFloat(e.target.value) : null })}
                step="0.1"
                placeholder="최대값"
              />
            </div>
          </div>
          <div className="form-section">
            <h4>알람 임계값 설정</h4>
            <div className="form-row">
              <div className="form-group">
                <label>최소 임계값 (이하 시 알람)</label>
                <input
                  type="number"
                  value={formData.alarm_threshold_min || ''}
                  onChange={(e) => setFormData({ ...formData, alarm_threshold_min: e.target.value ? parseFloat(e.target.value) : null })}
                  step="0.1"
                  placeholder="최소 임계값"
                />
              </div>
              <div className="form-group">
                <label>최대 임계값 (이상 시 알람)</label>
                <input
                  type="number"
                  value={formData.alarm_threshold_max || ''}
                  onChange={(e) => setFormData({ ...formData, alarm_threshold_max: e.target.value ? parseFloat(e.target.value) : null })}
                  step="0.1"
                  placeholder="최대 임계값"
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              {editingSensor ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
