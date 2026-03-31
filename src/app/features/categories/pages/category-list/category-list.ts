import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-category-list',
  standalone: true,
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryList {}