import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthUser, LoginResponse } from '../models/auth.model';

/**
 * Frontend-only authentication against the CampusEats demo auth endpoints.
 * This gates navigation in the Angular app; it is not a substitute for the
 * backend enforcing its own access rules.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private api = environment.apiUrl;
  private storageKey = 'campuseats-auth';

  private stored = this.loadStored();
  private userSig = signal<AuthUser | null>(this.stored?.user ?? null);
  private tokenSig = signal<string | null>(this.stored?.token ?? null);
  private busy = signal(false);
  private failed = signal(false);

  readonly user = this.userSig.asReadonly();
  readonly token = this.tokenSig.asReadonly();
  readonly loading = this.busy.asReadonly();
  readonly error = this.failed.asReadonly();

  readonly isAuthenticated = computed(() => this.tokenSig() !== null);

  async login(email: string, password: string): Promise<AuthUser> {
    this.busy.set(true);
    this.failed.set(false);

    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.api}/auth/login`, {
          email,
          password,
        })
      );

      this.userSig.set(response.user);
      this.tokenSig.set(response.token);
      this.saveToStorage(response);

      return response.user;
    } catch (err) {
      this.failed.set(true);
      throw err;
    } finally {
      this.busy.set(false);
    }
  }

  logout(): void {
    this.userSig.set(null);
    this.tokenSig.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private saveToStorage(response: LoginResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(response));
  }

  private loadStored(): LoginResponse | null {
    const saved = localStorage.getItem(this.storageKey);

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as LoginResponse;
    } catch {
      return null;
    }
  }
}
