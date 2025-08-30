import React from "react";
import "../styles/Modal.css";

interface ModalProps {
  open: boolean;
  message: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-message">{message}</div>
        <button className="modal-btn" onClick={onClose}>확인</button>
      </div>
    </div>
  );
};

export default Modal;
