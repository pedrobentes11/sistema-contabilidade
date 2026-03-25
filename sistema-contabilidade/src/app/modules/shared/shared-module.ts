import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Ngx Mask
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
// Ngx Currency
import { NgxCurrencyDirective } from 'ngx-currency';

const MATERIAL_MODULES = [
  MatTableModule, MatPaginatorModule, MatSortModule,
  MatFormFieldModule, MatInputModule, MatSelectModule,
  MatButtonModule, MatIconModule, MatCardModule,
  MatDialogModule, MatSnackBarModule, MatTooltipModule,
  MatChipsModule, MatBadgeModule, MatDatepickerModule,
  MatNativeDateModule, MatProgressSpinnerModule, MatTabsModule,
  MatExpansionModule, MatMenuModule, MatDividerModule,
  MatCheckboxModule, MatRadioModule, MatStepperModule,
  MatAutocompleteModule, MatProgressBarModule,
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NgxMaskDirective,
    NgxMaskPipe,
    NgxCurrencyDirective,
    ...MATERIAL_MODULES,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NgxMaskDirective,
    NgxMaskPipe,
    NgxCurrencyDirective,
    ...MATERIAL_MODULES,
  ],
  providers: [provideNgxMask()],
})
export class SharedModule {}
