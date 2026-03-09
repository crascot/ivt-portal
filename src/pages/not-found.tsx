import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="button">
        Go back to Home
      </Link>
    </div>
  );
};

export default NotFound;
