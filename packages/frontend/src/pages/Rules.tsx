import { useEffect, useState } from 'react';
import { rulesApi } from '../api/client';
import './Rules.css';

export default function Rules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await rulesApi.getAll();
      setRules(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load rules:', error);
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await rulesApi.toggle(id);
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const formatCondition = (condition: any): string => {
    if (!condition) {
      return '조건 없음';
    }
    
    try {
      // condition_json이 문자열인 경우 파싱
      const cond = typeof condition === 'string' ? JSON.parse(condition) : condition;
      
      if (!cond || !cond.type) {
        return '조건 없음';
      }
      
      if (cond.type === 'sensor') {
        return `만약 ${cond.sensorType || '센서'} ${cond.operator || '>'} ${cond.threshold || 0}`;
      }
      if (cond.type === 'and' || cond.type === 'or') {
        const op = cond.type === 'and' ? '그리고' : '또는';
        return cond.conditions?.map((c: any) => formatCondition(c)).join(` ${op} `) || '조건 없음';
      }
      return '알 수 없는 조건';
    } catch (error) {
      console.error('Failed to parse condition:', error);
      return '조건 파싱 오류';
    }
  };

  const formatAction = (action: any): string => {
    if (!action) {
      return '동작 없음';
    }
    
    try {
      // action_json이 문자열인 경우 파싱
      const act = typeof action === 'string' ? JSON.parse(action) : action;
      
      if (!act || !act.type) {
        return '동작 없음';
      }
      
      if (act.type === 'actuator') {
        return `그러면 액추에이터 ${act.actuatorId || '?'} ${act.status === 'on' ? '켜기' : '끄기'}`;
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

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="rules-page">
      <div className="page-header">
        <h1>규칙</h1>
        <button className="btn-primary">규칙 추가</button>
      </div>

      <div className="rules-list">
        {rules.map((rule) => (
          <div key={rule.id} className="rule-card">
            <div className="rule-header">
              <h3>{rule.name}</h3>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggle(rule.id)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="rule-body">
              <div className="rule-condition">
                <strong>조건:</strong> {formatCondition(rule.condition_json || rule.condition)}
              </div>
              <div className="rule-action">
                <strong>동작:</strong> {formatAction(rule.action_json || rule.action)}
              </div>
            </div>
            <div className="rule-footer">
              <span className="rule-priority">우선순위: {rule.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

