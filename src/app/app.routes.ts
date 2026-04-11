import { Routes } from '@angular/router';

import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

import { Login } from './features/auth/pages/login/login';
import { PrivateLayout } from './layout/private-layout/private-layout';

import { AdminHome } from './features/dashboard/pages/admin-home/admin-home';
import { CashierOrders } from './features/orders/pages/cashier-orders/cashier-orders';
import { SalesList } from './features/sales/pages/sales-list/sales-list';
import { MyAccount } from './features/profile/pages/my-account/my-account';
import { ProductList } from './features/products/pages/product-list/product-list';
import { CategoryList } from './features/categories/pages/category-list/category-list';
import { ReportList } from './features/reports/pages/report-list/report-list';
import { UserList } from './features/users/pages/user-list/user-list';
import { DailySessionList } from './features/daily-sessions/pages/daily-session-list/daily-session-list';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'app',
    component: PrivateLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        component: AdminHome,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CASHIER'] },
      },
      {
        path: 'pedidos',
        component: CashierOrders,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CASHIER'] },
      },
      {
        path: 'ventas',
        component: SalesList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CASHIER'] },
      },
      {
        path: 'mi-cuenta',
        component: MyAccount,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CASHIER'] },
      },
      {
        path: 'productos',
        component: ProductList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'categorias',
        component: CategoryList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'reportes',
        component: ReportList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'usuarios',
        component: UserList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'jornada',
        component: DailySessionList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'pedidos',
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];