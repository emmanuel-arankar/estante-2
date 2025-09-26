import { Suspense, ElementType } from 'react';
import { LoadingSpinner } from '../components/ui/loading-spinner';

// Define o componente de fallback em um só lugar
const RouteFallback = () => (
  <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Define e exporta a função HOC (Higher-Order Component)
export const withSuspense = (Component: ElementType) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);