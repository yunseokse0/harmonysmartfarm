import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import './ApiKeys.css';

interface ApiKey {
  id: number;
  name: string;
  scopes: string[];
  status: string;
  quota_daily: number;
  quota_used: number;
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { openapiApi } = await import('../api/client');
      const response = await openapiApi.getKeys();
      setApiKeys(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { openapiApi } = await import('../api/client');
      const response = await openapiApi.createKey(newKeyName, newKeyScopes);
      setCreatedKey(response.data.key);
      setNewKeyName('');
      setNewKeyScopes([]);
      loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'API 키 생성에 실패했습니다');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('이 API 키를 비활성화하시겠습니까?')) {
      return;
    }

    try {
      const { openapiApi } = await import('../api/client');
      await openapiApi.deactivateKey(id);
      loadApiKeys();
    } catch (error: any) {
      console.error('Failed to deactivate API key:', error);
      alert(error.response?.data?.error || 'API 키 비활성화에 실패했습니다');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const { openapiApi } = await import('../api/client');
      await openapiApi.deleteKey(id);
      loadApiKeys();
    } catch (error: any) {
      console.error('Failed to delete API key:', error);
      alert(error.response?.data?.error || 'API 키 삭제에 실패했습니다');
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('API 키가 클립보드에 복사되었습니다');
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="api-keys-page">
      <div className="page-header">
        <h1>API 키 관리</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + API 키 생성
        </button>
      </div>

      {createdKey && (
        <div className="key-created-alert">
          <h3>API 키가 생성되었습니다!</h3>
          <p className="warning">⚠️ 이 키는 지금만 표시됩니다. 안전한 곳에 저장하세요.</p>
          <div className="key-display">
            <code>{createdKey}</code>
            <button className="btn-secondary" onClick={() => handleCopyKey(createdKey)}>
              복사
            </button>
          </div>
          <button className="btn-primary" onClick={() => setCreatedKey(null)}>
            확인
          </button>
        </div>
      )}

      <div className="api-keys-list">
        {apiKeys.length === 0 ? (
          <div className="empty-state">
            <p>생성된 API 키가 없습니다.</p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              첫 API 키 생성하기
            </button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="api-key-card">
              <div className="key-header">
                <h3>{key.name}</h3>
                <span className={`status-badge ${key.status}`}>
                  {key.status === 'active' ? '활성' : '비활성'}
                </span>
              </div>
              <div className="key-info">
                <div className="info-item">
                  <label>권한 (Scopes):</label>
                  <span>{key.scopes.length > 0 ? key.scopes.join(', ') : '전체 권한'}</span>
                </div>
                <div className="info-item">
                  <label>사용량:</label>
                  <span>
                    {key.quota_used} / {key.quota_daily} (일일)
                  </span>
                </div>
                <div className="info-item">
                  <label>생성일:</label>
                  <span>{new Date(key.created_at).toLocaleString('ko-KR')}</span>
                </div>
                {key.last_used_at && (
                  <div className="info-item">
                    <label>마지막 사용:</label>
                    <span>{new Date(key.last_used_at).toLocaleString('ko-KR')}</span>
                  </div>
                )}
              </div>
              <div className="key-actions">
                {key.status === 'active' && (
                  <button
                    className="btn-secondary"
                    onClick={() => handleDeactivate(key.id)}
                  >
                    비활성화
                  </button>
                )}
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(key.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewKeyName('');
          setNewKeyScopes([]);
          setError('');
        }}
        title="새 API 키 생성"
      >
        <form onSubmit={handleCreateKey} className="api-key-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>키 이름</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="예: 프로덕션 키, 개발 키"
              required
            />
          </div>
          <div className="form-group">
            <label>권한 (Scopes)</label>
            <div className="scopes-list">
              {['read:sensors', 'read:actuators', 'write:control', 'read:datasets', 'write:datasets'].map((scope) => (
                <label key={scope} className="scope-checkbox">
                  <input
                    type="checkbox"
                    checked={newKeyScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span>{scope}</span>
                </label>
              ))}
            </div>
            <p className="form-hint">선택하지 않으면 전체 권한이 부여됩니다.</p>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setNewKeyName('');
                setNewKeyScopes([]);
                setError('');
              }}
            >
              취소
            </button>
            <button type="submit" className="btn-primary">
              생성
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

