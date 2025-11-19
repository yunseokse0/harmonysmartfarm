import { useEffect, useState, useRef } from 'react';
import { imagesApi } from '../api/client';
import './ImageLabeler.css';

interface Image {
  id: number;
  filename: string;
  file_path: string;
  created_at: string;
}

interface Label {
  id: number;
  label: string;
  bbox: { x: number; y: number; width: number; height: number };
  confidence?: number;
}

export default function ImageLabeler() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBbox, setCurrentBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (selectedImage) {
      loadLabels(selectedImage.id);
      drawImage();
    }
  }, [selectedImage, labels]);

  const loadImages = async () => {
    try {
      const response = await imagesApi.getAll({ limit: 50 });
      setImages(response.data);
      if (response.data.length > 0) {
        setSelectedImage(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const loadLabels = async (imageId: number) => {
    try {
      const response = await imagesApi.getLabels(imageId);
      setLabels(response.data);
    } catch (error) {
      console.error('Failed to load labels:', error);
    }
  };

  const drawImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !selectedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to image size
    canvas.width = image.width;
    canvas.height = image.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0);

    // Draw labels
    labels.forEach((label) => {
      const bbox = label.bbox;
      ctx.strokeStyle = selectedLabel?.id === label.id ? '#ff0000' : '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Draw label text
      ctx.fillStyle = selectedLabel?.id === label.id ? '#ff0000' : '#00ff00';
      ctx.font = '14px Arial';
      ctx.fillText(label.label, bbox.x, bbox.y - 5);
    });

    // Draw current bbox being drawn
    if (currentBbox) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentBbox.x, currentBbox.y, currentBbox.width, currentBbox.height);
      ctx.setLineDash([]);
    }
  };

  const handleImageLoad = () => {
    drawImage();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentBbox({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const pos = getMousePos(e);
    setCurrentBbox({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBbox && currentBbox.width > 10 && currentBbox.height > 10) {
      // Show label input dialog
      const label = prompt('라벨을 입력하세요:');
      if (label && selectedImage) {
        handleCreateLabel(label, currentBbox);
      }
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBbox(null);
  };

  const handleCreateLabel = async (label: string, bbox: any) => {
    if (!selectedImage) return;
    try {
      await imagesApi.createLabel(selectedImage.id, label, bbox);
      loadLabels(selectedImage.id);
    } catch (error: any) {
      alert(error.response?.data?.error || '라벨 생성에 실패했습니다');
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!confirm('이 라벨을 삭제하시겠습니까?')) return;
    try {
      await imagesApi.deleteLabel(labelId);
      if (selectedImage) {
        loadLabels(selectedImage.id);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '라벨 삭제에 실패했습니다');
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const clickedLabel = labels.find((label) => {
      const bbox = label.bbox;
      return (
        pos.x >= bbox.x &&
        pos.x <= bbox.x + bbox.width &&
        pos.y >= bbox.y &&
        pos.y <= bbox.y + bbox.height
      );
    });
    setSelectedLabel(clickedLabel || null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await imagesApi.upload(file);
      loadImages();
    } catch (error: any) {
      alert(error.response?.data?.error || '이미지 업로드에 실패했습니다');
    }
  };

  return (
    <div className="image-labeler-page">
      <div className="page-header">
        <h1>이미지 라벨링</h1>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload" className="btn-primary">
            이미지 업로드
          </label>
        </div>
      </div>

      <div className="labeler-content">
        <div className="image-list-panel">
          <h3>이미지 목록</h3>
          <div className="image-list">
            {images.map((img) => (
              <div
                key={img.id}
                className={`image-item ${selectedImage?.id === img.id ? 'selected' : ''}`}
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={imagesApi.getFile(img.id)}
                  alt={img.filename}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%23ddd"/></svg>';
                  }}
                />
                <div className="image-item-info">
                  <span>{img.filename}</span>
                  <span className="image-date">
                    {new Date(img.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="canvas-panel">
          {selectedImage ? (
            <>
              <div className="canvas-container">
                <img
                  ref={imageRef}
                  src={imagesApi.getFile(selectedImage.id)}
                  alt={selectedImage.filename}
                  onLoad={handleImageLoad}
                  style={{ display: 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={handleImageClick}
                  className="labeling-canvas"
                />
              </div>
              <div className="canvas-info">
                <p>마우스로 드래그하여 바운딩 박스를 그리세요</p>
                <p>그린 박스를 클릭하여 선택하세요</p>
              </div>
            </>
          ) : (
            <div className="no-image">
              <p>이미지를 선택하세요</p>
            </div>
          )}
        </div>

        <div className="labels-panel">
          <h3>라벨 목록</h3>
          <div className="labels-list">
            {labels.length === 0 ? (
              <div className="empty-labels">
                <p>라벨이 없습니다</p>
                <p className="hint">이미지에 바운딩 박스를 그려 라벨을 추가하세요</p>
              </div>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className={`label-item ${selectedLabel?.id === label.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLabel(label)}
                >
                  <div className="label-header">
                    <span className="label-name">{label.label}</span>
                    {label.confidence && (
                      <span className="label-confidence">
                        {(label.confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="label-bbox">
                    x: {Math.round(label.bbox.x)}, y: {Math.round(label.bbox.y)}, w:{' '}
                    {Math.round(label.bbox.width)}, h: {Math.round(label.bbox.height)}
                  </div>
                  <button
                    className="btn-danger btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLabel(label.id);
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

