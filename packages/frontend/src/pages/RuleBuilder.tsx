import { useState, useEffect } from 'react';
import { rulesApi, sensorsApi, controlApi } from '../api/client';
import Modal from '../components/Modal';
import './RuleBuilder.css';

interface Condition {
  type: 'sensor' | 'and' | 'or';
  sensorId?: number;
  sensorType?: string;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold?: number;
  conditions?: Condition[];
}

interface Action {
  type: 'actuator' | 'robot';
  actuatorId?: number;
  robotId?: number;
  status?: string;
  command?: string;
  value?: number;
}

export default function RuleBuilder() {
  const [rules, setRules] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [actuators, setActuators] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '', // 영농 시나리오/설명
    condition: {} as Condition,
    action: {} as Action,
    priority: 0,
  });

  // 스마트팜코리아 권장 센서 목록
  const smartFarmKoreaSensors = [
    { value: 'temperature', label: '온도 (Temperature)' },
    { value: 'humidity', label: '습도 (Humidity)' },
    { value: 'co2', label: 'CO₂' },
    { value: 'par', label: 'PAR (광합성 유효 복사량)' },
    { value: 'solar_radiation', label: '일사량 (Solar Radiation)' },
    { value: 'soil_moisture', label: '토양 수분 (Soil Moisture)' },
    { value: 'soil_ec', label: '토양 EC (양액 EC)' },
    { value: 'soil_ph', label: '토양 pH (양액 pH)' },
    { value: 'rain', label: '감우 (Rain)' },
    { value: 'wind_speed', label: '풍속 (Wind Speed)' },
    { value: 'wind_direction', label: '풍향 (Wind Direction)' },
    { value: 'leaf_wetness', label: '엽면 습도 (Leaf Wetness)' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesRes, sensorsRes, actuatorsRes] = await Promise.all([
        rulesApi.getAll(),
        sensorsApi.getAll(),
        controlApi.getActuators(),
      ]);
      setRules(rulesRes.data);
      setSensors(sensorsRes.data);
      setActuators(actuatorsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleOpenModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        condition: rule.condition_json,
        action: rule.action_json,
        priority: rule.priority,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        condition: {
          type: 'sensor',
          sensorId: sensors[0]?.id,
          sensorType: sensors[0]?.type || 'temperature',
          operator: '>',
          threshold: 0,
        },
        action: {
          type: 'actuator',
          actuatorId: actuators[0]?.id,
          status: 'on',
        },
        priority: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await rulesApi.update(editingRule.id, formData);
      } else {
        await rulesApi.create(formData);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('규칙 저장에 실패했습니다');
    }
  };

  const formatCondition = (condition: Condition | any): string => {
    if (!condition) {
      return '조건 없음';
    }
    
    try {
      // condition_json이 문자열인 경우 파싱
      const cond: Condition = typeof condition === 'string' ? JSON.parse(condition) : condition;
      
      if (!cond || !cond.type) {
        return '조건 없음';
      }
      
      if (cond.type === 'sensor') {
        const sensor = sensors.find((s) => s.id === cond.sensorId);
        return `만약 ${sensor?.name || cond.sensorType || '센서'} ${cond.operator || '>'} ${cond.threshold || 0}`;
      }
      if (cond.type === 'and' || cond.type === 'or') {
        const op = cond.type === 'and' ? '그리고' : '또는';
        return cond.conditions?.map((c: Condition) => formatCondition(c)).join(` ${op} `) || '조건 없음';
      }
      return '알 수 없는 조건';
    } catch (error) {
      console.error('Failed to parse condition:', error);
      return '조건 파싱 오류';
    }
  };

  const formatAction = (action: Action | any): string => {
    if (!action) {
      return '동작 없음';
    }
    
    try {
      // action_json이 문자열인 경우 파싱
      const act: Action = typeof action === 'string' ? JSON.parse(action) : action;
      
      if (!act || !act.type) {
        return '동작 없음';
      }
      
      if (act.type === 'actuator') {
        const actuator = actuators.find((a) => a.id === act.actuatorId);
        return `그러면 ${actuator?.name || '액추에이터'} ${act.status === 'on' ? '켜기' : '끄기'}`;
      }
      if (act.type === 'robot') {
        return `그러면 로봇 ${act.robotId || '?'} ${act.command || ''}`;
      }
      return '알 수 없는 동작';
    } catch (error) {
      console.error('Failed to parse action:', error);
      return '동작 파싱 오류';
    }
  };

  return (
    <div className="rule-builder-page">
      <div className="page-header">
        <h1>규칙 빌더</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          규칙 생성
        </button>
      </div>

      <div className="rules-list">
        {rules.map((rule) => (
          <div key={rule.id} className="rule-card">
            <div className="rule-header">
              <h3>{rule.name}</h3>
              <div className="rule-actions">
                <button className="btn-icon" onClick={() => handleOpenModal(rule)}>
                  ◈
                </button>
                <button
                  className="btn-icon"
                  onClick={async () => {
                    if (confirm('이 규칙을 삭제하시겠습니까?')) {
                      await rulesApi.delete(rule.id);
                      loadData();
                    }
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="rule-body">
              {rule.description && (
                <div className="rule-description">
                  <strong>설명:</strong> {rule.description}
                </div>
              )}
              <div className="rule-condition">
                <strong>조건:</strong> {formatCondition(rule.condition_json || rule.condition)}
              </div>
              <div className="rule-action">
                <strong>동작:</strong> {formatAction(rule.action_json || rule.action)}
              </div>
            </div>
            <div className="rule-footer">
              <span className={`rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                {rule.enabled ? '✓ 활성화' : '✗ 비활성화'}
              </span>
              <span className="rule-priority">우선순위: {rule.priority}</span>
              <button
                className="btn-toggle"
                onClick={async () => {
                  await rulesApi.toggle(rule.id);
                  loadData();
                }}
              >
                {rule.enabled ? '비활성화' : '활성화'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRule ? '규칙 수정' : '규칙 생성'}
      >
        <form onSubmit={handleSubmit} className="rule-form">
          <div className="form-group">
            <label>규칙 이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 고온 환기 룰"
              required
            />
          </div>
          <div className="form-group">
            <label>Rule Description (영농 시나리오)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="예: 장마철 습도 급증 시 환기 중지 등"
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="form-section">
            <h3>조건</h3>
            <div className="form-group">
              <label>센서 유형 (스마트팜코리아 표준)</label>
              <select
                value={formData.condition.sensorType || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    condition: {
                      ...formData.condition,
                      type: 'sensor',
                      sensorType: e.target.value,
                    },
                  });
                }}
                required
              >
                <option value="">센서 유형 선택</option>
                {smartFarmKoreaSensors.map((sensor) => (
                  <option key={sensor.value} value={sensor.value}>
                    {sensor.label}
                  </option>
                ))}
              </select>
              <small>스마트팜코리아 표준 센서 목록에서 선택</small>
            </div>
            {sensors.length > 0 && (
              <div className="form-group">
                <label>특정 센서 (선택사항)</label>
                <select
                  value={formData.condition.sensorId || ''}
                  onChange={(e) => {
                    const sensor = sensors.find((s) => s.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      condition: {
                        ...formData.condition,
                        sensorId: e.target.value ? parseInt(e.target.value) : undefined,
                        sensorType: sensor?.type || formData.condition.sensorType,
                      },
                    });
                  }}
                >
                  <option value="">이 유형의 모든 센서</option>
                  {sensors
                    .filter((s) => !formData.condition.sensorType || s.type === formData.condition.sensorType)
                    .map((sensor) => (
                      <option key={sensor.id} value={sensor.id}>
                        {sensor.name} ({sensor.location || '없음'})
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>연산자</label>
              <select
                value={formData.condition.operator || '>'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    condition: { ...formData.condition, operator: e.target.value as any },
                  })
                }
                required
              >
                <option value=">">&gt; (보다 큼)</option>
                <option value="<">&lt; (보다 작음)</option>
                <option value=">=">&gt;= (보다 크거나 같음)</option>
                <option value="<=">&lt;= (보다 작거나 같음)</option>
                <option value="==">= (같음)</option>
                <option value="!=">!= (같지 않음)</option>
              </select>
            </div>
            <div className="form-group">
              <label>임계값</label>
              <input
                type="number"
                step="0.1"
                value={formData.condition.threshold || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    condition: { ...formData.condition, threshold: parseFloat(e.target.value) },
                  })
                }
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>동작</h3>
            <div className="form-group">
              <label>동작 유형</label>
              <select
                value={formData.action.type || 'actuator'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    action: { ...formData.action, type: e.target.value as any },
                  })
                }
                required
              >
                <option value="actuator">액추에이터 제어</option>
                <option value="robot">로봇 명령</option>
              </select>
            </div>
            {formData.action.type === 'actuator' && (
              <>
                <div className="form-group">
                  <label>액추에이터</label>
                  <select
                    value={formData.action.actuatorId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        action: { ...formData.action, actuatorId: parseInt(e.target.value) },
                      })
                    }
                    required
                  >
                    <option value="">액추에이터 선택</option>
                    {actuators.map((actuator) => (
                      <option key={actuator.id} value={actuator.id}>
                        {actuator.name} ({actuator.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>상태</label>
                  <select
                    value={formData.action.status || 'on'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        action: { ...formData.action, status: e.target.value },
                      })
                    }
                    required
                  >
                    <option value="on">켜기</option>
                    <option value="off">끄기</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label>우선순위</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
              }
            />
            <small>높은 우선순위 규칙이 먼저 평가됩니다</small>
          </div>

          <div className="form-template-actions">
            <button
              type="button"
              className="btn-template"
              onClick={() => {
                const template = {
                  name: formData.name,
                  description: formData.description,
                  condition: formData.condition,
                  action: formData.action,
                };
                const key = `rule_tpl_${formData.name || Date.now()}`;
                localStorage.setItem(key, JSON.stringify(template));
                alert('템플릿이 로컬에 저장되었습니다');
              }}
            >
              템플릿 저장
            </button>
            <details className="template-loader">
              <summary className="btn-template">템플릿 불러오기</summary>
              <div className="template-list">
                {Object.keys(localStorage)
                  .filter((k) => k.startsWith('rule_tpl_'))
                  .map((key) => {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    return (
                      <div key={key} className="template-item">
                        <span>{data.name || key}</span>
                        <button
                          type="button"
                          className="btn-small"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              name: data.name || '',
                              description: data.description || '',
                              condition: data.condition || formData.condition,
                              action: data.action || formData.action,
                            });
                          }}
                        >
                          적용
                        </button>
                      </div>
                    );
                  })}
                {Object.keys(localStorage).filter((k) => k.startsWith('rule_tpl_')).length === 0 && (
                  <div className="template-empty">저장된 템플릿이 없습니다</div>
                )}
              </div>
            </details>
            <button
              type="button"
              className="btn-template"
              onClick={() => {
                const payload = {
                  name: formData.name,
                  description: formData.description,
                  condition: formData.condition,
                  action: formData.action,
                  enabled: true,
                };
                navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
                alert('규칙 JSON이 클립보드에 복사되었습니다');
              }}
            >
              JSON 내보내기
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              {editingRule ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

