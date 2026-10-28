import { Link } from 'react-router-dom';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { buttonClasses } from '../components';

export function NotFoundPage() {
  useDocumentHead('Página no encontrada');
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="text-xl font-semibold text-text">No encontramos esa página</h1>
      <p className="text-text-muted">El enlace puede estar roto o la página ya no existe.</p>
      <Link to="/" className={buttonClasses('primary')}>
        Volver al inicio
      </Link>
    </div>
  );
}
