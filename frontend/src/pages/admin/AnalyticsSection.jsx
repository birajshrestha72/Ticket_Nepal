import PropTypes from 'prop-types'

import VendorAnalyticsView from './VendorAnalyticsView'

const AnalyticsSection = ({ bookings, buses, routes, schedules, reviews }) => {
  return (
    <VendorAnalyticsView
      embedded
      bookingsData={bookings}
      busesData={buses}
      routesData={routes}
      schedulesData={schedules}
      reviewsData={reviews}
    />
  )
}

export default AnalyticsSection

AnalyticsSection.propTypes = {
  bookings: PropTypes.arrayOf(PropTypes.object),
  buses: PropTypes.arrayOf(PropTypes.object),
  routes: PropTypes.arrayOf(PropTypes.object),
  schedules: PropTypes.arrayOf(PropTypes.object),
  reviews: PropTypes.arrayOf(PropTypes.object),
}

AnalyticsSection.defaultProps = {
  bookings: [],
  buses: [],
  routes: [],
  schedules: [],
  reviews: [],
}
