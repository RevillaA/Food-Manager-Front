export type AppRole = 'ADMIN' | 'CASHIER';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  roles: AppRole[];
}

export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
  ADMIN: '/app/inicio',
  CASHIER: '/app/pedidos',
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Inicio',
    route: '/app/inicio',
    icon: 'dashboard',
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    label: 'Pedidos',
    route: '/app/pedidos',
    icon: 'receipt_long',
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    label: 'Productos',
    route: '/app/productos',
    icon: 'inventory_2',
    roles: ['ADMIN'],
  },
  {
    label: 'Categorías',
    route: '/app/categorias',
    icon: 'category',
    roles: ['ADMIN'],
  },
  {
    label: 'Ventas',
    route: '/app/ventas',
    icon: 'point_of_sale',
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    label: 'Reportes',
    route: '/app/reportes',
    icon: 'bar_chart',
    roles: ['ADMIN'],
  },
  {
    label: 'Usuarios',
    route: '/app/usuarios',
    icon: 'group',
    roles: ['ADMIN'],
  },
  {
    label: 'Jornada',
    route: '/app/jornada',
    icon: 'today',
    roles: ['ADMIN'],
  },
  {
    label: 'Mi cuenta',
    route: '/app/mi-cuenta',
    icon: 'person',
    roles: ['ADMIN', 'CASHIER'],
  },
];