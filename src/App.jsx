import { useState } from 'react'
import SpinWheel from './components/SpinWheel'
import PrizeTable from './components/PrizeTable'
import ResultModal from './components/ResultModal'
import './App.css'

const prizes = [
  { id: 1, name: 'iPhone 15 Pro', color: '#E63946', icon: '📱', chance: '0.1%' },
  { id: 2, name: 'Voucher 500K', color: '#1D3557', icon: '🎫', chance: '2%' },
  { id: 3, name: 'Voucher 100K', color: '#457B9D', icon: '🎟️', chance: '5%' },
  { id: 4, name: 'Voucher 50K', color: '#2A9D8F', icon: '💳', chance: '10%' },
  { id: 5, name: 'Merchandise', color: '#E9C46A', icon: '👕', chance: '15%' },
  { id: 6, name: 'Bonus 500 Poin', color: '#F4A261', icon: '⭐', chance: '20%' },
  { id: 7, name: 'Bonus 100 Poin', color: '#264653', icon: '✨', chance: '25%' },
  { id: 8, name: 'Coba Lagi', color: '#6C757D', icon: '🔄', chance: '22.9%' },
]

function App() {
  const [result, setResult] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinsLeft, setSpinsLeft] = useState(3)
  const [showModal, setShowModal] = useState(false)

  const handleSpinEnd = (prize) => {
    setResult(prize)
    setIsSpinning(false)
    setShowModal(true)
  }

  const handleSpin = () => {
    if (spinsLeft <= 0 || isSpinning) return
    setResult(null)
    setShowModal(false)
    setIsSpinning(true)
    setSpinsLeft(prev => prev - 1)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-icon">🎰</div>
            <h1>Lucky Spin</h1>
          </div>
          <div className="header-right">
            <div className="spins-badge">
              <span className="spins-count">{spinsLeft}</span>
              <span className="spins-text">Spin Tersisa</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <h2 className="hero-title">Putar & Menangkan!</h2>
          <p className="hero-subtitle">Dapatkan kesempatan memenangkan hadiah menarik setiap harinya</p>
        </section>

        <section className="spin-section">
          <SpinWheel
            prizes={prizes}
            onSpinEnd={handleSpinEnd}
            isSpinning={isSpinning}
            onSpin={handleSpin}
            disabled={spinsLeft <= 0}
          />

          {spinsLeft <= 0 && !isSpinning && (
            <div className="no-spins">
              Kesempatan spin hari ini sudah habis. Kembali lagi besok!
            </div>
          )}
        </section>

        <section className="table-section">
          <PrizeTable prizes={prizes} />
        </section>
      </main>

      {showModal && result && (
        <ResultModal prize={result} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

export default App
