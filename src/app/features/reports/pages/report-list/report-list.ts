import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { ReportsService } from '../../services/reports';
import { DailySalesReport } from '../../models/daily-sales-report.interface';
import { SalesRangeReportData } from '../../models/sales-range-report.interface';
import { TopSellingProduct } from '../../models/top-selling-product.interface';
import { CategorySummaryReport } from '../../models/category-summary-report.interface';
import { DailySessionsService } from '../../../daily-sessions/services/daily-sessions';
import { Sale } from '../../../sales/models/sale.interface';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './report-list.html',
  styleUrl: './report-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportList implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly dailySessionsService = inject(DailySessionsService);
  private readonly sessionService = inject(SessionService);

  readonly isLoadingDaily = signal(true);
  readonly isLoadingRange = signal(false);
  readonly isLoadingTopProducts = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly dailyReport = signal<DailySalesReport | null>(null);
  readonly rangeReport = signal<SalesRangeReportData | null>(null);
  readonly topProducts = signal<TopSellingProduct[]>([]);
  readonly categorySummary = signal<CategorySummaryReport | null>(null);

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  readonly todayDate = this.getTodayDateString();

  readonly dailyDateFilter = signal(this.todayDate);
  readonly rangeDateFromFilter = signal(this.todayDate);
  readonly rangeDateToFilter = signal(this.todayDate);

  readonly averageTicket = computed(() => {
    const report = this.dailyReport();

    if (!report || !report.total_sales_count) {
      return 0;
    }

    return report.total_sales_amount / report.total_sales_count;
  });

  readonly rangeAverageTicket = computed(() => {
    const report = this.rangeReport();
    const salesCount = report?.summary.total_sales_count ?? 0;

    if (!salesCount) {
      return 0;
    }

    return (report?.summary.total_sales_amount ?? 0) / salesCount;
  });

  readonly totalCategoriesInRange = computed(() => {
    return this.categorySummary()?.categories.length ?? 0;
  });

  readonly leadingProduct = computed(() => {
    return this.topProducts()[0] ?? null;
  });

  readonly isBusy = computed(() => {
    return (
      this.isLoadingDaily() ||
      this.isLoadingRange() ||
      this.isLoadingTopProducts() ||
      this.isLoadingCategories()
    );
  });

  ngOnInit(): void {
    this.loadInitialReports();
  }

  private loadInitialReports(): void {
    const fallbackDate = this.todayDate;

    this.dailySessionsService.getActiveDailySession().subscribe({
      next: (response) => {
        const sessionDate = this.normalizeDateValue(response.data.session_date) || fallbackDate;
        this.initializeReportsForDate(sessionDate);
      },
      error: () => {
        this.loadInitialReportsFromLatestSession(fallbackDate);
      },
    });
  }

  private loadInitialReportsFromLatestSession(fallbackDate: string): void {
    this.dailySessionsService.getDailySessions(1, 1).subscribe({
      next: (response) => {
        const latestSessionDate =
          this.normalizeDateValue(response.data[0]?.session_date) || fallbackDate;
        this.initializeReportsForDate(latestSessionDate);
      },
      error: () => {
        this.initializeReportsForDate(fallbackDate);
      },
    });
  }

  private initializeReportsForDate(date: string): void {
    this.setDefaultDateFilters(date);
    this.loadDailyReport();
    this.loadRangeReports();
  }

  loadDailyReport(): void {
    this.isLoadingDaily.set(true);
    this.errorMessage.set(null);

    this.reportsService.getDailySalesReport(this.dailyDateFilter()).subscribe({
      next: (response) => {
        this.dailyReport.set(response.data);
        this.isLoadingDaily.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingDaily.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el reporte diario.'
        );
      },
    });
  }

  loadRangeReports(targetPage = this.page()): void {
    const dateFrom = this.rangeDateFromFilter();
    const dateTo = this.rangeDateToFilter();

    if (!dateFrom || !dateTo) {
      this.errorMessage.set('Debes seleccionar fecha inicial y fecha final.');
      return;
    }

    this.errorMessage.set(null);

    this.loadSalesRange(dateFrom, dateTo, targetPage);
    this.loadTopProducts(dateFrom, dateTo);
    this.loadCategorySummary(dateFrom, dateTo);
  }

  loadSalesRange(dateFrom: string, dateTo: string, targetPage = 1): void {
    this.isLoadingRange.set(true);

    this.reportsService
      .getSalesRangeReport(dateFrom, dateTo, targetPage, this.limit())
      .subscribe({
        next: (response) => {
          this.rangeReport.set(response.data);
          this.page.set(response.meta.page);
          this.limit.set(response.meta.limit);
          this.total.set(response.meta.total);
          this.totalPages.set(response.meta.totalPages);
          this.isLoadingRange.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingRange.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar el reporte por rango.'
          );
        },
      });
  }

  loadTopProducts(dateFrom: string, dateTo: string): void {
    this.isLoadingTopProducts.set(true);

    this.reportsService
      .getTopSellingProductsReport(dateFrom, dateTo, 5)
      .subscribe({
        next: (response) => {
          this.topProducts.set(response.data);
          this.isLoadingTopProducts.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoadingTopProducts.set(false);
          this.errorMessage.set(
            error.error?.message || 'No se pudo cargar el top de productos.'
          );
        },
      });
  }

  loadCategorySummary(dateFrom: string, dateTo: string): void {
    this.isLoadingCategories.set(true);

    this.reportsService.getCategorySummaryReport(dateFrom, dateTo).subscribe({
      next: (response) => {
        this.categorySummary.set(response.data);
        this.isLoadingCategories.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingCategories.set(false);
        this.errorMessage.set(
          error.error?.message || 'No se pudo cargar el resumen por categorías.'
        );
      },
    });
  }

  applyDailyFilter(): void {
    this.loadDailyReport();
  }

  applyRangeFilters(): void {
    this.loadRangeReports(1);
  }

  refreshAll(): void {
    this.loadDailyReport();
    this.loadRangeReports(this.page());
  }

  printDailyReport(): void {
    const report = this.dailyReport();

    if (!report) {
      this.errorMessage.set('Primero carga el reporte diario para poder imprimirlo.');
      return;
    }

    const salesRows = this.buildSalesRows(report.sales);
    const currentUser = this.sessionService.getUser();
    const emittedAt = this.formatDate(new Date(), true);

    const content = `
      <header class="report-header">
        <h1>REVIS FOOD CONTROL</h1>
        <h2>Reporte Diario de Ventas</h2>
        <p><strong>Fecha de emisión:</strong> ${this.escapeHtml(emittedAt)}</p>
        <p><strong>Usuario responsable:</strong> ${this.escapeHtml(currentUser?.full_name || '-')}</p>
        <p><strong>Rol:</strong> ${this.escapeHtml(this.getRoleLabel(currentUser?.role?.name))}</p>
        <p><strong>Sistema:</strong> Revis Food Control</p>
      </header>

      <section>
        <h3>Corte diario - ${this.escapeHtml(this.formatDate(report.date, false))}</h3>
        <div class="kpi-grid">
          <div class="kpi-card"><span>Total vendido del día</span><strong>${this.formatCurrency(report.total_sales_amount)}</strong></div>
          <div class="kpi-card"><span>Ventas registradas</span><strong>${report.total_sales_count}</strong></div>
          <div class="kpi-card"><span>Ticket promedio</span><strong>${this.formatCurrency(this.averageTicket())}</strong></div>
          <div class="kpi-card"><span>Fecha del corte</span><strong>${this.escapeHtml(this.formatDate(report.date, false))}</strong></div>
        </div>
      </section>

      <section>
        <h3>Resumen por categorías del día</h3>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-right">Total vendido</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Platos</td><td class="text-right">${this.formatCurrency(report.totals_by_category.MAIN_DISH)}</td></tr>
            <tr><td>Bebidas</td><td class="text-right">${this.formatCurrency(report.totals_by_category.DRINK)}</td></tr>
            <tr><td>Extras</td><td class="text-right">${this.formatCurrency(report.totals_by_category.EXTRA)}</td></tr>
            <tr><td>Dulces</td><td class="text-right">${this.formatCurrency(report.totals_by_category.SWEET)}</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>Detalle de ventas del día</h3>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>ID Venta</th>
              <th>Estado</th>
              <th>Método de pago</th>
              <th class="text-right">Total</th>
              <th>Usuario</th>
              <th>Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows || '<tr><td colspan="7">No hay ventas registradas para este día.</td></tr>'}
          </tbody>
        </table>
        <p class="table-footer">Total de registros: ${report.sales.length}</p>
      </section>

      <footer>
        <p><strong>Observaciones:</strong></p>
        <p>El presente reporte resume la actividad de ventas registrada en el sistema para la jornada seleccionada.</p>
        <p>Los valores reflejan la información almacenada al momento de la generación del documento.</p>
        <p><strong>Generado por:</strong> Revis Food Control</p>
        <p><strong>Fecha y hora de generación:</strong> ${this.escapeHtml(emittedAt)}</p>
      </footer>
    `;

    this.printDocument('Reporte Diario de Ventas', content);
  }

  printConsolidatedReport(): void {
    const rangeReport = this.rangeReport();

    if (!rangeReport) {
      this.errorMessage.set('Primero carga el reporte por rango para poder imprimirlo.');
      return;
    }

    const categories = this.categorySummary()?.categories ?? [];
    const topProducts = this.topProducts();
    const currentUser = this.sessionService.getUser();
    const emittedAt = this.formatDate(new Date(), true);

    const salesRows = this.buildSalesRows(rangeReport.sales);
    const topProductsRows = topProducts
      .map(
        (product, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(product.product_name)}</td>
            <td>${this.escapeHtml(product.product_category_name)}</td>
            <td class="text-right">${product.total_quantity_sold}</td>
            <td class="text-right">${this.formatCurrency(product.total_amount)}</td>
          </tr>
        `
      )
      .join('');

    const categoryRows = categories
      .map(
        (category) => `
          <tr>
            <td>${this.escapeHtml(category.category_name)}</td>
            <td class="text-right">${category.total_quantity}</td>
            <td class="text-right">${this.formatCurrency(category.total_amount)}</td>
          </tr>
        `
      )
      .join('');

    const content = `
      <header class="report-header">
        <h1>REVIS FOOD CONTROL</h1>
        <h2>Reporte Consolidado de Ventas</h2>
        <p><strong>Fecha de emisión:</strong> ${this.escapeHtml(emittedAt)}</p>
        <p><strong>Usuario responsable:</strong> ${this.escapeHtml(currentUser?.full_name || '-')}</p>
        <p><strong>Rol:</strong> ${this.escapeHtml(this.getRoleLabel(currentUser?.role?.name))}</p>
        <p><strong>Sistema:</strong> Revis Food Control</p>
      </header>

      <section>
        <h3>Análisis por rango de fechas</h3>
        <p><strong>Período analizado:</strong> del ${this.escapeHtml(this.formatDate(rangeReport.summary.date_from, false))} al ${this.escapeHtml(this.formatDate(rangeReport.summary.date_to, false))}</p>
        <div class="kpi-grid">
          <div class="kpi-card"><span>Total vendido</span><strong>${this.formatCurrency(rangeReport.summary.total_sales_amount)}</strong></div>
          <div class="kpi-card"><span>Ventas del rango</span><strong>${rangeReport.summary.total_sales_count}</strong></div>
          <div class="kpi-card"><span>Ticket promedio</span><strong>${this.formatCurrency(this.rangeAverageTicket())}</strong></div>
          <div class="kpi-card"><span>Categorías con movimiento</span><strong>${this.totalCategoriesInRange()}</strong></div>
        </div>
      </section>

      <section>
        <h3>Detalle de ventas</h3>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>ID Venta</th>
              <th>Estado</th>
              <th>Método de pago</th>
              <th class="text-right">Total</th>
              <th>Usuario</th>
              <th>Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows || '<tr><td colspan="7">No hay ventas registradas en este período.</td></tr>'}
          </tbody>
        </table>
        <p class="table-footer">Total de registros: ${rangeReport.sales.length}</p>
      </section>

      <section>
        <h3>Top de productos</h3>
        <table>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th class="text-right">Unidades vendidas</th>
              <th class="text-right">Total vendido</th>
            </tr>
          </thead>
          <tbody>
            ${topProductsRows || '<tr><td colspan="5">No hay productos vendidos en este rango.</td></tr>'}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Resumen por categorías</h3>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-right">Productos vendidos</th>
              <th class="text-right">Total vendido</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows || '<tr><td colspan="3">No hay categorías con movimiento en este rango.</td></tr>'}
          </tbody>
        </table>
      </section>

      <footer>
        <p><strong>Observaciones:</strong></p>
        <p>El presente reporte resume la actividad de ventas registrada en el sistema dentro del período seleccionado.</p>
        <p>Los valores reflejan la información almacenada al momento de la generación del documento.</p>
        <p><strong>Generado por:</strong> Revis Food Control</p>
        <p><strong>Fecha y hora de generación:</strong> ${this.escapeHtml(emittedAt)}</p>
      </footer>
    `;

    this.printDocument('Reporte Consolidado de Ventas', content);
  }

  onDailyDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dailyDateFilter.set(target.value);
  }

  onRangeDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.rangeDateFromFilter.set(target.value);
  }

  onRangeDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.rangeDateToFilter.set(target.value);
  }

  goToPreviousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.loadSalesRange(
      this.rangeDateFromFilter(),
      this.rangeDateToFilter(),
      this.page() - 1
    );
  }

  goToNextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.loadSalesRange(
      this.rangeDateFromFilter(),
      this.rangeDateToFilter(),
      this.page() + 1
    );
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Pagada';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'TRANSFER':
        return 'Transferencia';
      default:
        return method;
    }
  }

  getSaleInitial(saleNumber: number | string): string {
    return String(saleNumber).charAt(0).toUpperCase();
  }

  getSaleDisplayIdentifier(sale: Sale): string {
    const formattedDate = this.getCompactDate(sale.created_at);
    const paddedSaleNumber = String(sale.sale_number).padStart(3, '0');

    return `VENTA-${paddedSaleNumber}-${formattedDate}`;
  }

  getProductInitial(productName: string): string {
    return productName.trim().charAt(0).toUpperCase() || 'P';
  }

  getCategoryInitial(categoryName: string): string {
    return categoryName.trim().charAt(0).toUpperCase() || 'C';
  }

  getProductProgress(totalAmount: number): number {
    const topAmount = this.leadingProduct()?.total_amount ?? 0;

    if (!topAmount) {
      return 0;
    }

    return Math.min((totalAmount / topAmount) * 100, 100);
  }

  private setDefaultDateFilters(date: string): void {
    this.dailyDateFilter.set(date);
    this.rangeDateFromFilter.set(date);
    this.rangeDateToFilter.set(date);
  }

  private normalizeDateValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getCompactDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '00000000';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  private buildSalesRows(sales: Sale[]): string {
    return sales
      .map(
        (sale, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(this.getSaleDisplayIdentifier(sale))}</td>
            <td>${this.escapeHtml(this.getPaymentStatusLabel(sale.payment_status))}</td>
            <td>${this.escapeHtml(this.getPaymentMethodLabel(sale.payment_method))}</td>
            <td class="text-right">${this.formatCurrency(sale.total)}</td>
            <td>${this.escapeHtml(sale.created_by_user.full_name)}</td>
            <td>${this.escapeHtml(this.formatDate(sale.created_at, true))}</td>
          </tr>
        `
      )
      .join('');
  }

  private printDocument(title: string, content: string): void {
    const printWindow = window.open('', '_blank', 'width=1100,height=900');

    if (!printWindow) {
      this.errorMessage.set('No se pudo abrir la ventana de impresión.');
      return;
    }

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>${this.escapeHtml(title)}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              color: #111111;
              font-size: 11px;
              line-height: 1.45;
              margin: 0;
            }
            .report-header {
              border-bottom: 2px solid #111111;
              padding-bottom: 10px;
              margin-bottom: 18px;
            }
            h1 {
              margin: 0;
              font-size: 22px;
            }
            h2 {
              margin: 4px 0 10px;
              font-size: 16px;
            }
            h3 {
              margin: 0 0 10px;
              font-size: 14px;
            }
            p {
              margin: 4px 0;
            }
            section {
              margin-bottom: 16px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
              margin-top: 10px;
            }
            .kpi-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 8px 10px;
              background: #fafafa;
            }
            .kpi-card span {
              display: block;
              color: #6b7280;
              font-size: 10px;
              margin-bottom: 4px;
            }
            .kpi-card strong {
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 7px 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
              font-weight: 700;
            }
            tr:nth-child(even) td {
              background: #fcfcfd;
            }
            .text-right {
              text-align: right;
            }
            .table-footer {
              margin-top: 6px;
              font-weight: 700;
            }
            footer {
              border-top: 1px solid #d1d5db;
              margin-top: 18px;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private formatDate(value: string | Date, includeTime: boolean): string {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
          }
        : {}),
    }).format(date);
  }

  private formatCurrency(value: number): string {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
  }

  private getRoleLabel(roleName?: string): string {
    switch (roleName) {
      case 'ADMIN':
        return 'Administrador';
      case 'CASHIER':
        return 'Cajero';
      default:
        return roleName || '-';
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
