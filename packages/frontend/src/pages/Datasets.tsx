import { useEffect, useState } from 'react';
import { datasetsApi } from '../api/client';
import './Datasets.css';

interface Dataset {
  id: number;
  title: string;
  description: string;
  crop_type: string;
  data_type: string;
  fields: string[];
  license: string;
  file_size: number;
  record_count: number;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    crop_type: '',
    data_type: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    loadDatasets();
  }, [filters]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.crop_type) params.crop_type = filters.crop_type;
      if (filters.data_type) params.data_type = filters.data_type;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await datasetsApi.getAll(params);
      setDatasets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load datasets:', error);
      setLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await datasetsApi.download(id);
      const { downloadUrl } = response.data;
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      alert(error.response?.data?.error || '다운로드에 실패했습니다');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="datasets-page">
      <div className="page-header">
        <h1>데이터셋 카탈로그</h1>
      </div>

      <div className="filters-section">
        <h3>필터</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>작물 유형</label>
            <select
              value={filters.crop_type}
              onChange={(e) => setFilters({ ...filters, crop_type: e.target.value })}
            >
              <option value="">전체</option>
              <option value="tomato">토마토</option>
              <option value="strawberry">딸기</option>
              <option value="pepper">고추</option>
              <option value="general">일반</option>
            </select>
          </div>
          <div className="filter-group">
            <label>데이터 유형</label>
            <select
              value={filters.data_type}
              onChange={(e) => setFilters({ ...filters, data_type: e.target.value })}
            >
              <option value="">전체</option>
              <option value="sensor">센서 데이터</option>
              <option value="image">이미지</option>
              <option value="weather">기상 데이터</option>
            </select>
          </div>
          <div className="filter-group">
            <label>시작일</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>종료일</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="datasets-list">
        {datasets.length === 0 ? (
          <div className="empty-state">
            <p>데이터셋이 없습니다.</p>
          </div>
        ) : (
          datasets.map((dataset) => (
            <div key={dataset.id} className="dataset-card">
              <div className="dataset-header">
                <h3>{dataset.title}</h3>
                <span className="license-badge">{dataset.license}</span>
              </div>
              <p className="dataset-description">{dataset.description}</p>
              <div className="dataset-info">
                <div className="info-item">
                  <label>작물 유형:</label>
                  <span>{dataset.crop_type || '일반'}</span>
                </div>
                <div className="info-item">
                  <label>데이터 유형:</label>
                  <span>{dataset.data_type}</span>
                </div>
                <div className="info-item">
                  <label>파일 크기:</label>
                  <span>{formatFileSize(dataset.file_size)}</span>
                </div>
                <div className="info-item">
                  <label>레코드 수:</label>
                  <span>{dataset.record_count?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>기간:</label>
                  <span>
                    {dataset.date_range_start} ~ {dataset.date_range_end}
                  </span>
                </div>
                <div className="info-item">
                  <label>필드:</label>
                  <span>{Array.isArray(dataset.fields) ? dataset.fields.join(', ') : 'N/A'}</span>
                </div>
              </div>
              <div className="dataset-actions">
                <button className="btn-primary" onClick={() => handleDownload(dataset.id)}>
                  다운로드
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

