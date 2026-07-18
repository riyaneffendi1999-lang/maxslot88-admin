import { useRef, useEffect, useState } from 'react'
import './SpinWheel.css'

function SpinWheel({ prizes, onSpinEnd, isSpinning, onSpin, disabled }) {
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef(null)
  const segmentAngle = 360 / prizes.length

  useEffect(() => {
    if (isSpinning) {
      const randomIndex = Math.floor(Math.random() * prizes.length)
      const targetAngle = 360 - (randomIndex * segmentAngle + segmentAngle / 2)
      const fullSpins = 5 + Math.floor(Math.random() * 3)
      const totalRotation = rotation + fullSpins * 360 + targetAngle - (rotation % 360)

      setRotation(totalRotation)

      const timer = setTimeout(() => {
        onSpinEnd(prizes[randomIndex])
      }, 4500)

      return () => clearTimeout(timer)
    }
  }, [isSpinning])

  return (
    <div className="wheel-container">
      <div className="wheel-pointer"></div>
      <div className="wheel-outer-ring">
        <div
          ref={wheelRef}
          className="wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
          }}
        >
          <svg viewBox="0 0 400 400" className="wheel-svg">
            {prizes.map((prize, index) => {
              const startAngle = index * segmentAngle
              const endAngle = startAngle + segmentAngle
              const startRad = (startAngle - 90) * (Math.PI / 180)
              const endRad = (endAngle - 90) * (Math.PI / 180)

              const x1 = 200 + 195 * Math.cos(startRad)
              const y1 = 200 + 195 * Math.sin(startRad)
              const x2 = 200 + 195 * Math.cos(endRad)
              const y2 = 200 + 195 * Math.sin(endRad)

              const largeArc = segmentAngle > 180 ? 1 : 0
              const path = `M200,200 L${x1},${y1} A195,195 0 ${largeArc},1 ${x2},${y2} Z`

              const midAngle = (startAngle + endAngle) / 2
              const midRad = (midAngle - 90) * (Math.PI / 180)
              const textX = 200 + 130 * Math.cos(midRad)
              const textY = 200 + 130 * Math.sin(midRad)
              const iconX = 200 + 155 * Math.cos(midRad)
              const iconY = 200 + 155 * Math.sin(midRad)

              return (
                <g key={prize.id}>
                  <path d={path} fill={prize.color} stroke="#fff" strokeWidth="2" />
                  <text
                    x={iconX}
                    y={iconY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="18"
                    transform={`rotate(${midAngle}, ${iconX}, ${iconY})`}
                  >
                    {prize.icon}
                  </text>
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="11"
                    fontWeight="600"
                    transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                  >
                    {prize.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <button
        className={`spin-button ${isSpinning ? 'spinning' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={onSpin}
        disabled={disabled || isSpinning}
      >
        {isSpinning ? 'Spinning...' : 'SPIN'}
      </button>
    </div>
  )
}

export default SpinWheel
