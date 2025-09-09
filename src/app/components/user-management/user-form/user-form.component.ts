import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AdminOnlyService, UserDto, CreateUserDto, UpdateUserDto } from '../../../services/admin-only.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  @Input() user: UserDto | null = null;
  @Input() isEdit = false;
  @Output() userSaved = new EventEmitter<UserDto>();
  @Output() cancelled = new EventEmitter<void>();

  userForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminOnlyService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEdit ? [] : [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator()
      ]],
      confirmationPassword: ['', this.isEdit ? [] : [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    if (this.isEdit && this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email
      });
    }
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
    if (this.userForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.userForm.value;

      if (this.isEdit && this.user) {
        const updateData: UpdateUserDto = {
          userId: this.user.id,
          name: formData.name,
          email: formData.email
        };

        this.adminService.updateUser(updateData).subscribe({
          next: (updatedUser) => {
            this.isLoading = false;
            this.userSaved.emit(updatedUser);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Failed to update user';
          }
        });
      } else {
        const createData: CreateUserDto = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmationPassword: formData.confirmationPassword
        };

        this.adminService.createUser(createData).subscribe({
          next: (newUser) => {
            this.isLoading = false;
            this.userSaved.emit(newUser);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Failed to create user';
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);

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
    const passwordControl = this.userForm.get('password');
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
    if (this.userForm.hasError('passwordMismatch') &&
        this.userForm.get('confirmationPassword')?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }
}
