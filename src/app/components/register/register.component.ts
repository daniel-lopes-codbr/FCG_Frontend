import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  darkMode$ = this.themeService.darkMode$;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator()
      ]],
      confirmationPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordStrengthValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.value;
      if (!password) return null;

      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      const errors: ValidationErrors = {};

      if (!hasUpperCase) errors['noUpperCase'] = true;
      if (!hasLowerCase) errors['noLowerCase'] = true;
      if (!hasNumbers) errors['noNumbers'] = true;
      if (!hasSpecialChar) errors['noSpecialChar'] = true;

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmationPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const userData = this.registerForm.value;

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate(['/login'], {
            queryParams: { message: 'Registration successful! Please log in.' }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);

    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }

    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
    }

    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be no more than ${maxLength} characters`;
    }

    return '';
  }

  getPasswordStrengthMessage(): string {
    const passwordControl = this.registerForm.get('password');
    if (!passwordControl || !passwordControl.touched) return '';

    const errors = passwordControl.errors;
    if (!errors) return '';

    const messages: string[] = [];

    if (errors['noUpperCase']) messages.push('One uppercase letter');
    if (errors['noLowerCase']) messages.push('One lowercase letter');
    if (errors['noNumbers']) messages.push('One number');
    if (errors['noSpecialChar']) messages.push('One special character');

    return messages.length > 0 ? `Password must contain: ${messages.join(', ')}` : '';
  }

  getPasswordMatchMessage(): string {
    if (this.registerForm.hasError('passwordMismatch') &&
        this.registerForm.get('confirmationPassword')?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }
}
