import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number; // Auto-dismiss after this many milliseconds (0 = no auto-dismiss)
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  /**
   * Show a success notification
   */
  showSuccess(title: string, message: string, duration: number = 3000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Show an error notification
   */
  showError(title: string, message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration
    });
  }

  /**
   * Show an info notification
   */
  showInfo(title: string, message: string, duration: number = 4000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Show a warning notification
   */
  showWarning(title: string, message: string, duration: number = 4000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Add a notification to the list
   */
  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [...currentNotifications, notification];
    this.notificationsSubject.next(updatedNotifications);

    // Auto-dismiss if duration is specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Get current notifications
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Generate a unique ID for notifications
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
