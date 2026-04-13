import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

const renderStars = (rating) => {
  const safe = Math.max(1, Math.min(5, Number(rating) || 0))
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`
}

const ReviewsSection = ({ reviews }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedReviews = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return reviews.slice(start, start + PAGE_SIZE)
  }, [reviews, safePage])

  return (
    <div className="admin-section">
      <h2>Ride Reviews</h2>
      <p className="seat-meta">Reviewer identity is hidden for admin view.</p>

      {reviews.length === 0 ? (
        <p className="admin-info">No reviews available yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ride</th>
                <th>Bus</th>
                <th>Booking Ref</th>
                <th>Journey Date</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReviews.map((review) => (
                <tr key={review.review_id}>
                  <td>{review.ride?.route || 'Unknown Ride'}</td>
                  <td>{review.ride?.bus_name || 'N/A'}</td>
                  <td>{review.ride?.booking_reference || 'N/A'}</td>
                  <td>{review.ride?.journey_date || 'N/A'}</td>
                  <td title={`${review.rating}/5`}>{renderStars(review.rating)}</td>
                  <td>{review.review_text || '-'}</td>
                  <td>
                    {review.is_verified_purchase ? 'Verified' : 'Unverified'}
                    {' / '}
                    {review.is_approved ? 'Approved' : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {reviews.length > 0 && (
        <TablePagination
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalItems={reviews.length}
          onPageChange={setCurrentPage}
          itemLabel="reviews"
        />
      )}
    </div>
  )
}

export default ReviewsSection

const reviewShape = PropTypes.shape({
  review_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  review_text: PropTypes.string,
  is_verified_purchase: PropTypes.bool,
  is_approved: PropTypes.bool,
  ride: PropTypes.shape({
    route: PropTypes.string,
    bus_name: PropTypes.string,
    booking_reference: PropTypes.string,
    journey_date: PropTypes.string,
  }),
})

ReviewsSection.propTypes = {
  reviews: PropTypes.arrayOf(reviewShape).isRequired,
}
