import React, { useState } from 'react';
import '../../css/ratingsReviews.css';

const sampleReviews = [
  { id: 1, rating: 5, review: 'Great service and comfortable seats.' },
  { id: 2, rating: 4, review: 'On time, but AC was weak.' },
  { id: 3, rating: 3, review: 'Average experience, driver was polite.' },
];

const RatingsReviews = () => {
  const [reviews] = useState(sampleReviews);

  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="ratings-reviews">
      <h2>Ratings & Reviews</h2>
      <div><strong>Average Rating:</strong> {avg} / 5</div>
      <ul>
        {reviews.map(r => (
          <li key={r.id}>
            <div><strong>Rating:</strong> {r.rating} / 5</div>
            <div><strong>Review:</strong> {r.review}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RatingsReviews;
