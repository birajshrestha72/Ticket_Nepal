import PropTypes from 'prop-types'

export const LineTrendChart = ({ title, points }) => {
  const safePoints = Array.isArray(points) ? points : []
  const max = Math.max(1, ...safePoints.map((item) => Number(item.value || 0)))
  const width = 560
  const height = 220
  const padX = 28
  const padY = 18
  const plotHeight = 150
  const plotWidth = width - padX * 2

  const polyline = safePoints
    .map((item, index) => {
      const x = padX + (index * plotWidth) / Math.max(1, safePoints.length - 1)
      const y = padY + plotHeight - (Number(item.value || 0) / max) * plotHeight
      return `${x},${y}`
    })
    .join(' ')

  return (
    <article className="analytics-chart-card">
      <h3>{title}</h3>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke="#0ea5e9" strokeWidth="3" points={polyline} />
        {safePoints.map((item, index) => {
          const x = padX + (index * plotWidth) / Math.max(1, safePoints.length - 1)
          const y = padY + plotHeight - (Number(item.value || 0) / max) * plotHeight
          return (
            <g key={`${item.label}-${index}`}>
              <circle cx={x} cy={y} r="4" fill="#0369a1" />
              <text x={x} y={y - 8} textAnchor="middle" className="analytics-value-label">{item.value}</text>
              <text x={x} y={height - 12} textAnchor="middle" className="analytics-axis-label">{item.label}</text>
            </g>
          )
        })}
      </svg>
    </article>
  )
}

LineTrendChart.propTypes = {
  title: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    }),
  ).isRequired,
}

export const BarCompareChart = ({ title, bars }) => {
  const safeBars = Array.isArray(bars) ? bars : []
  const max = Math.max(1, ...safeBars.map((item) => Number(item.value || 0)))

  return (
    <article className="analytics-chart-card">
      <h3>{title}</h3>
      <div className="analytics-bar-list">
        {safeBars.map((item, index) => {
          const widthPct = (Number(item.value || 0) / max) * 100
          return (
            <div key={`${item.label}-${index}`} className="analytics-bar-row">
              <span className="analytics-bar-label">{item.label}</span>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: `${widthPct}%` }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          )
        })}
      </div>
    </article>
  )
}

BarCompareChart.propTypes = {
  title: PropTypes.string.isRequired,
  bars: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    }),
  ).isRequired,
}

export const DonutBreakdownChart = ({ title, percent, centerLabel }) => {
  const size = 190
  const stroke = 24
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))
  const offset = circumference * (1 - safePercent / 100)

  return (
    <article className="analytics-chart-card analytics-donut-card">
      <h3>{title}</h3>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0ea5e9"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <p className="analytics-donut-value">{safePercent.toFixed(1)}%</p>
      <p className="analytics-donut-caption">{centerLabel}</p>
    </article>
  )
}

DonutBreakdownChart.propTypes = {
  title: PropTypes.string.isRequired,
  percent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  centerLabel: PropTypes.string,
}

DonutBreakdownChart.defaultProps = {
  centerLabel: '',
}
