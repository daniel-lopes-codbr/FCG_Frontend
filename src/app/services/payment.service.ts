import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

// DTOs for FCG_MS_Payments API
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  currency: string;
  externalProductId: string;
  imageUrl: string;
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  externalCustomerId: string;
  phone?: string;
  description?: string;
}

export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  externalCustomerId: string;
  phone?: string;
  description?: string;
}

export interface ProductDto {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  externalProductId: string;
  imageUrl: string;
}

export interface CheckoutSessionDto {
  sessionId: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
  customerId: string;
  productId: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  private getApiBaseUrl(): string {
    try {
      return this.configService.getApiUrl('paymentsApi') + '/api';
    } catch (error) {
      // Fallback to localhost if config not loaded yet
      return 'http://localhost:5012/api';
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-API-Key': 'your-secure-api-key-here'
    });
  }

  // Customer Management Methods
  getCustomerByExternalId(externalCustomerId: string): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(`${this.getApiBaseUrl()}/customers/${externalCustomerId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createCustomer(customerData: CreateCustomerDto): Observable<CustomerDto> {
    return this.http.post<CustomerDto>(`${this.getApiBaseUrl()}/customers`, customerData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // Product Management Methods
  getProductByExternalId(externalProductId: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.getApiBaseUrl()}/products/${externalProductId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createProduct(productData: CreateProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.getApiBaseUrl()}/products`, productData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // Checkout Methods
  createCheckoutSession(customerId: string, productIds: string[]): Observable<CheckoutSessionDto> {
    // For MVP, we'll create a checkout for the first product only
    // In a real implementation, you might want to create multiple payment intents or handle multiple products differently
    const productId = productIds[0];
    const quantity = productIds.length; // Total quantity based on number of products

    const checkoutData = {
      customerId: customerId,
      productId: productId,
      quantity: quantity
    };

    return this.http.post<CheckoutSessionDto>(`${this.getApiBaseUrl()}/checkout`, checkoutData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      // Network error
      errorMessage = 'Unable to connect to the payment service. Please make sure the FCG_MS_Payments API is running.';
    } else if (error.status === 400) {
      errorMessage = 'Bad request. Please check your input.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'Forbidden. You do not have permission to access this resource.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.status === 500) {
      errorMessage = 'Internal server error. Please try again later.';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Payment service error:', error);
    const customError = new Error(errorMessage) as any;
    customError.status = error.status;
    return throwError(() => customError);
  }
}
