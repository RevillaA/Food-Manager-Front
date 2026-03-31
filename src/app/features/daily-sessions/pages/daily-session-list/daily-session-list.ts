import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-daily-session-list',
  standalone: true,
  templateUrl: './daily-session-list.html',
  styleUrl: './daily-session-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySessionList {}