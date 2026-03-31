import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-report-list',
  standalone: true,
  templateUrl: './report-list.html',
  styleUrl: './report-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportList {}