import './PrizeTable.css'

function PrizeTable({ prizes }) {
  return (
    <div className="prize-table-wrapper">
      <div className="prize-table-header">
        <h3>Daftar Hadiah</h3>
        <span className="prize-table-badge">{prizes.length} Hadiah</span>
      </div>
      <div className="prize-table-container">
        <table className="prize-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Hadiah</th>
              <th>Probabilitas</th>
            </tr>
          </thead>
          <tbody>
            {prizes.map((prize, index) => (
              <tr key={prize.id}>
                <td className="td-no">{index + 1}</td>
                <td className="td-prize">
                  <span className="prize-color" style={{ background: prize.color }}></span>
                  <span className="prize-icon">{prize.icon}</span>
                  <span className="prize-name">{prize.name}</span>
                </td>
                <td className="td-chance">
                  <span className="chance-badge">{prize.chance}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PrizeTable
