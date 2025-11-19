import { useEffect, useState } from 'react';
import { robotsApi } from '../api/client';
import Modal from '../components/Modal';
import './Robots.css';

export default function Robots() {
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: { x: 0, y: 0, z: 0 },
    description: '',
  });

  useEffect(() => {
    loadRobots();
  }, []);

  const loadRobots = async () => {
    try {
      const response = await robotsApi.getAll();
      setRobots(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load robots:', error);
      setLoading(false);
    }
  };

  const handleCommand = async (id: number, command: string) => {
    try {
      await robotsApi.sendCommand(id, command);
      loadRobots();
    } catch (error) {
      console.error('Failed to send command:', error);
      alert('명령 전송에 실패했습니다');
    }
  };

  const handleOpenModal = (robot?: any) => {
    if (robot) {
      setEditingRobot(robot);
      const location = typeof robot.location === 'string' 
        ? JSON.parse(robot.location) 
        : robot.location || { x: 0, y: 0, z: 0 };
      setFormData({
        name: robot.name || '',
        type: robot.type || '',
        location,
        description: robot.description || '',
      });
    } else {
      setEditingRobot(null);
      setFormData({
        name: '',
        type: '',
        location: { x: 0, y: 0, z: 0 },
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRobot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRobot) {
        await robotsApi.update(editingRobot.id, formData);
      } else {
        await robotsApi.create(formData);
      }
      handleCloseModal();
      loadRobots();
    } catch (error) {
      console.error('Failed to save robot:', error);
      alert('로봇 저장에 실패했습니다');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 로봇을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await robotsApi.delete(id);
      loadRobots();
    } catch (error) {
      console.error('Failed to delete robot:', error);
      alert('로봇 삭제에 실패했습니다');
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="robots-page">
      <div className="page-header">
        <h1>로봇</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + 로봇 추가
        </button>
      </div>
      <div className="robots-grid">
        {robots.map((robot) => (
          <div key={robot.id} className="robot-card">
            <h3>{robot.name}</h3>
            <p className="robot-type">유형: {robot.type}</p>
            <p className="robot-status">상태: {robot.status === 'working' ? '작동 중' : robot.status === 'idle' ? '대기 중' : robot.status}</p>
            <p className="robot-battery">배터리: {robot.battery_level || 100}%</p>
            {robot.description && (
              <p className="robot-description">{robot.description}</p>
            )}
            <div className="robot-controls">
              <button
                className="btn btn-primary"
                onClick={() => handleCommand(robot.id, 'start')}
                disabled={robot.status === 'working'}
              >
                시작
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleCommand(robot.id, 'stop')}
                disabled={robot.status === 'idle'}
              >
                중지
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleOpenModal(robot)}
              >
                수정
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(robot.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRobot ? '로봇 수정' : '로봇 추가'}
      >
        <form onSubmit={handleSubmit} className="robot-form">
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
              <option value="">선택</option>
              <option value="harvesting">수확 로봇</option>
              <option value="spraying">살포 로봇</option>
              <option value="logistics">물류 로봇</option>
              <option value="monitoring">모니터링 로봇</option>
            </select>
          </div>
          <div className="form-group">
            <label>위치 X</label>
            <input
              type="number"
              value={formData.location.x}
              onChange={(e) => setFormData({
                ...formData,
                location: { ...formData.location, x: Number(e.target.value) }
              })}
            />
          </div>
          <div className="form-group">
            <label>위치 Y</label>
            <input
              type="number"
              value={formData.location.y}
              onChange={(e) => setFormData({
                ...formData,
                location: { ...formData.location, y: Number(e.target.value) }
              })}
            />
          </div>
          <div className="form-group">
            <label>위치 Z</label>
            <input
              type="number"
              value={formData.location.z}
              onChange={(e) => setFormData({
                ...formData,
                location: { ...formData.location, z: Number(e.target.value) }
              })}
            />
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              {editingRobot ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

