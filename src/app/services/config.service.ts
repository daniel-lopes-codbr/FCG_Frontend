import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiUrls {
  userApi: string;
  gameLibraryApi: string;
  paymentsApi: string;
}

export interface AppConfig {
  apiUrls: ApiUrls;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  loadConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>('/assets/config.json');
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  setConfig(config: AppConfig): void {
    this.config = config;
  }

  getApiUrl(apiName: keyof ApiUrls): string {
    return this.getConfig().apiUrls[apiName];
  }
}
