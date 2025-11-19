import { useState } from 'react';
import { apiClient } from '../api/client';
import './Reports.css';

export default function Reports() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (reportType === 'daily') {
        params.date = date;
      } else if (reportType === 'weekly') {
        params.week = date;
      } else {
        params.month = date.substring(0, 7); // YYYY-MM
      }

      const response = await apiClient.get(`/reports/${reportType}`, { params });
      setReport(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('리포트 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${reportType}-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <h1>리포트</h1>

      <div className="report-controls">
        <div className="form-group">
          <label>리포트 유형</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
            <option value="daily">일간</option>
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
          </select>
        </div>
        <div className="form-group">
          <label>날짜</label>
          <input
            type={reportType === 'monthly' ? 'month' : 'date'}
            value={reportType === 'monthly' ? date.substring(0, 7) : date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={generateReport} disabled={loading}>
          {loading ? '생성 중...' : '리포트 생성'}
        </button>
      </div>

      {report && (
        <div className="report-content">
          <div className="report-header">
            <h2>
              {reportType === 'daily' ? '일간' : reportType === 'weekly' ? '주간' : '월간'} 리포트
              {report.date && ` - ${report.date}`}
              {report.period && ` - ${report.period.start} ~ ${report.period.end}`}
              {report.month && ` - ${report.month}`}
            </h2>
            <button className="btn-secondary" onClick={downloadReport}>
              JSON 다운로드
            </button>
          </div>

          <div className="report-summary">
            <h3>요약</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">전체 센서</span>
                <span className="summary-value">{report.summary.totalSensors}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">전체 알람</span>
                <span className="summary-value">{report.summary.totalAlarms}</span>
              </div>
              {report.summary.criticalAlarms !== undefined && (
                <div className="summary-item">
                  <span className="summary-label">심각 알람</span>
                  <span className="summary-value critical">{report.summary.criticalAlarms}</span>
                </div>
              )}
              {report.summary.warningAlarms !== undefined && (
                <div className="summary-item">
                  <span className="summary-label">경고 알람</span>
                  <span className="summary-value warning">{report.summary.warningAlarms}</span>
                </div>
              )}
            </div>
          </div>

          <div className="report-sensors">
            <h3>센서</h3>
            {report.sensors.map((sensor: any) => (
              <div key={sensor.id} className="sensor-report">
                <h4>{sensor.name}</h4>
                {sensor.stats && (
                  <div className="sensor-stats">
                    <span>최소: {sensor.stats.min.toFixed(2)}</span>
                    <span>최대: {sensor.stats.max.toFixed(2)}</span>
                    <span>평균: {sensor.stats.avg.toFixed(2)}</span>
                    <span>데이터 포인트: {sensor.stats.count}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="report-alarms">
            <h3>알람</h3>
            {report.alarms.length > 0 ? (
              <div className="alarms-list">
                {report.alarms.map((alarm: any) => (
                  <div key={alarm.id} className={`alarm-item alarm-${alarm.severity}`}>
                    <div className="alarm-header">
                      <span className="alarm-severity">{alarm.severity === 'critical' ? '심각' : alarm.severity === 'warning' ? '경고' : alarm.severity.toUpperCase()}</span>
                      <span className="alarm-time">
                        {new Date(alarm.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="alarm-message">{alarm.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>이 기간 동안 알람이 없습니다</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

