import React from 'react';
import { useParams } from 'react-router-dom';

const BusDetails = () => {
  const { id } = useParams();
  return (
    <div className="page bus-details">
      <h2>Bus Details — {id}</h2>
      <p>Route details, schedule, amenities, reviews and seat map entry.</p>
    </div>
  );
};

export default BusDetails;
