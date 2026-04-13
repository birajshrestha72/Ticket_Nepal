const PlaceholderPage = ({ title, description }) => {
  return (
    <section className="container page-shell">
      <h1>{title}</h1>
      <p>{description || 'This page is ready for your original code integration.'}</p>
    </section>
  )
}

export default PlaceholderPage
