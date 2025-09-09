export interface RegisterUserDto {
  name: string;
  email: string;
  password: string;
  confirmationPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  permission: string;
}

export interface UpdateUserDto {
  userId: string;
  name: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}


