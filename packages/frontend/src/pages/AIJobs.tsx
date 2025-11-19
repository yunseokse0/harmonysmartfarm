import { useEffect, useState } from 'react';
import { aiJobsApi, datasetsApi, aiModelsApi } from '../api/client';
import Modal from '../components/Modal';
import './AIJobs.css';

interface AIJob {
  id: number;
  type: 'train' | 'inference';
  status: 'pending' | 'running' | 'completed' | 'failed';
  dataset_id: number;
  parameters: any;
  result: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface Dataset {
  id: number;
  title: string;
}

export default function AIJobs() {
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AIJob | null>(null);
  const [formData, setFormData] = useState({
    type: 'train' as 'train' | 'inference',
    dataset_id: 0,
    parameters: {},
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [jobsRes, datasetsRes] = await Promise.all([
        aiJobsApi.getAll(),
        datasetsApi.getAll(),
      ]);
      setJobs(jobsRes.data);
      setDatasets(datasetsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await aiJobsApi.getAll();
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ type: 'train', dataset_id: 0, parameters: {} });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await aiJobsApi.create(formData.type, formData.dataset_id, formData.parameters);
      handleCloseModal();
      loadJobs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Job 생성에 실패했습니다');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#27ae60';
      case 'running':
        return '#3498db';
      case 'failed':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return '진행 중...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="ai-jobs-page">
      <div className="page-header">
        <h1>AI Job Manager</h1>
        <button className="btn-primary" onClick={handleOpenModal}>
          + Job 생성
        </button>
      </div>

      <div className="jobs-list">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <p>생성된 Job이 없습니다.</p>
            <button className="btn-primary" onClick={handleOpenModal}>
              첫 Job 생성하기
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div>
                  <h3>Job #{job.id}</h3>
                  <span className="job-type">{job.type === 'train' ? '학습' : '추론'}</span>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(job.status) }}
                >
                  {job.status === 'pending' && '대기 중'}
                  {job.status === 'running' && '실행 중'}
                  {job.status === 'completed' && '완료'}
                  {job.status === 'failed' && '실패'}
                </span>
              </div>
              <div className="job-info">
                <div className="info-item">
                  <label>데이터셋 ID:</label>
                  <span>{job.dataset_id}</span>
                </div>
                <div className="info-item">
                  <label>생성일:</label>
                  <span>{new Date(job.created_at).toLocaleString('ko-KR')}</span>
                </div>
                {job.completed_at && (
                  <div className="info-item">
                    <label>소요 시간:</label>
                    <span>{formatDuration(job.created_at, job.completed_at)}</span>
                  </div>
                )}
                {job.result && (
                  <div className="job-result">
                    <label>결과:</label>
                    <pre>{JSON.stringify(job.result, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div className="job-actions">
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      const status = await aiJobsApi.getStatus(job.id);
                      alert(`상태: ${status.data.status}\n결과: ${JSON.stringify(status.data.result || {}, null, 2)}`);
                    } catch (error) {
                      console.error('Failed to get job status:', error);
                    }
                  }}
                >
                  상태 확인
                </button>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      const logs = await aiJobsApi.getLogs(job.id);
                      setSelectedJob(job);
                      alert(`로그:\n${logs.data.logs || '로그 없음'}`);
                    } catch (error) {
                      console.error('Failed to get logs:', error);
                    }
                  }}
                >
                  로그 보기
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="새 AI Job 생성">
        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-group">
            <label>Job 유형</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'train' | 'inference' })
              }
              required
            >
              <option value="train">학습 (Train)</option>
              <option value="inference">추론 (Inference)</option>
            </select>
          </div>
          <div className="form-group">
            <label>데이터셋</label>
            <select
              value={formData.dataset_id}
              onChange={(e) =>
                setFormData({ ...formData, dataset_id: parseInt(e.target.value) })
              }
              required
            >
              <option value="0">데이터셋 선택</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>파라미터 (JSON)</label>
            <textarea
              value={JSON.stringify(formData.parameters, null, 2)}
              onChange={(e) => {
                try {
                  setFormData({ ...formData, parameters: JSON.parse(e.target.value) });
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              rows={6}
              placeholder='{"epochs": 10, "batch_size": 32}'
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
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

