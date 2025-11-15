import React from 'react';
import '../../css/footer.css';

const FooterNew = () => (
  <footer className="site-footer">
    <div className="container">
      <p>© {new Date().getFullYear()} Ticket Nepal — Built for demo</p>
    </div>
  </footer>
);

export default FooterNew;
