import { useEffect, useState } from 'react';
import { controlApi } from '../api/client';
import Modal from '../components/Modal';
import './Control.css';

export default function Control() {
  const [actuators, setActuators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActuator, setSelectedActuator] = useState<any>(null);
  const [controlValue, setControlValue] = useState<number | string>('');
  const [controlType, setControlType] = useState<'on_off' | 'value' | 'schedule'>('on_off');

  useEffect(() => {
    loadActuators();
  }, []);

  const loadActuators = async () => {
    try {
      const response = await controlApi.getActuators();
      setActuators(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load actuators:', error);
      setLoading(false);
    }
  };

  const handleControl = async (id: number, status: string) => {
    try {
      await controlApi.controlActuator(id, status);
      loadActuators(); // Reload to get updated status
    } catch (error) {
      console.error('Failed to control actuator:', error);
      alert('액추에이터 제어에 실패했습니다');
    }
  };

  const handleOpenControlModal = (actuator: any) => {
    setSelectedActuator(actuator);
    setControlValue('');
    setControlType('on_off');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActuator(null);
    setControlValue('');
  };

  const handleSubmitControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActuator) return;

    try {
      let status = 'on';
      if (controlType === 'on_off') {
        status = controlValue === 'on' ? 'on' : 'off';
      } else if (controlType === 'value') {
        // 값 기반 제어 (예: 온도 설정값)
        await controlApi.controlActuator(selectedActuator.id, 'on', Number(controlValue));
        handleCloseModal();
        loadActuators();
        return;
      }

      await controlApi.controlActuator(selectedActuator.id, status);
      handleCloseModal();
      loadActuators();
    } catch (error) {
      console.error('Failed to control actuator:', error);
      alert('액추에이터 제어에 실패했습니다');
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="control-page">
      <h1>제어</h1>
      <div className="actuators-grid">
        {actuators.map((actuator) => (
          <div key={actuator.id} className="actuator-card">
            <h3>{actuator.name}</h3>
            <p className="actuator-type">{actuator.type}</p>
            <p className="actuator-status">상태: {actuator.status === 'on' ? '켜짐' : '꺼짐'}</p>
            <div className="actuator-controls">
              <button
                className={`btn ${actuator.status === 'on' ? 'btn-active' : 'btn-inactive'}`}
                onClick={() => handleControl(actuator.id, 'on')}
              >
                ON
              </button>
              <button
                className={`btn ${actuator.status === 'off' ? 'btn-active' : 'btn-inactive'}`}
                onClick={() => handleControl(actuator.id, 'off')}
              >
                OFF
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleOpenControlModal(actuator)}
              >
                상세 제어
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedActuator ? `${selectedActuator.name} 상세 제어` : '액추에이터 제어'}
      >
        <form onSubmit={handleSubmitControl} className="control-form">
          <div className="form-group">
            <label>제어 유형</label>
            <select
              value={controlType}
              onChange={(e) => setControlType(e.target.value as any)}
            >
              <option value="on_off">켜기/끄기</option>
              <option value="value">값 설정</option>
              <option value="schedule">스케줄</option>
            </select>
          </div>

          {controlType === 'on_off' && (
            <div className="form-group">
              <label>상태</label>
              <select
                value={controlValue}
                onChange={(e) => setControlValue(e.target.value)}
                required
              >
                <option value="">선택</option>
                <option value="on">켜기</option>
                <option value="off">끄기</option>
              </select>
            </div>
          )}

          {controlType === 'value' && (
            <>
              <div className="form-group">
                <label>설정값</label>
                <input
                  type="number"
                  value={controlValue}
                  onChange={(e) => setControlValue(e.target.value)}
                  placeholder="예: 25 (온도), 50 (속도)"
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <input
                  type="text"
                  placeholder="설정값에 대한 설명 (선택사항)"
                />
              </div>
            </>
          )}

          {controlType === 'schedule' && (
            <>
              <div className="form-group">
                <label>시작 시간</label>
                <input
                  type="time"
                  required
                />
              </div>
              <div className="form-group">
                <label>종료 시간</label>
                <input
                  type="time"
                  required
                />
              </div>
              <div className="form-group">
                <label>반복 요일</label>
                <div className="checkbox-group">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                    <label key={day} className="checkbox-label">
                      <input type="checkbox" />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              제어 실행
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

