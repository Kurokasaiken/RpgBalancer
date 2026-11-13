import type { ComponentType, LazyExoticComponent } from 'react';
export { LAB_PATHS, LAB_PATHS_SET } from './labRouteData';
export type LabRouteComponents = Record<string, LazyExoticComponent<ComponentType>>;

// Profilo slim (VITE_DEPLOY_SLIM): nessun componente lab -> nessun import() nel grafo.
export const LAB_ROUTE_COMPONENTS: LabRouteComponents = {};
