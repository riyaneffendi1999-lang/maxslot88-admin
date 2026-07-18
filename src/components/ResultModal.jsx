import { useEffect } from 'react'
import './ResultModal.css'

function ResultModal({ prize, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const isWin = prize.name !== 'Coba Lagi'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon-wrapper ${isWin ? 'win' : 'retry'}`}>
          <span className="modal-icon">{prize.icon}</span>
        </div>

        <h2 className="modal-title">
          {isWin ? 'Selamat!' : 'Yah, Belum Beruntung'}
        </h2>

        <p className="modal-message">
          {isWin
            ? `Anda mendapatkan`
            : 'Jangan menyerah, coba lagi!'
          }
        </p>

        {isWin && (
          <div className="modal-prize" style={{ borderColor: prize.color }}>
            <span className="modal-prize-icon">{prize.icon}</span>
            <span className="modal-prize-name">{prize.name}</span>
          </div>
        )}

        <button className="modal-button" onClick={onClose}>
          {isWin ? 'Klaim Hadiah' : 'Tutup'}
        </button>
      </div>
    </div>
  )
}

export default ResultModal
