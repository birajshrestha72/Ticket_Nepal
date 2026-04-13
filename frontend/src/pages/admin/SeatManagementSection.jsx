import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { fetchBusSeatLayout, saveBusSeatLayout } from '../../api/adminApi'

const seatLabel = (rowIndex, colIndex) => {
  if (rowIndex <= 26) {
    return `${String.fromCodePoint(64 + rowIndex)}${colIndex}`
  }
  return `R${rowIndex}C${colIndex}`
}

const generateSeatGrid = (rows, cols, existing = []) => {
  const map = new Map(existing.map((item) => [`${item.row_index}-${item.col_index}`, item]))
  const seats = []
  for (let rowIndex = 1; rowIndex <= rows; rowIndex += 1) {
    for (let colIndex = 1; colIndex <= cols; colIndex += 1) {
      const key = `${rowIndex}-${colIndex}`
      const current = map.get(key)
      seats.push({
        row_index: rowIndex,
        col_index: colIndex,
        seat_label: current?.seat_label || seatLabel(rowIndex, colIndex),
        is_active: current ? Boolean(current.is_active) : true,
        is_blocked: current ? Boolean(current.is_blocked) : false,
        block_reason: current?.block_reason || null,
      })
    }
  }
  return seats
}

const SeatManagementSection = ({ buses, showError, showSuccess, onDataChanged }) => {
  const [selectedBusId, setSelectedBusId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [layoutRows, setLayoutRows] = useState(10)
  const [layoutCols, setLayoutCols] = useState(4)
  const [layoutData, setLayoutData] = useState(null)

  const selectedBus = useMemo(
    () => buses.find((item) => String(item.bus_id) === selectedBusId) || null,
    [buses, selectedBusId],
  )

  const activeSeats = useMemo(() => {
    if (!layoutData?.seats) {
      return 0
    }
    return layoutData.seats.filter((item) => item.is_active).length
  }, [layoutData])

  const blockedSeats = useMemo(() => {
    if (!layoutData?.seats) {
      return 0
    }
    return layoutData.seats.filter((item) => item.is_active && item.is_blocked).length
  }, [layoutData])

  const seatGridCells = useMemo(() => {
    if (!layoutData?.seats) {
      return []
    }

    const rows = Number(layoutRows || 0)
    const cols = Number(layoutCols || 0)
    const hasMiddleAisle = cols >= 3
    const leftBlockCount = Math.ceil(cols / 2)
    const map = new Map(layoutData.seats.map((item) => [`${item.row_index}-${item.col_index}`, item]))
    const cells = []

    for (let rowIndex = 1; rowIndex <= rows; rowIndex += 1) {
      let renderedInRow = 0
      for (let colIndex = cols; colIndex >= 1; colIndex -= 1) {
        const key = `${rowIndex}-${colIndex}`
        cells.push({ key, seat: map.get(key) || null })
        renderedInRow += 1

        if (hasMiddleAisle && renderedInRow === leftBlockCount) {
          cells.push({ key: `aisle-${rowIndex}`, seat: null, isAisle: true })
        }
      }
    }

    return cells
  }, [layoutData, layoutRows, layoutCols])

  const loadLayout = useCallback(async (busId) => {
    if (!busId) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetchBusSeatLayout(busId)
      const seatLayout = response.seat_layout
      setLayoutRows(seatLayout.seat_layout_rows)
      setLayoutCols(seatLayout.seat_layout_cols)
      setLayoutData(seatLayout)
    } catch (err) {
      showError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (selectedBusId) {
      loadLayout(selectedBusId)
    } else {
      setLayoutData(null)
    }
  }, [selectedBusId, loadLayout])

  const handleGenerate = () => {
    const rows = Number(layoutRows)
    const cols = Number(layoutCols)
    if (rows < 1 || cols < 1) {
      showError('Rows and columns must be at least 1')
      return
    }

    const existingSeats = layoutData?.seats || []
    const seats = generateSeatGrid(rows, cols, existingSeats)
    setLayoutData((prev) => {
      const nextLayout = {
        bus_id: Number(selectedBusId),
        bus_name: selectedBus?.bus_name || '',
        bus_type: selectedBus?.bus_type || 'Standard',
        seat_layout_rows: rows,
        seat_layout_cols: cols,
        total_seats: seats.length,
        active_seats: seats.filter((item) => item.is_active).length,
        seats,
      }

      return prev
        ? { ...prev, ...nextLayout }
        : nextLayout
    })
  }

  const handleToggleSeat = (rowIndex, colIndex) => {
    setLayoutData((prev) => {
      if (!prev?.seats) {
        return prev
      }
      const nextSeats = prev.seats.map((item) => {
        if (item.row_index !== rowIndex || item.col_index !== colIndex) {
          return item
        }

        const nextActive = !item.is_active
        return {
          ...item,
          is_active: nextActive,
          is_blocked: nextActive ? item.is_blocked : false,
          block_reason: nextActive ? item.block_reason : null,
        }
      })
      return {
        ...prev,
        active_seats: nextSeats.filter((item) => item.is_active).length,
        blocked_seats: nextSeats.filter((item) => item.is_active && item.is_blocked).length,
        seats: nextSeats,
      }
    })
  }

  const handleSave = async () => {
    if (!selectedBusId || !layoutData?.seats) {
      showError('Please select a bus and generate layout first')
      return
    }

    const payload = {
      seat_layout_rows: Number(layoutRows),
      seat_layout_cols: Number(layoutCols),
      seats: layoutData.seats,
    }

    try {
      const response = await saveBusSeatLayout(selectedBusId, payload)
      setLayoutData(response.seat_layout)
      showSuccess('Seat layout saved successfully')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <div className="admin-section seat-management-section">
      <div className="section-header-bar">
        <h2>Seat Management</h2>
        <p className="section-subtitle">Configure seat layouts for your buses</p>
      </div>

      <div className="seat-management-layout">
        {/* Configuration Panel */}
        <div className="config-panel">
          <div className="config-card">
            <h3>Bus Selection</h3>
            <select 
              value={selectedBusId} 
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="config-select"
            >
              <option value="">Select a Bus</option>
              {buses.map((bus) => (
                <option key={bus.bus_id} value={bus.bus_id}>
                  {bus.bus_name} ({bus.bus_type || 'Standard'})
                </option>
              ))}
            </select>
          </div>

          {selectedBus && (
            <div className="bus-info-card">
              <h3>Bus Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{selectedBus.bus_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{selectedBus.bus_type || 'Standard'}</span>
                </div>
                <div className="info-item highlight">
                  <span className="info-label">Active Seats:</span>
                  <span className="info-value">{activeSeats}</span>
                </div>
                <div className="info-item highlight">
                  <span className="info-label">Blocked Seats:</span>
                  <span className="info-value">{blockedSeats}</span>
                </div>
              </div>
            </div>
          )}

          <div className="config-card">
            <h3>Layout Dimensions</h3>
            <div className="dimension-inputs">
              <div className="input-group">
                <label htmlFor="layout-rows">Rows</label>
                <input
                  id="layout-rows"
                  type="number"
                  min="1"
                  max="20"
                  value={layoutRows}
                  onChange={(e) => setLayoutRows(e.target.value)}
                  placeholder="Rows"
                  className="dimension-input"
                />
              </div>
              <div className="input-group">
                <label htmlFor="layout-cols">Columns</label>
                <input
                  id="layout-cols"
                  type="number"
                  min="1"
                  max="8"
                  value={layoutCols}
                  onChange={(e) => setLayoutCols(e.target.value)}
                  placeholder="Columns"
                  className="dimension-input"
                />
              </div>
            </div>
          </div>

          <div className="config-card">
            <h3>Seat Editing</h3>
            <p className="preset-hint">Click any seat in the layout preview to toggle seat/aisle.</p>
            <p className="preset-hint">Aisle marker is always shown in the middle for customer view.</p>
          </div>

          <div className="action-buttons">
            <button 
              type="button" 
              onClick={handleGenerate} 
              disabled={!selectedBusId}
              className="btn btn-primary"
            >
              Generate Layout
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={!selectedBusId}
              className="btn btn-success"
            >
              Save Layout
            </button>
          </div>
        </div>

        {/* Seat Layout Visualization */}
        <div className="layout-preview">
          {isLoading && <p className="admin-info">Loading seat layout...</p>}

          {layoutData?.seats && (
            <>
              <div className="legend-card">
                <h3>Legend</h3>
                <div className="seat-legend">
                  <div className="legend-item">
                    <div className="dot active"></div>
                    <span>Active Seat</span>
                  </div>
                  <div className="legend-item">
                    <div className="dot blocked"></div>
                    <span>Blocked Seat</span>
                  </div>
                  <div className="legend-item">
                    <div className="dot inactive"></div>
                    <span>Aisle/Unavailable</span>
                  </div>
                </div>
              </div>

              <div className="bus-layout-preview">
                <div className="bus-layout-front">
                  <span className="front-label">Front</span>
                  <span className="driver-mark">Driver</span>
                </div>
                <div
                  className="seat-grid"
                  style={{
                    gridTemplateColumns: `repeat(${Number(layoutCols) >= 3 ? Number(layoutCols) + 1 : Number(layoutCols)}, minmax(52px, 1fr))`,
                  }}
                >
                  {seatGridCells.map((cell) => {
                    if (cell.isAisle) {
                      return (
                        <div 
                          key={cell.key} 
                          className="seat-cell seat-cell-aisle" 
                          aria-label="Aisle" 
                          title="Aisle" 
                        />
                      )
                    }

                    if (!cell.seat) {
                      return (
                        <div 
                          key={cell.key} 
                          className="seat-cell seat-cell-empty" 
                          aria-hidden="true" 
                        />
                      )
                    }

                    let seatStateClass = 'inactive'
                    if (cell.seat.is_active) {
                      seatStateClass = cell.seat.is_blocked ? 'blocked' : 'active'
                    }
                    const seatTitle = cell.seat.is_blocked && cell.seat.block_reason
                      ? `${cell.seat.seat_label} (${cell.seat.block_reason})`
                      : cell.seat.seat_label

                    let seatText = '—'
                    if (cell.seat.is_active) {
                      seatText = cell.seat.is_blocked ? 'BLK' : cell.seat.seat_label
                    }

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        className={`seat-cell ${seatStateClass}`}
                        onClick={() => handleToggleSeat(cell.seat.row_index, cell.seat.col_index)}
                        title={seatTitle}
                      >
                        {seatText}
                      </button>
                    )
                  })}
                </div>
                <div className="bus-layout-rear">Entry</div>
              </div>
            </>
          )}

          {!layoutData?.seats && selectedBusId && (
            <div className="empty-state">
              <p>No layout generated yet.</p>
              <p>Use the configuration on the left to generate a seat layout.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SeatManagementSection

const busShape = PropTypes.shape({
  bus_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bus_name: PropTypes.string,
  bus_type: PropTypes.string,
})

SeatManagementSection.propTypes = {
  buses: PropTypes.arrayOf(busShape).isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
  onDataChanged: PropTypes.func.isRequired,
}
